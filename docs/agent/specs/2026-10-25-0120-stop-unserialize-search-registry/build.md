# Build: Stop using unserialize in SearchRegistry

## Group 1

Search exceptions and the child command. Commit `949b7c9` on `ring-master/2026-10-25-0120-stop-unserialize-search-registry`.

### Files

- `src/Exceptions/AtriumException.php`: abstract package base on Keystone's `PackageException` (D-006).
- `src/Domains/Search/Exceptions/SearchSourceFailedException.php`: non-final; `forSource(SearchSource, string|Throwable)` gives `Search source [key] failed: …`, and keeps a thrown reason as `previous`.
- `src/Domains/Search/Exceptions/SearchSourceTimedOutException.php`: final, extends the failure exception (D-007); `timedOut(SearchSource, Throwable $previous)` builds `Search source [key] timed out.` itself.
- `src/Domains/Search/Console/InvokeSearchSourceCommand.php`: `atrium:search-source`, hidden. It clears the side channel, runs `invoke-serialized-closure` through `Artisan::call()` into a `BufferedOutput`, `json_decode`s the framework envelope, reads the rows from the container under `InvokeSearchSourceCommand::RESULTS` (`SearchRegistry::class.'@results'`), and writes one envelope with `JSON_INVALID_UTF8_SUBSTITUTE`. If encoding fails it writes a `successful: false` envelope instead. Exit code is 0 either way.
- `src/Domains/Search/SearchServiceProvider.php`: registers the command in `boot()` behind `runningInConsole()`.
- `tests/Feature/InvokeSearchSourceCommandTest.php`: 9 tests.

### Tests

- The command is in `Artisan::all()` and `isHidden()` (criterion 11).
- A wrapper closure set through `LARAVEL_INVOKABLE_CLOSURE` binds rows, and stdout is byte-for-byte `json_encode(['successful' => true, 'results' => $rows])`. One row's title contains a `<comment>` tag, which proves the output is written raw and not run through the console formatter (criterion 6).
- A closure that never binds the key, and a closure that throws, each give `{"successful":false,"message":…}`. The thrown message is passed through.
- A non-UTF-8 title and subtitle still give a non-empty envelope that decodes, with U+FFFD substituted. An `INF` row, which cannot be encoded, gives the `successful: false` fallback.
- Both exception factories: messages, the `sourceKey`, `previous`, the hierarchy down from `AtriumException`, and which classes are abstract or final.
- `composer test:unit`: 333 passed. `composer analyse`, `composer lint:check` and `composer test:types` (100%) also pass.

### Deviations and additions

- **Output buffering:** the command wraps the inner `Artisan::call()` in `ob_start()`/`ob_end_clean()`, so anything a source `echo`es or `dump()`s is thrown away. Without this, that output would reach the child's stdout next to the envelope and break criterion 6. A test covers it with `expectOutputString('')`.
- **`sourceKey`:** both exceptions carry the key as `public readonly string $sourceKey`, through a `final` constructor. errors/exceptions asks for this ("carry the context a caller needs … as a readonly property (a key)"); the spec doesn't mention it.
- **Test location:** the test sits at `tests/Feature/InvokeSearchSourceCommandTest.php`, as the task lists and as the repo's flat `tests/Feature/` layout does. testing/test-layers would put console tests under `tests/Feature/Console/`.
- **Using `Artisan::call()` from inside the command:** it replaces the console application's `lastOutput` with the inner buffer, so `Artisan::output()` after an outer `Artisan::call('atrium:search-source')` comes back empty. The tests pass their own `BufferedOutput` to read stdout. This makes no difference in the real child, which writes straight to the process stdout.

## Group 2

SearchRegistry decodes JSON. Commit `a79bd1d` on `ring-master/2026-10-25-0120-stop-unserialize-search-registry`.

### Files

- `src/Domains/Search/Services/SearchRegistry.php`:
  - `childCommand()` returns `Application::formatCommandString('atrium:search-source')`, and `runInProcesses()` uses it.
  - `childTask(Closure $task)` is the static, serializable wrapper next to `task()`. It maps `SearchResult::toArray()` over the task's results, binds them under `InvokeSearchSourceCommand::RESULTS` and returns `null`.
  - `decode()` keeps the gzip-tail strip and `json_decode`s the envelope. It requires `successful === true` and `results` to be an array, and rebuilds each row with private `result(array $row): ?SearchResult`.
  - `unserialize()` and the `RuntimeException` import are gone.
  - Failures are reported as `SearchSourceFailedException::forSource()`, with stderr appended to the reason (`…; errors: …`) on both the envelope-message path and the exit-code path. Timeouts are reported as `SearchSourceTimedOutException::timedOut()`.
