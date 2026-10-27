# Stop using unserialize in SearchRegistry — Shaping Notes

## Scope

Change, not a new feature. Ticket: [#6](https://github.com/Refactor-Circus/Atrium/issues/6).

`SearchRegistry::decode()` (`src/Domains/Search/Services/SearchRegistry.php:270`) revives each child process's search results with `unserialize()`. Pest's arch `security` preset flags it, which today forces `->ignoring(SearchRegistry::class)` in `tests/ArchTest.php:18` and fails the gate in packages that install Atrium locally (Cortex, D-058 there).

Outcome:

- Search results travel from the child process to the registry as JSON: the child turns each `SearchResult` into an array (`toArray()`), the registry rebuilds `SearchResult` objects (title, url, subtitle, icon, group).
- Malformed rows (missing or non-string `title`/`url`) are dropped, not fatal.
- Failed and timed-out sources keep today's behaviour: reported, contribute `[]`.
- No `unserialize` remains in `src/`; `tests/ArchTest.php` runs the `security` preset with no `SearchRegistry` exception.
- Tests cover the round trip of every `SearchResult` field, with and without the optional ones, through the process driver.

Out of scope: how the task closure is serialized for the child (`serialize(new SerializableClosure(...))` stays), the fork/sync drivers' internals, `SearchResult`'s public API beyond what rebuilding from an array needs.

## Decisions

- **D-001:** the child runs an Atrium console command of its own (not Laravel's `invoke-serialized-closure`, which wraps the result in `serialize()`), which runs the closure and writes JSON.
- **D-002:** ticket created as drafted (#6).
- **D-003:** the Atrium command runs the framework's `invoke-serialized-closure` in-process (`Artisan::call`) with a wrapper closure that hands the results back as arrays, then writes them as JSON; the framework still does the `unserialize`, so none lands in `src/`.
- **D-004:** standards confirmed as listed below.

## Context

- **Child app:** the process driver runs `php artisan` in the host app (Testbench's skeleton in tests); `testbench.yaml` registers `AtriumServiceProvider`, so an Atrium command is available in the child. It would be hidden and registered behind `runningInConsole()` like `InstallCommand`.
- **Payload envelope:** `decode()` already parses a JSON envelope (`successful`, `result`, `message`) and strips gzip bytes a response compressor appends; the new command should keep a compatible envelope so the failure reporting stays.
- **Sources in tests** are registered at runtime with `SearchRegistry::add()` inside the test process (`tests/Feature/SearchTest.php:48-69`), not by a provider the child also boots, so the child cannot look sources up by key; it needs the closure.
- **SearchSource** already serializes its closures by hand (`__serialize`/`__unserialize`, `SearchSource.php:97-120`); `__unserialize` is a magic method, not a call to `unserialize()`, and is not flagged.
- No product docs in `docs/agent/product/`.
- No visuals: no UI surface.

## Standards

Confirmed (D-004):

- `testing/arch-tests` — the security preset must run over `src/` without the `SearchRegistry` exception.
- `architecture/service-providers` — the new command is registered from the Search provider behind `runningInConsole()`.
- `architecture/naming` — command class naming and placement.
- `atrium/domains` — the command and any decoding helper live in the `Search` domain.
- `data/value-objects` — rebuilding `SearchResult` from an array without widening its public API.
- `errors/exceptions` — failure reports for bad payloads (today raw `RuntimeException`).
- `testing/test-layers` — round-trip tests through the process driver plus command wiring tests.
