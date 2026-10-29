## Round 1

Changes to spec.md:

- Design and Risks: removed the stated preference for a `symfony/translation` `conflict`. The floor is now a `require-dev` constraint (or a raised carbon/Laravel dev floor) only; if that cannot work, escalate rather than use `conflict`. Reason: a `conflict` is published to host apps, so it is not test-only and contradicts D-002 and `architecture/dependencies`. The open questions about `conflict` are left untouched.
- Criteria 2 and 4: dropped `conflict` as an enforcement option, including for `amphp/dns`; criterion 4 now says `require` and `conflict` are unchanged and that `require-dev` entries for runtime-required packages are allowed.
- Criterion 1: replaced the "347 tests" count with exit 0, zero failures and errors, including every `useProcessDriver()` SearchTest case.
- Criterion 2: made observable via `composer show amphp/dns symfony/translation` against a new "Fixed releases" section (to be filled by a pre-implementation lowest run), plus a check that child `php artisan` output has no `Deprecated:` lines.
- Criterion 3: named the check (`git diff --stat` shows only composer.json) and recorded that composer.lock is not tracked (confirmed: `git ls-files composer.lock` is empty).
- Criterion 6: named commands (`composer validate --strict`, lowest and highest `composer update`) and required that php, illuminate/* and Pest constraints stay untouched.
- Design: noted the existing `prefer-lowest` matrix entry in `.github/workflows/tests.yml` as the regression guard (stated as fact; the open question about adding a CI job is unchanged). Added a step to record resolved versions in the PR.
- Out of scope: added other prefer-lowest failures outside SearchTest and browser test behavior changes.
- Not changed: concrete version numbers, because they require a resolution run not done in this revision.

Follow-up fixes to spec.md (critic findings, same round):

- Risks (first bullet): removed the reopened `conflict` option and the "separate decision" framing. It now says to raise the `nesbot/carbon` or Laravel dev-only floor, then stop and escalate, with `conflict` ruled out, citing D-004.
- Design (symfony/translation bullet): replaced "(see the open questions)" with D-004 citations, and narrowed the Laravel floor to dev-only tooling (`orchestra/testbench` or similar), never `illuminate/*` or the supported matrix.
- Criterion 6: lists the `require-dev` raises that are allowed (including dev-only Laravel tooling), so the D-004 fallback is usable while `illuminate/*` and the matrix stay untouched.
- Criterion 4: a raised `nesbot/carbon` floor is a `require-dev` entry (not `require`) and leaves `php` and `illuminate/*` alone.

Reason: D-004 already closed the `conflict` question and named carbon/Laravel dev floors as the fallback; the spec now applies it fully and consistently. Open questions untouched.
