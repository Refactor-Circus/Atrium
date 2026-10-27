# Tasks: Stop using unserialize in SearchRegistry

## Group 1: Search exceptions and the child command
depends on: none
files: src/Exceptions/AtriumException.php, src/Domains/Search/Exceptions/SearchSourceFailedException.php, src/Domains/Search/Exceptions/SearchSourceTimedOutException.php, src/Domains/Search/Console/InvokeSearchSourceCommand.php, src/Domains/Search/SearchServiceProvider.php, tests/Feature/InvokeSearchSourceCommandTest.php
criteria: 6, 11

- [x] 1.1 Write tests: `atrium:search-source` is in `Artisan::all()` and `isHidden()`; with `LARAVEL_INVOKABLE_CLOSURE` set to a serialized wrapper closure that binds rows under the results key, `Artisan::call('atrium:search-source')` writes exactly `{"successful":true,"results":[...]}`; a closure that never binds the key, and a closure that throws, each give `{"successful":false,"message":...}`; a non-UTF-8 string still yields a non-empty, decodable envelope; `SearchSourceFailedException::forSource()` and `SearchSourceTimedOutException::timedOut()` messages (`Search source [key] failed: …`, `Search source [key] timed out.`), the timeout extending the failure exception, both descending from `AtriumException`
- [x] 1.2 Add abstract `RefactorCircus\Atrium\Exceptions\AtriumException` on Keystone's `PackageException`; non-final `SearchSourceFailedException` with `forSource(SearchSource, string|Throwable)`; final `SearchSourceTimedOutException` extending it with `timedOut(SearchSource, Throwable $previous)`
- [x] 1.3 Add `InvokeSearchSourceCommand` (`atrium:search-source`, hidden): runs `invoke-serialized-closure` in-process through `Artisan::call()` into a buffer, reads the framework envelope with `json_decode` only, reads the rows from the container side channel (key exposed as a public constant so `SearchRegistry` and the test share it), writes one `json_encode` envelope with `JSON_INVALID_UTF8_SUBSTITUTE` (falling back to a `successful: false` envelope when encoding fails), exit 0
- [x] 1.4 Register the command in `SearchServiceProvider::boot()` behind `runningInConsole()`
- [x] 1.5 Run composer test:unit; all green

## Group 2: SearchRegistry decodes JSON
depends on: 1
files: src/Domains/Search/Services/SearchRegistry.php, tests/Feature/SearchTest.php, tests/ArchTest.php, CHANGELOG.md
criteria: 1, 2, 3, 4, 5, 7, 8, 9, 10, 12

- [x] 2.1 Write tests in `tests/Feature/SearchTest.php` with the `process` driver: full-field round trip (count + all five fields), title/url-only round trip (optional fields `null`), order across ≥2 sources with ≥2 rows each, all through a real child process; `Process::fake()` stdout with crafted malformed rows (missing/non-string `title`/`url`, non-string optional fields) keeps valid rows in order, drops the rest, reports nothing; failures (source exception, non-zero exit, unparseable output, `successful` not `true`) report `SearchSourceFailedException` naming the key, not the timeout class, with stderr in the reason, contributing `[]`; a sleeping source beyond `timeout(1)` beside a fast source reports `SearchSourceTimedOutException` (`timed out`) and keeps the fast source's results; the started command string is `atrium:search-source` (through the extracted builder method). Use `Exceptions::fake()` / `assertReported()`. In `tests/ArchTest.php`, drop the `SearchRegistry` import and `->ignoring(...)` on `security()`, and add `expect('unserialize')->not->toBeUsed()`
- [x] 2.2 In `SearchRegistry`: extract the command-string method returning `Application::formatCommandString('atrium:search-source')` and use it in `runInProcesses()`; add the static serializable wrapper closure next to `task()` that maps `SearchResult::toArray()` over the task's results and binds them under the command's results key, returning `null`; rewrite `decode()` to keep the gzip-tail strip, `json_decode` the envelope, require `successful === true` and `results` an array, and rebuild rows with private `result(array $row): ?SearchResult`; remove `unserialize`
- [x] 2.3 Replace failure and timeout `report()` calls with `SearchSourceFailedException::forSource()` / `SearchSourceTimedOutException::timedOut()`, keeping stderr in failure reasons
- [x] 2.4 Add one CHANGELOG line: results now travel as JSON, `SearchResult` subclass state is no longer preserved, rebuild caches (`php artisan optimize:clear`) on upgrade
- [x] 2.5 Run composer test:unit; all green (sync and fork `SearchTest` cases unchanged)

## Group 3: Rework 1 - rerun the gate and reviews
depends on: 1, 2
files: none expected (gate and review only)
criteria: 1-12

- [x] 3.1 User note (answered in RingMaster, 2026-10-26): "all blockers were push, go back and try again". The previous escalation's only blocker was environmental (the runner refused `vendor/bin/ringside check` in the gate agent); the code is unchanged since `a79bd1d`. Rerun the gate (run `ringside check` from the job worktree, e.g. `composer --working-dir=<worktree> exec ringside check`) and, once green, let the four reviewers run on the diff
