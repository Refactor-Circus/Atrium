# Fix SearchTest process-driver failures under --prefer-lowest

## Problem

Under `composer update --prefer-lowest`, 12 of 347 unit tests fail: the process-driver tests in `tests/Feature/SearchTest.php`. PHP 8.5 deprecation notices from `amphp/dns` v2.0.0 (via `pest-plugin-browser`) and `symfony/translation` v6.4.0 (via `nesbot/carbon`) corrupt the child-process output. Found while dropping the paratest conflict pin (spec 2026-10-27-2058-drop-paratest-conflict-pin, decision D-005); unrelated to that change.

## Desired outcome

`composer test:unit` passes on the lowest dependency resolution.

## Acceptance hints

- Choose the fix: raise the require-dev floors past the releases that emit the notices, or make the Search process driver and its tests tolerate deprecation output in the child process.
- `composer update --prefer-lowest` then `composer test:unit` is green (347 tests).
- `composer update` restores the normal resolution afterwards; `composer test` still passes.

## Out of scope

- The paratest conflict pin change.
- Changes to the supported PHP or Laravel matrix.
