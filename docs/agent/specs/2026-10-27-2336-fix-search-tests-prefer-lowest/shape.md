# Fix SearchTest process-driver failures under --prefer-lowest — Shaping Notes

Ticket: [#12](https://github.com/Refactor-Circus/Atrium/issues/12)

## Scope

Under `composer update --prefer-lowest`, 12 of 347 unit tests fail: the process-driver tests in `tests/Feature/SearchTest.php` (`useProcessDriver()` and the tests that call it). PHP 8.5 deprecation notices from `amphp/dns` v2.0.0 (via `pest-plugin-browser`) and `symfony/translation` v6.4.0 (via `nesbot/carbon`) land in the child `php artisan` process output and corrupt the envelope the parent parses.

Outcome: `composer test:unit` is green on the lowest resolution (347 tests); `composer update` then `composer test` still pass.

Out of scope: the paratest conflict pin change; the supported PHP or Laravel matrix.

## Decisions

- D-002: raise the require-dev floors past the releases that emit the notices (answered in RingMaster). Test-only change, no runtime code touched; the floor of `pest-plugin-browser` (and a `nesbot/carbon` or `symfony/translation` dev constraint) moves up. The Search process driver is not changed.
- D-003: standards confirmed: `architecture/dependencies`, `testing/test-layers`.

## Context

- `tests/Feature/SearchTest.php` runs sources through `php artisan` via `Illuminate\Process`; `useProcessDriver()` sets `atrium.search.concurrency` to `process`.
- `symfony/translation` and `nesbot/carbon` are runtime dependencies of Laravel, not Atrium's own require-dev, so a floor for them can only be a dev constraint or a `conflict` entry.
- No product docs under `docs/agent/product/` consulted; none needed for a dependency/test fix.

## Standards

- `architecture/dependencies`: any composer constraint change must keep core free of optional integrations and the base package as the shared runtime.
- `testing/test-layers`: process-driver behaviour stays tested at the Search surface; no new layer.
