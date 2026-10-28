# Build

## Rework round 1

Findings from `round-1/gate.md`.

### Blocker: ringside check failed (generated files stale)

- `vendor/bin/ringside sync` regenerated the generated files. They are all gitignored (`.agents/`, `docs/agent/standards.index.yml`, `docs/agent/standards.summary.md`), so the sync leaves nothing to commit.
- In the worktree, `composer exec ringside check` now passes. The `composer update` runs below re-ran the sync from their post-update hook with `refactor-circus/ringside` dev-main 61d8674.
- The sync also ran once in the main checkout (`/Users/jay/Projects/packages/Atrium`), where `ringside check` now passes too. It only rewrote gitignored generated files.

### Major: branch has no diff vs main; criteria 1, 2 and 6 unverified

The floors landed on main in fba14da, so this branch has no code diff. I re-ran both resolution lanes in the worktree with the committed `composer.json` (VCS repositories, not `composer.local.json`), PHP 8.5:

**Lowest** (`composer update --prefer-lowest --prefer-stable`): resolved.

| Package | Resolved | Fixed release | Meets floor |
| --- | --- | --- | --- |
| `amphp/dns` | 2.1.2 | v2.1.2 | yes |
| `amphp/socket` | 2.3.1 | v2.3.1 | yes |
| `symfony/translation` | 6.4.3 | v6.4.3 | yes |

Other lowest versions: `laravel/framework` 13.35.0, `nesbot/carbon` 3.8.4, `pestphp/pest` 5.3.4, `pestphp/pest-plugin-browser` 5.1.2, `orchestra/testbench` 11.3.0, `brianium/paratest` 7.27.4.

- Child command: `php -d display_errors=1 -d error_reporting=-1 vendor/bin/testbench --version` printed only `Laravel Framework 13.35.0`, with no `Deprecated:` lines (criterion 2).
- `composer test:unit`: 347/347 passed, 876 assertions (criterion 1). `tests/Feature/SearchTest.php` alone: 42/42 passed, including every `useProcessDriver()` case.
- In-process PHPUnit deprecations (not in the child output, so they do not affect the process driver): 2, from `phpdocumentor/reflection-docblock` 5.3.0 (`ReflectionProperty::setAccessible()`), a transitive dev dependency. These do not fail the run and are out of scope ("Fixing other `--prefer-lowest` failures outside `SearchTest`").

**Validate**: `composer validate --strict` reports `./composer.json is valid` (criterion 6).

**Highest** (`composer update`): resolved (`amphp/dns` 2.4.1, `amphp/socket` 2.4.1, `symfony/translation` 8.1.5, `laravel/framework` 13.39.0). The child `vendor/bin/testbench --version` printed no `Deprecated:` lines. `composer test` passed: phpstan 0 errors, pint passed, type coverage 100.0 %, pest 347/347 (criterion 5, criterion 6).

Criteria 3 and 4: `git diff main...HEAD` touches no files. The floors in `composer.json` on main are `require-dev` only. `require` (`php ^8.5`, `laravel/framework ^13.35`, `refactor-circus/keystone`) has no `conflict` key and was not changed. The paratest `conflict` that criterion 6 mentions was removed by the earlier job 2026-10-27-2058-drop-paratest-conflict-pin. Both resolutions are still satisfiable without it.

The rework commit on the branch is empty (`--allow-empty`). It records this verification because no code change remains to make.

## Closed (D-012)

Closed as already satisfied on main (fba14da). The verification above stands as the record; no PR is opened.
