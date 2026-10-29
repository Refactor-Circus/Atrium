# References

- `tests/Feature/SearchTest.php` (`useProcessDriver()`, line 107; process-driver tests from line 428): the failing tests; the helper already shells out to `php artisan --version` to check the child boots.
- `composer.json` require-dev (`pestphp/pest-plugin-browser ^5.1.2`): where `amphp/dns` comes in; the floor to raise under option A.
- Spec `2026-10-27-2058-drop-paratest-conflict-pin` (decision D-005): where the failure was found; shows the `--prefer-lowest` run.
