## Round 1

Changed in spec.md:

- Goal: limited to Atrium; the downstream benefit is context only (nothing in Atrium can verify it).
- Criterion 1: verified by the security preset plus an explicit `expect('unserialize')->not->toBeUsed()`.
- Criterion 6: envelope detail kept in Design only. Criterion 11: dropped the untestable non-console claim; asserted via `Artisan::all()` / `isHidden()`.
- Design: `successful: true` only when the framework succeeded and the container binding is an array (missing binding fails); stdout carries only the envelope, encoded with `JSON_INVALID_UTF8_SUBSTITUTE`, with a failure envelope if encoding fails; no row/size cap in `decode()` (deliberate); child stderr included in failure reasons; only the five `SearchResult` fields round-trip (no subclass in repo); command string extracted into a method for testing.
- Tests: criteria 3-5 use a real child process and assert counts (2+ sources, 2+ rows); the command test drives the real `invoke-serialized-closure` path via `LARAVEL_INVOKABLE_CLOSURE`; missing-binding, non-UTF-8, stderr and timeout cases (sleeping source with `SearchSource::timeout(1)` plus a fast second source) specified.
- Out of scope: closure transport/trust, timeouts/concurrency/env, README/CHANGELOG beyond one line. Risks: upgrade / cache-rebuild risk added.

Further changes in spec.md (critic recheck findings):

- Exceptions: `SearchSourceFailedException` is now a non-final class (a final class cannot be extended by the timeout subclass); `SearchSourceTimedOutException` stays final; `AtriumException` stays abstract.
- Factories: failure keeps `forSource(SearchSource, string|Throwable $reason)`; the timeout class gets `timedOut(SearchSource, Throwable $previous)` so no static signature is redeclared incompatibly. It builds the `Search source [key] timed out.` message itself. The Parent bullet was updated to match.
- Tests: criterion 8 asserts the failure is reported and the timeout class is not; criterion 9 asserts `SearchSourceTimedOutException` and a message matching `timed out` (a timeout is also a failure under D-007).
- Tests: criterion 7 goes through `search()` with the process driver and `Process::fake()` returning a crafted success envelope, since `decode()` is protected. The spec notes the fake bypasses the real child, so criteria 3-5 still prove the side channel.

Deliberately not changed (open questions): exception classes and base (`AtriumException` vs Keystone's existing `PackageException`), subclass vs sibling, how failures are reported and observed, how malformed rows are produced in tests, and whether removing the downstream Cortex D-058 workaround is in scope (so it is not listed in Out of scope).

## Pass 2 (recheck of D-005 to D-009)

The open questions above were answered in RingMaster as D-005 to D-009 and checked into spec.md: exception base and hierarchy, reporting through `report()`, malformed rows through `Process::fake()`, and downstream follow-up jobs. Also added an Out of scope bullet for the downstream workarounds (D-005). No new design questions.
