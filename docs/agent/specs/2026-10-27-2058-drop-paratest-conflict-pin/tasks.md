# Tasks: Drop the paratest conflict pin

## Group 1: Drop the conflict pin and raise pest
depends on: none
files: composer.json
criteria: 1, 2, 3, 4, 5

- [x] 1.1 Write the checks first: read `composer.json` as JSON and confirm it currently has a `conflict` key and `require-dev.pestphp/pest` below `^5.3.4` (these are the failing checks for criteria 1 and 2)
- [x] 1.2 In `composer.json`, set `require-dev.pestphp/pest` to `^5.3.4` and delete the `conflict` block; change nothing else
- [x] 1.3 Run `composer update pestphp/pest brianium/paratest --with-dependencies`; confirm `composer show pestphp/pest brianium/paratest` reports pest >= 5.3.4 and paratest >= 7.27.4, and `composer why-not brianium/paratest 7.27.4` reports nothing blocking
- [x] 1.4 Confirm pest 5.3.4 requires paratest `^7.27.4` or later (`composer show pestphp/pest --all`), then run `composer update --prefer-lowest` and `composer test:unit`; restore with `composer update` (accepted per D-005 on the paratest-floor evidence; the 12 SearchTest failures under lowest versions are an existing issue outside this spec, handled by a follow-up job)
- [x] 1.5 Run `composer validate --strict`, `composer test`, `vendor/bin/pest --parallel` and `composer test:browser`; all exit 0
- [x] 1.6 Confirm `git diff --name-only main` lists only `composer.json` and files under this spec folder (`composer.lock` stays untracked)
- [x] 1.7 Run composer test:unit; all green
