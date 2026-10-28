# Tasks: Fix SearchTest process-driver failures under --prefer-lowest

## Group 1: Raise require-dev floors past the notice-emitting releases
depends on: none
files: composer.json, docs/agent/specs/2026-10-27-2336-fix-search-tests-prefer-lowest/spec.md
criteria: 1, 2, 3, 4, 5, 6

- [x] 1.1 Reproduce: run `composer update --prefer-lowest --prefer-stable` and `composer test:unit` (the 12 `useProcessDriver()` cases in tests/Feature/SearchTest.php fail); run the child `php artisan` under that resolution and note the `Deprecated:` lines and their packages
- [x] 1.2 Record the resolved `amphp/dns` and `symfony/translation` versions and the first fixed releases in the "Fixed releases" section of spec.md
- [x] 1.3 Raise `require-dev` floors only (`pestphp/pest-plugin-browser` or a direct `amphp/dns` entry; a `symfony/translation` `require-dev` constraint, or the `nesbot/carbon` / `orchestra/testbench` dev floors); leave `require`, `conflict`, `php`, `illuminate/*` and Pest/PHPUnit constraints untouched; if no `require-dev` floor works, stop and escalate (D-004)
- [x] 1.4 Re-run the lowest resolution; confirm the child `php artisan` prints no `Deprecated:` lines and `composer show amphp/dns symfony/translation` meets the fixed releases
- [x] 1.5 Run `composer test:unit` under the lowest resolution; all green
- [x] 1.6 Run `composer validate --strict`, `composer update`, then `composer test`; all green; confirm `git diff --stat` shows only `composer.json` (plus the spec folder)
