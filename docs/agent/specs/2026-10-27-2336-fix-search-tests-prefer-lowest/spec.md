# Fix SearchTest process-driver failures under --prefer-lowest

Ticket: [#12](https://github.com/Refactor-Circus/Atrium/issues/12)

## Goal

`composer update --prefer-lowest` followed by `composer test:unit` is green for package maintainers and CI, by raising dev dependency floors so PHP 8.5 deprecation notices no longer corrupt the child `php artisan` output parsed by the Search process driver (decision D-002).

## Acceptance criteria

1. After `composer update --prefer-lowest --prefer-stable`, `composer test:unit` exits 0 with zero failures and zero errors, including every `tests/Feature/SearchTest.php` case that calls `useProcessDriver()` (12 failed before the change).
2. After that lowest resolution, `composer show amphp/dns symfony/translation` reports versions at or above the fixed releases recorded in the "Fixed releases" section below, and a run of the child `php artisan` command under the lowest resolution prints no `Deprecated:` lines. `composer.json` enforces the floors through `require-dev` constraints only; `conflict` is not used for either package.
3. `git diff --stat` shows only `composer.json` changed (`composer.lock` is not tracked in this repository). No file under `src/` changes, and the Search process driver is not altered to tolerate notices.
4. `composer.json` `require` (runtime) and `conflict` are unchanged; every added or raised constraint is in `require-dev`. A raised `nesbot/carbon` floor is added as a `require-dev` entry (not `require`) and does not change `php` or `illuminate/*` constraints. A `require-dev` entry for a package that Laravel already requires at runtime (such as `symfony/translation`) is allowed, because `require-dev` is not inherited by host applications.
5. After `composer update` (highest resolution), `composer test` passes.
6. `composer validate --strict` passes and both `composer update --prefer-lowest --prefer-stable` and `composer update` resolve successfully, so the raised floors are satisfiable together with the existing `conflict` entry (`brianium/paratest` `>=7.26.1`) and the Pest plugin floors. `git diff composer.json` leaves the `php`, `illuminate/*` and Pest/PHPUnit constraints untouched (only `require-dev` raises of `pestphp/pest-plugin-browser`, `amphp/dns`, `amphp/socket`, `symfony/translation`, `nesbot/carbon` and dev-only Laravel tooling such as `orchestra/testbench` are allowed), so neither the Pest minimum nor the PHP/Laravel matrix rises (raising `pestphp/pest-plugin-browser` must not force either).

## Design

Test-only change in `composer.json`. `composer.lock` is not tracked, so nothing else changes.

- Identify the first releases of `amphp/dns` (via `pestphp/pest-plugin-browser`) and `symfony/translation` (via `nesbot/carbon`) that no longer emit notices on PHP 8.5.
- Raise `pestphp/pest-plugin-browser` in `require-dev` to a floor that pulls the fixed `amphp/dns`, or add a direct `require-dev` entry for `amphp/dns` if the plugin's own floor cannot. Do not use `conflict` for dev-only packages.
- `symfony/translation` is a Laravel runtime dependency. Its floor is reached by a `require-dev` constraint only (for example `^6.4.x || ^7`), or by raising the `nesbot/carbon` floor or a Laravel dev-only floor (`orchestra/testbench` or similar), never `illuminate/*` or the supported matrix (D-004). This spec does not use a consumer-facing `conflict`: a `conflict` is published to every host application and is not test-only (D-004). If those `require-dev` floors cannot lift the lowest resolution past the notice-emitting release, stop and escalate (D-004) rather than falling back to `conflict`.
- Before implementing, do a lowest-resolution run and record the resolved versions and the fixed releases in the "Fixed releases" section.
- Verify by running the lowest resolution locally, checking the child `php artisan` output for any `Deprecated:` line (not only the 12 tests, since other notices may surface once these two are fixed), then the highest resolution, then `composer test`. Record the resolved `amphp/dns` and `symfony/translation` versions in the PR.
- The regression guard is the existing `prefer-lowest` entry in the `.github/workflows/tests.yml` matrix (`stability: [prefer-lowest, prefer-stable]`), which runs criterion 1 on every CI run; no workflow change is needed.

No test changes; the existing process-driver tests are the proof (`testing/test-layers`).

## Fixed releases

Recorded from a lowest-resolution run (`composer update --prefer-lowest --prefer-stable`, PHP 8.5) before the change. Each first fixed release was found by pinning candidate versions and checking the child `php artisan` (`vendor/bin/testbench --version`) for `Deprecated:` lines.

| Package | Pulled in by | Resolved before | Last emitting release | First fixed release | `require-dev` floor | Resolved after |
| --- | --- | --- | --- | --- | --- | --- |
| `amphp/dns` | `pestphp/pest-plugin-browser` (via `amphp/socket`) | v2.0.0 | v2.1.1 | v2.1.2 | `^2.1.2` | v2.1.2 |
| `amphp/socket` | `pestphp/pest-plugin-browser` (via `amphp/http-server`, `amphp/websocket-client`) | v2.2.0 | v2.3.0 | v2.3.1 | `^2.3.1` | v2.3.1 |
| `symfony/translation` | `laravel/framework` (via `nesbot/carbon`) | v6.4.0 | v6.4.2 (v7.0.2 on 7.0) | v6.4.3 (v7.0.3 on 7.0) | `^6.4.3 \|\| ^7.0.3 \|\| ^8.0` | v6.4.3 |

The notices were `Amp\Dns\dnsResolver()` / `Amp\Dns\resolve()`, `Amp\Socket\Internal\normalizeBindToOption()` and `Symfony\Component\Translation\t()`, all "Implicitly marking parameter ... as nullable is deprecated". `amphp/socket` surfaced in the same run as a third source (the early guard in Design). Raising `pestphp/pest-plugin-browser` cannot help, because v5.1.2 is already its newest release, so both `amphp` floors are direct `require-dev` entries. The highest resolution is unchanged (`amphp/dns` v2.4.1, `amphp/socket` v2.4.1, `symfony/translation` v8.1.5).

## Addendum 2026-10-28 (D-007)

Criterion 6 now also allows a `require-dev` floor for `amphp/socket` (`^2.3.1`), a third PHP 8.5 notice source found during the build.

## Out of scope

- Changing the paratest conflict pin.
- Changing the supported PHP or Laravel matrix.
- Making the Search process driver tolerate deprecation output.
- Fixing other `--prefer-lowest` failures outside `SearchTest`.
- Changing browser test behavior.

## Risks and open questions

- If a `require-dev` constraint cannot lift `symfony/translation` past the notice-emitting release, raise the `nesbot/carbon` or Laravel dev-only floor (D-004); if that also cannot work, stop and escalate. `conflict` is not an option (D-004).
- The fixed release numbers are not yet known; they are recorded in "Fixed releases" after the pre-implementation lowest run.
- A raised `pestphp/pest-plugin-browser` floor could pull a newer Pest, Playwright or PHP minimum; criterion 6 forbids that.
- Other PHP 8.5 deprecations may surface in the lowest resolution once these two are fixed; the `Deprecated:` check in Design is the early guard.
