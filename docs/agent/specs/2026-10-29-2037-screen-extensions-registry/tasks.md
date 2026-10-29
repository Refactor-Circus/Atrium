# Tasks: Screen extensions registry

## Group 1: Registry, definitions, screen and resolution
package: Atrium
depends on: none
files: src/Domains/Screens/ScreensServiceProvider.php, src/Domains/Screens/Data/Concerns/DefinesExtension.php, src/Domains/Screens/Data/TabDefinition.php, src/Domains/Screens/Data/SectionDefinition.php, src/Domains/Screens/Data/Screen.php, src/Domains/Screens/Data/ResolvedScreen.php, src/Domains/Screens/Services/ScreenExtensions.php, src/Domains/Screens/Services/ScreenVisibility.php, src/Domains/DomainServiceProvider.php, src/Atrium.php, src/Facades/Atrium.php, src/Testing/ResetsScreenExtensions.php, tests/TestCase.php, tests/Pest.php, tests/Unit/Screens/TabDefinitionTest.php, tests/Unit/Screens/SectionDefinitionTest.php, tests/Unit/Screens/ScreenTest.php, tests/Unit/Screens/ScreenExtensionsTest.php, tests/Feature/Screens/ResolveScreenTest.php, tests/Feature/Screens/VisibilityTest.php, tests/Feature/Screens/ResetsScreenExtensionsTest.php
criteria: 1, 2, 3, 4, 5, 6, 7, 8, 11

- [x] 1.1 Write tests: singleton and `Atrium::screens()`; definition setters, defaults, `Error` on writes and closure reads, view/component exclusivity, trailing `Screen` argument; key, slot and target validation (including all the D-026 rejects); clone on register and string keys (`123`, `007`); duplicates per environment (local/testing throw; production reports once and keeps the first); cross-target precedence exact > `pkg.*` > `*` in all three pairings; `snapshot()`/`restore()`/`flush()` and the trait's two-test behaviour; `Screen::make`/`standard()` (package derivation, both kinds' slots, synthetic `overview`); `resolve()` tab ordering, reserved keys (exact and `*`), `?tab=` handling (string only, unknown key 200, hidden key 403); the visibility matrix, throwing `authorize` reported once, memo keyed by morph class plus key or the model itself, `forgetScopedInstances()` between viewers; wildcard matching (`*`, `test.*`), with resolve-level tests only
- [x] 1.2 Implement `Domains/Screens`: `DefinesExtension`, `TabDefinition`, `SectionDefinition`, `Screen`, `ResolvedScreen` (`data()` memoized through `ScreenVisibility`), `ScreenExtensions` (registrations keyed by target and slot, the environment-aware duplicate rule, merging exact, `{package}.*` and `*` at resolve), `ScreenVisibility` (`scoped()`), and `ScreensServiceProvider` registered in `DomainServiceProvider`; `Atrium::screens()` on the class and the facade; `Testing\ResetsScreenExtensions`, used by `tests/TestCase.php`
- [x] 1.3 Run vendor/bin/pest; all green

## Group 2: Rendering components and the test-host screen
package: Atrium
depends on: 1
files: resources/views/components/screen-tabs.blade.php, resources/views/components/screen-tab-panel.blade.php, resources/views/components/screen-sections.blade.php, workbench/app/Atrium/ScreenHost/ScreenHostController.php, workbench/resources/views/screen-host.blade.php, workbench/routes/web.php, tests/Feature/Screens/ScreenTabsComponentTest.php, tests/Feature/Screens/ScreenSectionsComponentTest.php, tests/Feature/Screens/RowSlotsTest.php, tests/Feature/Screens/WildcardRenderingTest.php, tests/Feature/Screens/FailureIsolationTest.php, tests/Feature/Screens/OpenRegisteredTabTest.php, tests/Feature/Screens/EvaluationOrderTest.php, tests/Feature/Screens/ScreenStylesTest.php
criteria: 9, 10, 11, 12, 13, 14, 15, 16

