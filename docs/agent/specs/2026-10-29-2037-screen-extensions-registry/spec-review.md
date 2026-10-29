
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
