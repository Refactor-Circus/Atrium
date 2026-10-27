# Stop using unserialize in SearchRegistry

Ticket: [#6](https://github.com/Refactor-Circus/Atrium/issues/6)

## Goal

Search results come back from the child search processes as JSON, so no `unserialize()` remains in `src/` and Pest's `security` preset passes over Atrium without a `SearchRegistry` exception. (Context only, not verified here: packages that install Atrium locally can then drop their own workarounds.)

## Acceptance criteria

1. No call to `unserialize()` exists anywhere in `src/`. Verified by criterion 2 plus an explicit `expect('unserialize')->not->toBeUsed()` in `tests/ArchTest.php`.
2. `tests/ArchTest.php` runs `arch()->preset()->security()` with no `ignoring(SearchRegistry::class)` (and no other new exception), and passes.
3. With the `process` driver, a source returning a `SearchResult` with every field set (`title`, `url`, `subtitle`, `icon`, `group`) comes back from `SearchRegistry::search()` with all five fields equal.
4. With the `process` driver, a source returning a `SearchResult` with only `title` and `url` comes back with `subtitle`, `icon` and `group` all `null`.
5. With the `process` driver, results keep their order within a source and sources keep their order, as today.
6. The child process is started with Atrium's own hidden command (not `invoke-serialized-closure` directly), and on success its stdout is exactly the envelope described under Design, with rows that are `SearchResult::toArray()` arrays, and nothing else.
7. Rows missing `title` or `url`, or with a non-string `title`, `url`, `subtitle`, `icon` or `group`, are dropped; the rest of that source's rows are kept and nothing throws.
8. A source whose child fails (exception in the source, non-zero exit, unparseable output, `successful` not `true`) is reported and contributes `[]`; the report is a `SearchSourceFailedException` naming the source key.
9. A source whose child times out is reported and contributes `[]`; the report is a `SearchSourceTimedOutException` naming the source key, and other sources' results are kept.
10. The `sync` and `fork` drivers behave as today (existing `SearchTest` cases pass unchanged).
11. The new command is registered when running in the console and is hidden from `artisan list` (asserted through `Artisan::all()` and the command's `isHidden()`; the non-console half is not tested, as Pest always runs in the console).
12. `composer test` passes.

## Design

**Child command** — `RefactorCircus\Atrium\Domains\Search\Console\InvokeSearchSourceCommand`, signature `atrium:search-source`, `$hidden = true`, registered in `SearchServiceProvider::boot()` behind `runningInConsole()`.

Per D-003 it does not unserialize anything itself:

1. It runs `Artisan::call('invoke-serialized-closure', [], $buffer)` in-process. The framework command reads `LARAVEL_INVOKABLE_CLOSURE` from the environment, unserializes and calls the closure.
2. The closure the parent sends is a wrapper around today's task: it calls the task and hands the rows back as arrays through a side channel in the child's container (bound under a private key, e.g. `SearchRegistry::class.'@results'`), then returns `null`, so the framework's `serialize()`d `result` carries nothing we need to read.
3. The command reads the framework's JSON envelope from `$buffer` (`json_decode` only). It writes `{"successful": true, "results": <rows from the container>}` only when the framework envelope says `successful: true` AND the container binding was set to an array; otherwise (framework failure, or the wrapper never ran so the binding is missing) it writes `{"successful": false, "message": <reason>}`. Exit code 0 either way, as the framework's command does.
4. Output integrity: the command writes only the envelope to stdout, in one `json_encode` call, and discards the captured framework buffer. It encodes with `JSON_INVALID_UTF8_SUBSTITUTE`; if encoding still fails it writes a `successful: false` envelope with the error message, so a non-UTF-8 title or subtitle from a database source never leaves stdout empty.

**Parent (`SearchRegistry`)**

- `runInProcesses()` starts `Application::formatCommandString('atrium:search-source')` instead of `invoke-serialized-closure`; env, timeouts, the concurrency limit and the polling loop are unchanged.
- The wrapper closure (built next to `task()`) maps `SearchResult::toArray()` over the task's results. It stays `static` and serializable like `task()`.
- `decode()` keeps the gzip-tail strip and the envelope check (now on `results` being an array), then rebuilds each row with a private `SearchRegistry::result(array $row): ?SearchResult` that returns `null` for malformed rows (criterion 7): `SearchResult::make($title, $url)` plus `subtitle()`, `icon()`, `group()` for non-null strings. `SearchResult`'s public API does not change.
- `runInProcesses()` takes the command string from a small extracted method so a test can assert it.
- `decode()` does not cap rows or output size; the `per_source` limit is already applied in `task()`, and a misbehaving source is deliberately not guarded further.
- When the child fails, the failure reason includes the process stderr (as `decode()` already supports), so an undefined-command failure reads as such and points at rebuilding caches (`php artisan optimize:clear`).
- Only the five `SearchResult::toArray()` fields round-trip; a `SearchResult` subclass or extra state a source attached is lost (`serialize()` preserved it). No in-repo class extends `SearchResult` (checked).
- Failure reports become `SearchSourceFailedException::forSource(SearchSource $source, string|Throwable $reason)`; timeout reports become `SearchSourceTimedOutException::timedOut(SearchSource $source, Throwable $previous)`, a differently named factory so no static signature is redeclared incompatibly.

**Exceptions** (errors/exceptions) — `Domains/Search/Exceptions/SearchSourceFailedException` (a non-final class, with the `forSource()` factory above), and `SearchSourceTimedOutException` (final, `timedOut()` factory) extending it, so catching the failure catches the timeout. Both descend from a top-level `RefactorCircus\Atrium\Exceptions\AtriumException` (abstract, on Keystone's package exception base). Messages keep today's wording: `Search source [key] failed: …`, `Search source [key] timed out.` (the timeout class builds this message itself in `timedOut()` and passes it with the previous throwable to the parent constructor, rather than using the `failed: …` wording of `forSource()`).

**Arch test** — drop the `SearchRegistry` import and the `->ignoring(...)` on the `security()` preset.

**Tests** (test-layers) — `tests/Feature/SearchTest.php` gains process-driver round-trip cases (criteria 3–5, 7–9); a command test covers registration, hidden flag and the envelope (criteria 6, 11).

Criteria 3-5 run through a real child `artisan` process (no faked `Process`), so the container side-channel assumption is covered; each asserts the result count as well as field equality so a silently dropped row cannot pass, and the order test uses at least 2 sources with at least 2 rows each. The command test calls `Artisan::call('atrium:search-source')` with `LARAVEL_INVOKABLE_CLOSURE` set to a serialized wrapper closure (the real `invoke-serialized-closure` path, so a container-per-call change breaks it) and asserts the decoded stdout equals the envelope; it also covers the missing-binding case and a non-UTF-8 string. The started command string is asserted through the extracted builder method. A failure test asserts the child's stderr appears in the reported reason. The timeout case (criterion 9) uses a sleeping source (`usleep` beyond `SearchSource::timeout(1)`) beside a fast second source and asserts the surviving results. Failures and timeouts stay `report()`ed to the host's exception handler; tests observe them with `Exceptions::fake()` and `assertReported()` (D-008). Because a timeout is also a `SearchSourceFailedException` (D-007), the criterion 8 tests assert the failure is reported and `SearchSourceTimedOutException` is not; the criterion 9 test asserts `SearchSourceTimedOutException` is reported and its message matches `timed out`. Criterion 7 tests call `SearchRegistry::search()` with the process driver and `Process::fake()` returning stdout `{"successful":true,"results":[…crafted rows…]}`; they assert the valid rows are kept in order, the malformed rows are dropped, and nothing is reported or thrown (`decode()` is protected, so it is only reachable this way). The faked run bypasses the real child, so these cases do not prove the side channel; criteria 3-5 do (D-009).

## Out of scope

- How the task closure is sent to the child (`serialize(new SerializableClosure(...))` stays).
- The `fork`/`sync` drivers' internals.
- `SearchResult` public API changes (no `fromArray()`).
- Any change to `SearchSource`'s `__serialize`/`__unserialize`.
- The closure transport and the child's trust in `LARAVEL_INVOKABLE_CLOSURE` (framework behaviour, unchanged).
- Any change to timeouts, concurrency, the concurrency limit or the environment passed to the child.
- Removing downstream `SearchRegistry` workarounds (follow-up jobs per D-005).
- README, CHANGELOG and docs edits beyond one CHANGELOG line noting the change, the lost `SearchResult` subclass state, and that caches must be rebuilt on upgrade.

## Risks and open questions

- **Exception base:** no `AtriumException` exists yet. The Keystone base is `RefactorCircus\Keystone\Exceptions\PackageException` (abstract, extends `RuntimeException`; confirmed in `Keystone/src/Exceptions/PackageException.php`). This spec adds the abstract `AtriumException` on it (D-006), with the timeout exception extending the failure exception (D-007).
- **Upgrade:** the parent now runs `atrium:search-source` in the host's child. A stale cached bootstrap, disabled package auto-discovery or a provider not registered in console makes every process-driver source fail with "command not defined" until caches are rebuilt; failures stay per source and the message says so.
- **Side channel:** results reach the Atrium command through the child's container, not the framework's return value. If a future Laravel version runs `invoke-serialized-closure` in a fresh container per call, the rows would be lost; the command test catches that.
- **Report wording/class change:** hosts filtering reports on `RuntimeException` still match (the base extends it), but anything matching the exact class changes.

## Addendum (2026-10-25, D-005)

Downstream packages are handled as follow-up jobs proposed from this one, not in this diff. Every package that symlinks Atrium through `composer local:install` and runs `arch()->preset()->security()` (Cortex, Impex, Keen, PennantPlus, Polycart, Roster, Showroom) gets one job: once this change is merged, refresh the local Atrium install, confirm the security preset passes with no `SearchRegistry` exception, and remove any workaround or accepted local failure (Cortex D-054/D-058). No criterion here changes; this spec still verifies inside Atrium only.
