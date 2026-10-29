# Decisions

D-001 to D-008 are recorded in `shape.md`.

## D-009: How should x-atrium::audit-trail leave Atrium while hosts still use it inline?
- Choice: Remove it now, and merge Atrium, Keen and the hosts as a group
- Rationale: Accepted the recommendation. Breaking changes are fine because nothing is on Packagist yet.
- Date: 2026-10-29
- Raised by: spec review (scope, risk)

## D-010: How does the test reset treat registrations made in boot()?
- Choice: Take a snapshot after boot and restore it after each test; keep flush() for the registry's own unit tests
- Rationale: Accepted the recommendation. A plain flush would wipe consumers' boot() registrations.
- Date: 2026-10-29
- Raised by: spec review (testability)

## D-011: What shape should the published testing helper take?
- Choice: A Pest trait `Testing\ResetsScreenExtensions` that registers the beforeEach/afterEach hooks
- Rationale: Accepted the recommendation. It sits alongside the existing `Testing\AtriumStyles`.
- Date: 2026-10-29
- Raised by: spec review (scope)

## D-012: Should the browser theme matrix be a dataset or one looped test?
- Choice: A Pest dataset, with one test per theme, layout and mode combination
- Rationale: Accepted the recommendation. Each failure names its combination.
- Date: 2026-10-29
- Raised by: spec review (testability)

## D-013: Do Atrium's own screens adopt Screen::make in this spec? (Q-002)
- Choice: Yes, and more broadly: every Atrium screen in every package declares itself with `Screen::make`, gets a tab bar, and declares the standard slots. Atrium's own screens are declared in this spec: dashboard, named dashboard, widget detail, settings index and settings panel. Each package's spec declares that package's screens.
- Rationale: "update all screen across all packages to have support for slots/tab bars".
- Date: 2026-10-29
- Raised by: spec review (scope)

## D-014: Where does the history screen live?
- Choice: In Keen. `history/{package}` (`HistoryController`, `history/show`) moves from Atrium to Keen, along with `x-atrium::audit.entries`, since nothing else in Atrium would use it. This supersedes D-007's "audit.entries stays in Atrium". Atrium's history route, controller, view and component are removed in this spec.
- Rationale: "the history screen should be moved to keen."
- Date: 2026-10-29
- Raised by: user, during spec review

## D-015: How do resolver and view failures affect the host screen? (Q-004)
- Choice: Isolate sections and row slots: report once per request, skip the section, and the screen still returns 200. Propagate failures in the open tab's panel.
- Rationale: Accepted the recommendation.
- Date: 2026-10-29
- Raised by: spec review (risk)

## D-016: Does Plugin::historyNavItem() move to Keen? (Q-008)
- Choice: Yes. Keen adds a History nav item for every package that audits, and plugins stop calling `historyNavItem()`, which Atrium removes.
- Rationale: Accepted the recommendation.
- Date: 2026-10-29
- Raised by: spec review (scope)

## D-017: Suite principle: packages have no knowledge of each other (answer to Q-003)
- Choice: Atrium has no knowledge of Keen. Keen's functionality is purely plug and play. No package has knowledge of another. Companion packages may be suggested but not required. Integrations are done through simple config.
- Rationale: In the user's words: "atrium should have no knowledge of keen. keens functionality should be purely plug and play, no package should have knowledge of another. we can suggest companion packages but no require them. itegrations should be done via simple config"
- Consequence for this spec: `Screen::audits()`, `AuditedSubject`, `ScreenExtensions::audited()` and criterion 10 are removed. The registry instead supports wildcard screen targets (`*`, `{package}.*`), and screens declare only generic facts: key (from which the package is derived), record, tabs and slots. Q-003 no longer applies.
- Date: 2026-10-29
- Raised by: spec review (testability), Q-003

## D-018: Which hard requirements may a package have?
- Choice: Keystone only. Every other suite package, Atrium included, is a `suggest`. A package's UI loads only when Atrium is present, as Keen, Polycart and PennantPlus already do. Roster, Cortex, Impex and Showroom drop `require refactor-circus/atrium`. Guardian suggests Roster and integrates through Roster's seams and config.
- Rationale: Accepted the recommendation, applying D-017.
- Date: 2026-10-29
- Raised by: user, following D-017

## D-019: What shape does "integration via simple config" take?
- Choice: The registrant ships editable defaults in its own config. Example: `config/cortex.php` `atrium.redirect_domains.screens => ['roster.organization' => 'tab', 'roster.user' => 'aside']`. A default only takes effect when the target screen exists, and the app may change or empty the list. Code never names another package; only the editable config does.
- Rationale: Accepted the recommendation.
- Date: 2026-10-29
- Raised by: user, following D-017