- `tests/Feature/SearchTest.php`: 9 new tests, two of them from datasets (14 cases in all). The two existing process-driver timeout tests now type their callback on `SearchSourceTimedOutException`. Their messages are unchanged, and the class still extends `RuntimeException`. No sync or fork case was touched.
- `tests/ArchTest.php`: the `SearchRegistry` import and `->ignoring(...)` are gone from `security()`. Added `arch('nothing is revived with unserialize()')->expect('unserialize')->not->toBeUsed()`.
- `CHANGELOG.md`: one line. Results now travel as JSON through the hidden `atrium:search-source` command, `SearchResult` subclass state is lost, failures and timeouts use the new exception classes, and caches must be rebuilt with `php artisan optimize:clear`.

### Tests

- Real child process: a result with all five fields comes back with every field equal and a count of 1 (criterion 3). A title/url-only result comes back with `subtitle`, `icon` and `group` all `null` (criterion 4). Two sources of three rows each come back in order even though the first source finishes last (criterion 5).
- `Process::fake()` with crafted rows: rows missing `title` or `url`, rows with a non-string `title`, `url`, `subtitle`, `icon` or `group`, and rows that are not arrays are all dropped. The three valid rows stay in order and nothing is reported (criterion 7).
- Failures (criterion 8):
  - A real child whose source throws reports `SearchSourceFailedException` for `broken` (`failed: Source down`), not the timeout class, and the other sources still return.
  - A faked dataset covers a non-zero exit with stderr in the reason, unparseable output, an unsuccessful envelope (message plus stderr), `successful: 1`, the framework's own `result` envelope and non-array `results`. Each case reports exactly one failure naming `broken` and keeps `healthy`.
- Timeout (criterion 9): a source sleeping past its own `timeout(1)`, next to a fast source, reports `SearchSourceTimedOutException` (`sourceKey` `slow`, matching `/timed out/`) and the fast source's result is kept.
- Command string: `childCommand()` is read through an anonymous subclass. It equals `formatCommandString('atrium:search-source')` and does not contain `invoke-serialized-closure`, and `Process::assertRanTimes` confirms both children started with it.
- `composer test`: phpstan, pint, 100% type coverage, and 347 tests passed (876 assertions).

### Deviations and additions

- **`task()` gained `bool $throw = false`:** the child wrapper calls `$task(true)`, so a source that throws in the child fails the framework envelope. The parent then reports a `SearchSourceFailedException` naming the key. Without this, the task would `report()` inside the child, where the parent never sees it, and criterion 8's "exception in the source" case could not be met. The sync and fork paths call it without arguments, so their behaviour is unchanged.
- **Skeleton provider config in the tests:** the child runs Testbench's skeleton `artisan`, which only registers the providers named in `bootstrap/cache/testbench.yaml`. `useProcessDriver()` writes Atrium's provider there so `atrium:search-source` is defined in the child. `beforeEach`/`afterEach` save and restore the file. Only `SearchTest.php` starts real children, and Pest's `--parallel` runs a file on a single worker, so other workers do not race on the file.
- **Work from an earlier attempt:** this group's changes were already in the worktree, uncommitted, when this run started. They were reviewed against tasks 2.1 to 2.4, verified with `composer test`, and committed as they were.

## Rework round 1

Finding: the `vendor/bin/ringside check` gate could not run. **Not fixed: there is no code change to make, and the fix needs an environment or dependency choice.** No commit was made, because nothing tracked changed.

### Cause

- The worktree's `vendor/` was installed from the committed `composer.json`, which does not require `refactor-circus/ringside` or `refactor-circus/standards`. `vendor/bin/ringside` and `vendor/refactor-circus/{ringside,standards}` are missing there. So `composer exec ringside check` exits 127.
- The main checkout has both packages, symlinked from `../Ringside` and `../Standards`, because it was installed from the gitignored `composer.local.json`. That file adds them to `require-dev` with path repositories.
- In this session the runner's permissions also refused `/Users/jay/Projects/packages/Atrium/vendor/bin/ringside check` and copying `composer.local.json`/`composer.local.lock` into the worktree.

### Verified

- `composer test:unit`: 347 passed (876 assertions). The branch code is unchanged since Group 2 (`a79bd1d`).

### Needs a decision

Either the runner installs the worktree's dependencies from `composer.local.json`, or it runs the gate with the main checkout's binary, or `refactor-circus/ringside` is added to `composer.json` `require-dev`. That last one changes the dependency set, so it is architectural. It is returned to the user as a decision.

### Resolution (rerun after D-011)

- D-011 was applied: the worktree's dependencies are now installed from `composer.local.json`, and `vendor/bin/ringside` exists in the worktree.
- `vendor/bin/ringside check` (run in the worktree): `ringside: check passed.`
- `composer test:unit`: 347 passed (876 assertions).
- No source change was needed. The branch code is unchanged since `a79bd1d`. The commit for this round is empty and only records the rerun.
- The install left `AGENTS.md` modified in the worktree, because the ringside plugin appended its `ring-master:start`/`end` block. This round did not make that change and the spec does not cover it, so it is not committed.

