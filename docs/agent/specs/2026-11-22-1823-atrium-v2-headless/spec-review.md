# Spec review

## Round 1

Revised `spec.md` for the round 1 findings. Open questions were left untouched: layer distribution, where the Nuxt checks run, layer i18n, version skew, boot behavior for removed v1 config keys, layout-save semantics for omitted and orphaned placements, and API/layer contract drift.

Changed:
- AC 4: shell test asserts the exact JSON structure, including theme and panel summary fields. Reason: key presence alone proves little.
- AC 5: `Authorize` returns 401 JSON for a null user whatever the Accept header, the API group forces JSON, and a no-guard test asserts 401. Local and non-local cases use a test guard and explicit environment. The `local` gate caveat goes in the banner and README, and a test shows the gate runs on every route. Reason: auth failures were unspecified and environment-dependent.
- AC 9: migration uses `atrium.tables` keys, chunked backfill, `down()`, a seeded v1 test, RenamedTables, SQLite in CI and MySQL/Postgres by documented manual check, and v1 layout payloads without uuids still work. Reason: data-loss, portability and testability risks.
- AC 10: single-line controllers enforced by an Arch test, and 422 outcomes added. Reason: the criterion was not checkable.
- AC 11: counter assertion for non-open tabs, unknown `?tab=` falls back to the first tab. Reason: made resolution observable and defined.
- AC 12: every `atrium.*` route carries the group middleware with `Authorize` last. Reason: plugin routes could escape it.
- AC 13: message format, status 500, accepted types, rejected types tested, and lazy widget failure isolation (eager data still fails loudly). Reason: availability and consistency.
- AC 14: `ClientPath` allows only http(s) and relative paths, rejects `javascript:`, `data:` and `//host`, with a unit table; the layer sets `rel="noopener noreferrer"` on external links. Reason: open-redirect and XSS risk.
- AC 15: setters listed, `InvalidArgumentException` at definition time, valid and invalid cases. Reason: undefined scope.
- AC 16 and 18: named test mechanisms; AC 18 covers `client_path`, CORS/CSRF notes and the gate caveat.
- AC 21: reworded around the outcome; the token guard is workbench-only; workbench demo plugins use API routes.
- AC 22: added Vitest cases for lazy placement fetch, tab switch, theme switch and search rendering, with visual parts manual. Lockfile and pins are committed and copied from the spike, no local path. Reason: untestable layer behavior and a non-reproducible build.
- AC 22 and 24: AC 24 now names `composer test` as the PHP gate and requires the Node checks to pass in the gate named by the open question. Reason: the Node checks could otherwise be ungated. The choice itself is left open.
- AC 23: CHANGELOG guide lists config keys, published views, route names and the migration step, a Pest test checks AC 16 symbols appear in it, and sibling constraints are confirmed as `^1`. README covers cookie and token auth setup.
- Design (Nuxt): pins copied into the repo instead of a local spike path.
- Out of scope: added e2e/browser suite, CORS/CSRF/host auth, OpenAPI, rate limiting and v1 shim. Layer i18n was not added because it is an open question.

Not applied (they would settle open questions): decide where Node checks run or ban pnpm from `composer test`; fail loudly at boot on removed config keys; layout-save semantics for omitted uuids and orphans; a shared contract check between API and layer; layer i18n; distribution.

### Round 1 revision (findings pass)

Revised `spec.md` again. Left alone, because they touch the open questions: the `ClientPath` return value for a rejected form and its same-host rule, the observable status and body when eager or lazy data fails `JsonData::check()`, the `atrium.theme` key, Iconify data and icon assets, locale coverage, and the stale-client guard on layout save.

Changed:
- Out of scope: names the intended behavior changes (no write on read, client-side first-dashboard create, full-layout save with orphans kept, placement uuids). Added 1.x backports, pagination, HTTP caching, URL versioning, RTL and a11y. Distribution now says git `extends`. Reason: the boundary contradicted AC 6, 9, 20 and 30.
- AC 4: added `locale` and `api_version` to the shell field list. Reason: the exact-structure test would otherwise omit them.
- AC 22, 24 and Risks: inlined D-001 and D-002 (`composer test:nuxt`, done means both gates pass) and removed the resolved distribution risk. Added Vitest cases for noopener, locale switch, nav link and badge, layout payload, settings and screen rendering, Iconify render and the version banner. Added the host-consumption rules (no `workspace:` deps, no imports outside the layer) and a temp-directory consumer build step. Reason: stale wording, and unpinned behavior could regress silently.
- AC 7, 8: `data` is absent for lazy placements; exact shapes for the null default, `layout` and `destroy`.
- AC 9: orphan lazy request returns 404; chunking is tested with more rows than a chunk; the MySQL/Postgres check is a PR template item; a no-uuid payload is stated to delete and recreate non-orphan placements, with the end state pinned by a test.
- AC 30: delete, update and create share one `DB::transaction()`, and a failure leaves old placements intact.
- AC 13: depth limit and cycle guard throw `UnserializableDataException`; models serialize through `toArray()`.
- AC 14: added bypass forms to the rejected table, `ClientPath` never throws, the layer refuses links not starting with `/` or http(s), and the server enforces `search.min_length` with 422.
- AC 16: CSS scripts and deps removed from `package.json`; a test keeps the token guard under `workbench/`; `export-ignore` for `nuxt/`.
- AC 23: pre-merge sibling check (tag range, not `dev-main`, CI), grep output recorded in the PR, checklist items named with an owner.
- AC 25: document pinning to a commit SHA and protecting `v*` tags.
- AC 28: Pest test that `Atrium::API_VERSION` matches the layer `package.json` major.minor.
- AC 29: warning is once per process at `warning` level, naming the keys, tested with `Log::spy()`; `routes.middleware` is not inherited.
- AC 31: fixtures are generated in memory with seeded uuids and frozen time and compared; writing needs `UPDATE_FIXTURES=1`; `composer test:nuxt` fails when the fixtures directory is missing.

## Pass 2: max_passes reached

The recheck confirmed that D-001 to D-007 are in `spec.md`, and applied the findings listed above. It raised 8 new questions, which were deduplicated to 6. The user answered all of them directly: D-008 to D-013, recorded as AC 32 to 37.
