
## Round 1

Edited `spec.md` for the non-architectural findings. Left untouched, because they are open questions: how `x-atrium::audit-trail` leaves Atrium (criterion 17 and Risks), whether Atrium's own screens adopt `Screen::make` (no out-of-scope bullet added; only the Goal now says "any screen that declares itself with `Screen`"), whether the audited slot is implicit or listed in `slots()`, throwing resolvers or views, the flush/boot reset mechanism, the testing helper's shape, and dataset versus loop for the browser matrix.

Changes and why:
- Goal: scoped to screens declaring `Screen`, removing the ambiguity about Atrium's own screens.
- C1: test that `Atrium::screens()` returns the singleton.
- C3: boot-time exception messages name key, screen and call site; README states the throw is intentional (blast radius is diagnosable).
- C4: test that a `boot()` registration survives between two tests (checks the outcome without choosing the mechanism).
- C6: explicit tests for each open-tab rule; the 403/200 key-existence leak is accepted and documented.
- C7 and C9: memo key is morph class plus key, `spl_object_id` for null keys, same key for the `data()` memo (prevents cross-row data exposure); tests added. Undeclared slots render nothing and call nothing.
- C10: positive test for `AuditedSubject` fields and a custom slot; audited sections are default-deny; README documents the subject-authorization requirement.
- C11: tab links drop `page` and `tab`, are escaped, with named variant markup and tests for `?page=2&q=x` and array/special characters.
- C12: tests for class passthrough, empty slot and order.
- C13: `missingClasses()` emptiness is the test; CSS rebuild is a done-step.
- C14: browser assertions for computed overflow, nowrap and equal top offsets.
- C15: failures must name theme, layout and mode.
- C16: docs test reduced to section existence; README also records the boot-throw and 403 behaviours; CLAUDE.md and domains.md list the Screens domain.
- C17: added a `history/show` 200 with `audit.entries` test (neutral to the removal decision).
- Out of scope: audited tabs, and config/event/MCP surface.

## Round 1 (revision 2)

Rewrote `spec.md` in place so the numbered criteria and Design are authoritative; the addendum is now a changelog. Open questions were not decided: where a criterion depends on one, it says "pending Q" and fixes only behaviour that does not depend on the answer.

- Goal, C1, C5, C10, C15, C16, C18, Design: removed `audited()`, `Screen::audits()`, `AuditedSubject`, the `[audited]` store and the audited browser section and README example (D-017 superseded them). C10 is now the wildcard criterion; C10a covers failure isolation. Why: a builder or verifier reading top to bottom no longer meets contradictory scope.
- C1 and C3: wildcard targets (`*`, `{package}.*`) accepted, with accepted and rejected examples (`*.x`, `te*.x`, `test.a*`, `test.*.x`, `**`); a host `Screen::make()` key is never a wildcard. Slot names validated against `^[a-z0-9][a-z0-9._-]*$`. Why: otherwise `boot()` throws for the wildcards the addendum adds. Call-site in the duplicate message is best-effort and tested only for a closure in the test file.
- C4: rewritten around snapshot after boot and restore after each test (D-010), trait `Testing\ResetsScreenExtensions` (D-011), `flush()` for unit tests only, with three tests (boot survives, in-test registration gone, flush empties). The public snapshot/restore shape is left pending Q.
- C5, C6, C11: added `Screen::standard()` and `kind`, exposed `key/package/record/kind`, the synthetic reserved `overview` default tab (hidden alone, tested), wildcard tabs on reserved keys, and ordering (exact first, then wildcard).
- C7 and C9: null-key models are keyed by strongly held identity, not bare `spl_object_id` (ids are reused after free, which would leak authorization results); a test frees one unsaved row and checks `authorize` runs again.
- C10a: section output buffered and discarded on failure; all Throwables including HttpException isolated, not suppressed in tests; once-per-key reporting; open-tab panel failure gives a 500. Tests added.
- C14 and C15: stated the exact properties (`flex-wrap`, `white-space`), the `top-tabs` fixture, and the idle-tab comparison with the pointer elsewhere.
- C16: README adds wildcards, cheap-closure guidance, the registrant-owns-writes note for settings screens, D-018 and D-019; docs test also checks keywords.
- C17: history removal now has tests (404 route, arch checks, `historyNavItem` gone, no `audit/` `@source`) and done-steps (workspace grep for removed symbols, safelist check, CHANGELOG upgrade note, grouped merge).
- C19 (new): exhaustive table of Atrium screens (`atrium.dashboard` for `/` and `d/{slug}`, `atrium.dashboard-widget`, `atrium.settings`, `atrium.settings-panel`) with kind, record, tabs and slots; anything unlisted (including `search`) is out of scope; per-screen tests. The table follows D-013 and is subject to the scope open question.
- Out of scope and Risks: removals are in scope, only Keen's replacements are out; settled items (D-009, D-012) removed, scope-size risk and grouped merge order added.