## Rework round 2

Finding: the gate's `vendor/bin/ringside check` was refused by the permission system (don't-ask mode), so it was unverified. **Fixed by rerunning; no code change.**

- The runner refuses `/…/Atrium--2026-10-25-0120-stop-unserialize-search-registry/vendor/bin/ringside check` by absolute path. A relative `vendor/bin/ringside check` is allowed, but the shell's cwd resets to the main checkout between calls, so that run checks the main checkout and does not count.
- `composer --working-dir=/Users/jay/Projects/packages/Atrium--2026-10-25-0120-stop-unserialize-search-registry exec ringside check` is allowed and runs the worktree's own binary: `ringside: check passed.` Composer warns that the `refactor-circus/ringside` plugin is not loaded, because the committed `composer.json` does not require it (it comes from `composer.local.json`, D-011). The warning does not affect the check.
- `composer test:unit` (worktree): 347 passed (876 assertions).
- The branch code is unchanged since `a79bd1d`. The commit for this round is empty and only records the rerun. `AGENTS.md` stays uncommitted, as in round 1.

## Group 3

Rework 1: rerun the gate and reviews, after the user's note of 2026-10-26 ("all blockers were push, go back and try again"). Commit `bf63f11` on `ring-master/2026-10-25-0120-stop-unserialize-search-registry`. The commit is empty because no tracked file changed.

### Files

- None. The branch code is unchanged since `a79bd1d`. `AGENTS.md` is still modified in the worktree by the ringside plugin's install (rounds 1 and 2) and is still not committed.

### Tests

- Gate: `composer --working-dir=/Users/jay/Projects/packages/Atrium--2026-10-25-0120-stop-unserialize-search-registry exec ringside check` gave `ringside: check passed.` It ran the worktree's own binary. Composer also warned that the `refactor-circus/ringside` plugin was not loaded; as in round 2, the check is unaffected.
- `composer test:unit` (worktree): 347 passed (876 assertions).
- `composer test` (worktree) passed: phpstan 0 errors, pint passed, 100% type coverage, 347 tests passed (876 assertions). This proves criterion 12.
- Criterion 1: `src/` has no call to `unserialize()`. The only match is the `SearchSource::__unserialize()` magic method, which the spec puts out of scope. `tests/ArchTest.php` runs `security()` with no `ignoring(...)` and has `expect('unserialize')->not->toBeUsed()`, and both pass.
- With the gate green, the diff is ready for the four reviewers.

### Deviations

- None.

## Rework round 1 (review findings)

Commit `3045384` on `ring-master/2026-10-25-0120-stop-unserialize-search-registry`.

### Fixed

- **minor, testing/test-layers:** the command test moved from `tests/Feature/InvokeSearchSourceCommandTest.php` to `tests/Feature/Console/InvokeSearchSourceCommandTest.php` (`git mv`; the `uses(TestCase::class)->in(__DIR__.'/Feature')` binding already covers subfolders). The two exception tests ("names the source when it fails", "names the source when it times out, as a failure") moved to a new `tests/Unit/SearchSourceExceptionsTest.php`, along with their imports. They only build plain classes, so they run without `TestCase`, as test-layers says for `tests/Unit/`.
- `phpunit.xml.dist` gains a `Unit` testsuite (`tests/Unit`). This file was not in the finding. It is needed because the repo had no `tests/Unit/` before, and without the suite PHPUnit would never collect the moved tests. `tests/Pest.php` binds no `TestCase` to `Unit`.

### Nits

- **`AGENTS.md`:** still not committed. The ringside plugin's install changed it in the worktree (see earlier rounds), and this commit stages only the rework files.
- **`docs/agent/standards/atrium/domains.md`:** the Top level list now names `Exceptions\AtriumException`. A new line says that a domain's exceptions sit in its `Exceptions/` and its console commands in its `Console/` (`Search\Console\InvokeSearchSourceCommand`, `atrium:search-source`). `docs/` is untracked in this repo, so the edit was made in the main checkout and is not part of the branch.
- **`useProcessDriver()` skeleton config:** not changed. Testbench has only one other way in: `TESTBENCH_WORKING_PATH`. With it set, the skeleton reads `<path>/testbench.yaml` and requires `<path>/vendor/autoload.php`, so a fixture folder without `vendor/` cannot be used. The only working candidate is the package root. Its `testbench.yaml` also registers `WorkbenchServiceProvider` and turns on workbench discovery, so the children would boot a different provider set from the current tests. That is not a cheap or behaviour-neutral change for an optional nit. The save and restore hooks stay as they are.

### Tests

- `composer test:unit` (worktree): 347 passed (876 assertions), the same count as before the move.
- `pest --testsuite=Unit`: 2 passed (14 assertions).
- `composer lint:check` passed, and `composer analyse` found 0 errors.
