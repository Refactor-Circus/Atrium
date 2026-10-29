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
