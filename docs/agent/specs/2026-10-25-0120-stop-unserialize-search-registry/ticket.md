# Ticket draft (not yet created on GitHub)

**Title:** Stop using unserialize in SearchRegistry

## Problem

`SearchRegistry::decode()` (`src/Domains/Search/Services/SearchRegistry.php:270`) revives search results from the child search process with `unserialize()` (limited to `SearchResult` via `allowed_classes`). Pest's arch `security` preset flags `unserialize`, so the gate fails in packages that install Atrium locally (Cortex, D-058).

The child runs Laravel's `invoke-serialized-closure` command, which itself wraps the closure's return value in `serialize()` (`vendor/laravel/framework/src/Illuminate/Concurrency/Console/InvokeSerializedClosureCommand.php:46`). Returning plain arrays from the task closure is therefore not enough on its own: the parent would still have to `unserialize` the framework's `result` string.

## Desired outcome

Search results travel from the child process to the registry as JSON:

- the child turns each `SearchResult` into an array (`SearchResult::toArray()`) and emits JSON;
- the registry rebuilds `SearchResult` objects from those arrays (title, url, subtitle, icon, group);
- no `unserialize` remains anywhere in `src/`.

## Acceptance hints

- Failed or timed-out sources keep today's behaviour: the failure is reported and the source contributes `[]`.
- Malformed rows (missing/non-string `title` or `url`) are dropped, not fatal.
- Tests cover the round trip of every `SearchResult` field (with and without the optional ones) through the process driver.
- `tests/ArchTest.php` applies (or keeps passing) the `security` preset over `src/` with no `unserialize` exception.
- `composer test` passes.

## Out of scope

- Changing how the task closure is sent to the child (`serialize(new SerializableClosure(...))` stays; it is serialization, not unserialization, and the child side is the framework's).
- The fork/sync concurrency drivers' own internals.
- Any change to `SearchResult`'s public API beyond what rebuilding from an array needs.