- [ ] 2.1 Write tests against a workbench test-host screen (detail and list variants, with routes `test.host` and `test.list`): host denied with 403 runs no closures; resolvers only run through `data()`; view-path spread order (host's `screen`, `record` and `tab` win); component path gets one `data` prop; row slots (three rows, only the second admitted, call counts, re-render memo, misuse throws, undeclared slot never runs); a `*` section on two screens, `test.*` on `test.a` but not `other.screen`, a `*` tab opening via `?tab=`; failure isolation (markup then throw leaves nothing, reported once across three rows, throwing panel gives 500); tab bar links (query kept except `page`/`tab`, escaping, `data-testid`, `aria-current` and the primary variant only on the open tab, escaped labels, unknown icon falls back to `squares-2x2`, nothing with fewer than 2 visible tabs); sections wrapper, order, `class` passthrough, empty slot; criterion 15's layout around an open registered tab; `AtriumStyles::missingClasses()`/`inlineStyles()` empty for the new components
- [ ] 2.2 Implement the three components (tab bar as a non-wrapping `overflow-x-auto` nav of `x-atrium::icon-button`; buffered, isolated section rendering; panel rendering per criterion 9) and the workbench test-host controller, view and routes
- [ ] 2.3 Run vendor/bin/pest; all green

## Group 3: Declare Atrium's own screens
package: Atrium
depends on: 2
files: src/Domains/Dashboard/Http/Controllers/DashboardController.php, src/Domains/Dashboard/Http/Controllers/DashboardWidgetController.php, src/Domains/Settings/Http/Controllers/SettingsController.php, resources/views/dashboard/index.blade.php, resources/views/dashboard/widget-body.blade.php, resources/views/settings/index.blade.php, resources/views/settings/show.blade.php, tests/Feature/Screens/AtriumScreensTest.php
criteria: 19

- [ ] 3.1 Write a dataset test over the five screens (`atrium.dashboard`, `atrium.named-dashboard`, `atrium.dashboard-widget`, `atrium.settings`, `atrium.settings-panel`): with a tab and a section registered in every declared slot, each section renders in its slot and not in undeclared ones, the tab appears and opens via `?tab=`; with nothing registered, no tab bar or extra markup (compare against the current response); the existing dashboard and settings suites stay green
- [ ] 3.2 Declare each screen with `Screen::standard()` in its controller (record and kind per the criterion 19 table; `row.actions` per settings panel row on `atrium.settings`) and render `screen-tabs`, `screen-tab-panel` and every declared slot in the views, laid out per criterion 15
- [ ] 3.3 Run vendor/bin/pest; all green

## Group 4: Remove history from Atrium
package: Atrium
depends on: 1
files: src/Domains/History/HistoryServiceProvider.php, src/Domains/History/routes.php, src/Domains/History/Http/Controllers/HistoryController.php, resources/views/history/show.blade.php, resources/views/components/audit-trail.blade.php, resources/views/components/audit/, resources/css/atrium.css, src/Domains/Plugins/Support/Plugin.php, tests/Feature/HistoryPageTest.php, tests/Feature/AuditComponentsTest.php, tests/Feature/HistoryRemovedTest.php
criteria: 20

- [ ] 4.1 Write `HistoryRemovedTest`: `GET history/{package}` returns 404; the controller and the audit component files don't exist; `method_exists(Plugin::class, 'historyNavItem')` is false; `atrium.css` has no `audit` `@source`
- [ ] 4.2 Delete the History domain (and its entry in `DomainServiceProvider`'s provider list, which this group edits after group 1 has merged), `history/show`, `audit-trail`, the `components/audit/` directory, the `@source` lines and `Plugin::historyNavItem()`; delete `HistoryPageTest` and `AuditComponentsTest`; grep `src`, `resources`, `docs` and the workbench for leftover references
- [ ] 4.3 Run vendor/bin/pest; all green

Note: group 4 also edits `src/Domains/DomainServiceProvider.php` to drop `HistoryServiceProvider`, so it runs after group 1, never in parallel with it.

## Group 5: Browser theme and layout matrix
package: Atrium
depends on: 2, 3
files: tests/Browser/ScreenExtensionsTest.php, workbench/app/Atrium/ScreenHost/ScreenHostPlugin.php, workbench/app/Providers/WorkbenchServiceProvider.php
criteria: 17, 18

- [ ] 5.1 Write `ScreenExtensionsTest` as a Pest dataset over 6 themes x `sidebar`/`top` x light/dark (24 named cases). Each case renders the test host with 2 built-in tabs, 12 registered tabs (one long label), a normal-slot section and a row-slot section, then asserts:
  - the last tab scrolls into view, clicks, and has `aria-current="page"`
  - the open tab's computed background differs from an idle tab's
  - the nav has `overflow-x` auto or scroll and `flex-wrap: nowrap`, its links `white-space: nowrap`, and all links share one top offset
  - in the top layout, no tab overlaps `top-tabs`
  - both sections render
  - a screenshot is saved per case

  Add a workbench plugin with pages so that `top-tabs` exists.
- [ ] 5.2 Fix any theme or layout issue the matrix exposes, using tokens only
- [ ] 5.3 Run vendor/bin/pest and composer test:browser; all green

## Group 6: Documentation, architecture and build
package: Atrium
depends on: 3, 4, 5
files: README.md, resources/boost/skills/atrium-development/SKILL.md, CLAUDE.md, docs/agent/standards/atrium/domains.md, CHANGELOG.md, tests/Feature/DocsTest.php, tests/ArchTest.php, public/atrium.css, composer.json
criteria: 16, 20, 21, 22

- [ ] 6.1 Write the docs test (the "Screen extensions" section exists in the README and the Boost skill, containing `boot()`, `403`, `vendor.key`, `Keystone` and `config`). Extend `ArchTest`: the Screens classes are final with strict types, the value objects use `public private(set)`, `ScreensServiceProvider` is registered, and `composer.json` requires only Keystone among suite packages.
- [ ] 6.2 Write the README and Boost "Screen extensions" section, covering every bullet in criterion 21, including the config-defaults example. Update `CLAUDE.md` and `domains.md` (add Screens, drop History). Write the `CHANGELOG.md` entries for the new registry and the history-removal upgrade note, naming each removed route, class, method and component and pointing to Keen.
- [ ] 6.3 Run `npm run build:css` and commit `public/atrium.css`. Grep the workspace for `atrium.history`, `x-atrium::audit` and `historyNavItem` and record the results for the PR.
- [ ] 6.4 Run vendor/bin/pest, composer test and composer test:browser; all green
