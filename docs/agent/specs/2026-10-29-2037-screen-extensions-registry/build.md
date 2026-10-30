# Build: Screen extensions registry

## Group 1 (salvaged)

**Found.** No index lock and no merge or rebase in progress. The previous build agent left every group 1 file in the worktree, uncommitted: the `Domains/Screens` domain (`ScreensServiceProvider`, `DefinesExtension`, `TabDefinition`, `SectionDefinition`, `Screen`, `ResolvedScreen`, `ScreenExtensions`, `ScreenVisibility`), `Testing\ResetsScreenExtensions`, the edits to `DomainServiceProvider`, `Atrium`, the facade and `tests/TestCase.php`, and all seven test files. It had ticked 1.1 to 1.3 in `tasks.md` but committed nothing and wrote no build note. `tests/Pest.php` needed no change and is untouched.

**Checked.** Read every file against criteria 1 to 8 and 11 and task 1.1's list: singleton and `Atrium::screens()`; setters, defaults, `Error` on writes and closure reads, view/component exclusivity, trailing `Screen`; key, slot and target validation with every D-026 reject; clone on register; `123`/`007` as strings through `?tab=`; duplicates per environment (local/testing throw, production reports once and keeps the first); cross-target precedence in all three pairings for tabs and sections; `snapshot()`/`restore()`/`flush()` and the trait's two-test behaviour; `Screen::make`/`standard()`; tab ordering, reserved keys (exact and `*`), `?tab=` string-only, unknown key 200, hidden key 403; the visibility matrix, throwing `authorize` reported and called once, memo by morph class plus key or the unsaved model itself, `forgetScopedInstances()` between viewers; `*` and `test.*` matching. All present. `php -l` passes on all 20 files. The suite was not run here; the gate runs it.

**Committed.** The 20 group 1 files listed above, plus 1.1 and 1.2 ticked in `tasks.md` and this note.

**Left.**
- 1.3 (`vendor/bin/pest` green) is unticked: there is no record that the previous agent ran the suite.
- Two related edits by the previous agent sit outside the group's file list and are left uncommitted in the worktree: `phpstan.neon.dist` adds `tests/TestCase.php` to the analysed paths, so PHPStan analyses the published `ResetsScreenExtensions` trait through its one user instead of reporting it unused; and `docs/agent/standards-feedback.md` records `Screen::kind()` taking a string (with `Screen::DETAIL`/`Screen::LIST`) rather than an enum, because the spec fixes `kind('detail'|'list')` and `standard(string $key, string $kind)`. `composer analyse` likely needs the `phpstan.neon.dist` change.
- `AGENTS.md` and the group 5 bullet reformat in `tasks.md` are not group 1 changes and are left as found.

## Group 1

Retry to finish 1.3. Nothing had run the group's tests before this, so this pass ran them.

**Files.** `tests/Feature/Screens/VisibilityTest.php` (fixed); also `phpstan.neon.dist` and `docs/agent/standards-feedback.md`, which are outside the group's file list (see Deviations).

**Tests.** `vendor/bin/pest tests/Unit/Screens tests/Feature/Screens` first failed 4 of 172 tests, all in `VisibilityTest`: "hides an extension whose authorize closure throws" and "evaluates afresh for another viewer", for both the tab and the section case. The bug was in the tests, not in `ScreenVisibility`. Each test registered its counting closure inside an arrow function (`fn ($d) => $d->authorize(function () use (&$calls) { ... })`). An arrow function captures `$calls` by value, so the counter the inner closure incremented was the arrow function's copy and the test always saw 0. Both registrations are now plain closures that capture `use (&$calls)` / `use (&$asked, &$resolved)`. After the fix, all 172 pass (392 assertions). `pint --test` passes on every group 1 file, and `phpstan analyse` passes with 0 errors. The full suite was not run here; the gate runs it.

**Deviations.**
- `phpstan.neon.dist` adds `tests/TestCase.php` to the analysed paths, and this group needs it. Without it, PHPStan reports `trait.unused` on the published `Testing\ResetsScreenExtensions` trait (checked against a copy of the config without that path) and `composer analyse` fails. With it, PHPStan analyses the trait through its one user.
- `docs/agent/standards-feedback.md` records the `data/value-objects` deviation: `Screen::kind()` takes a string, with `Screen::DETAIL`/`Screen::LIST` constants, instead of an enum, because the spec fixes `kind('detail'|'list')` and `Screen::standard(string $key, string $kind)`.

## Group 4

Built in the `--g4` worktree on `ring-master/2026-10-29-2037-screen-extensions-registry--g4`.

**Files.**
- Added `tests/Feature/HistoryRemovedTest.php`: `GET /atrium/history/billing` is 404 even with an auditing package and an installed audit trail, and `atrium.history.show` is not a route; `HistoryController` and `HistoryServiceProvider` don't load, and `src/Domains/History`, `history/show`, `audit-trail` and `components/audit/` don't exist; `method_exists(Plugin::class, 'historyNavItem')` is false; no `@source` line in `atrium.css` names `audit` or `history/`.
- Deleted `src/Domains/History/` (provider, `routes.php`, `HistoryController`), `resources/views/history/show.blade.php`, `resources/views/components/audit-trail.blade.php`, `resources/views/components/audit/` (`entries`, `changes`), `tests/Feature/HistoryPageTest.php` and `tests/Feature/AuditComponentsTest.php`.
- Edited `resources/css/atrium.css` (dropped the four `@source` lines) and `src/Domains/Plugins/Support/Plugin.php` (removed `historyNavItem()` and its now unused imports).

**Tests.** The new test was written before the deletions. The suite was not run here; the gate runs it.

**Deviations.** These files are outside the group's list:
- `src/Domains/DomainServiceProvider.php`: dropped `HistoryServiceProvider`, as task 4.2 says.
- `tests/Feature/DomainLayoutTest.php`: dropped `HistoryServiceProvider` from its provider dataset. Without this the test can't load the class.
- `lang/en/atrium.php`: removed the 24 `audit_*` keys. Only the deleted views and `historyNavItem()` used them. Keen ships its own.
- `config/atrium.php`: in the `audit` comment, the claim that Atrium shows each package's history now says Keen does it.
- `docs/agent/standards/atrium/components.md`: dropped `audit-trail`, `audit.entries` and `audit.changes` from the generic pieces.

**Left for group 6** (it owns these files): `README.md` lines 96, 101 and 173 (`historyNavItem`, `x-atrium::audit-trail`, the History components list); `History` in `CLAUDE.md`, in `docs/agent/standards/atrium/domains.md` and in that standard's description in `docs/agent/standards.index.yml`; rebuilding `public/atrium.css`; the `CHANGELOG.md` upgrade note. The Boost skill had no references.

## Group 2

Built in the `--g2` worktree on `ring-master/2026-10-29-2037-screen-extensions-registry--g2` (commit `667f2d8`).

**Files.**
- Components: `resources/views/components/screen-tabs.blade.php` (a `flex ... overflow-x-auto` `<nav data-testid="screen-tabs">` of `x-atrium::icon-button` links built with `request()->fullUrlWithQuery(['page' => null, 'tab' => $key])`, primary variant and `aria-current="page"` on the open tab only, unknown icons fall back to `squares-2x2`, nothing below two tabs), `screen-sections.blade.php` (visible sections in order, each wrapped in `data-testid="section-{key}"` with any `class`, each rendered into a buffer and isolated), `screen-tab-panel.blade.php` (the open registered tab in `data-testid="tab-panel-{key}"`, with failures left to propagate).
- Workbench: `workbench/app/Atrium/ScreenHost/ScreenHostController.php` (`detail` → `test.host`, `list` → `test.list` with three keyed rows; both take another screen key as `{screen?}`; it authorizes through the `viewScreenHost` gate when one is defined, then declares `Screen::standard()`, adds the built-in tabs from `config('screen-host.tabs')` and the extra slots from `config('screen-host.slots')`, and resolves; `register()` loads the routes and the `workbench::` views into a feature test's app), `workbench/resources/views/screen-host.blade.php` (laid out per criterion 15), `workbench/routes/web.php`.
- Tests (all in `tests/Feature/Screens/`): `EvaluationOrderTest`, `RowSlotsTest`, `WildcardRenderingTest`, `FailureIsolationTest`, `ScreenTabsComponentTest`, `ScreenSectionsComponentTest`, `OpenRegisteredTabTest`, `ScreenStylesTest`.

**Tests.** Written before the components. The group's test files and the rest of `tests/Feature/Screens` (99 tests, 383 assertions) pass, as do `tests/ArchTest.php`, `AtriumStylesTest` and `ComponentLibraryTest`. `pint --test` passes on the new PHP files. The full suite was not run here; the gate runs it.

**Deviations.**
- These files are outside the group's list. They are shared fixtures in `tests/Fixtures/views`, which is already on the test view path (testing/test-layers puts shared fixtures there): `screens/marker.blade.php`, `screens/spread.blade.php`, `screens/throws.blade.php` and the anonymous component `components/screen-probe.blade.php`.
- Section isolation snapshots the view factory's state and restores it when a section fails. When a view throws, Laravel's `View::render()` calls `flushState()`, which empties the enclosing page's component stack, and the page then fails with a 500. A buffer alone cannot isolate the failure.
- `flex-nowrap` is not in the compiled `public/atrium.css`, so the nav does not use it. A flex row's default `flex-wrap` is already `nowrap`, which is what criterion 17 measures.
- A section's failure is passed to `report()`, which reports it once per request per screen and key through `ScreenVisibility::report()`. Laravel's handler does not log `HttpException`s, so an `abort()` inside a section is isolated but never logged. The test asserts isolation only for that case.
- `ConvertEmptyStringsToNull` turns a bare query key such as `b` in `?q[]=a&b` into null, and the URL helper then leaves it out of the tab links. The test asserts the escaped `q%5B0%5D=a`.
- View-path data: `screen` is the `Screen`, `record` is the screen's record or the row, and `tab` is the open tab's key (`ResolvedScreen::openTab`). The component path gets only `data`. This is returned to the user as a decision.

## Group 3

Partly built. Four screens are complete. The settings index's `row.actions` is waiting on a decision (see Left).

**Files.**
- `src/Domains/Dashboard/Http/Controllers/DashboardController.php`: after its own 404, declares `Screen::standard('atrium.dashboard' | 'atrium.named-dashboard', 'detail')` with the dashboard as its record, and passes `resolved` to the view.
- `src/Domains/Dashboard/Http/Controllers/DashboardWidgetController.php`: after its 404s, declares `atrium.dashboard-widget` (detail, with the widget as its record) and passes it as `widgetScreen`. It is not passed as `resolved` because the dashboard page includes `widget-body` inline for widgets that are not lazy, and the dashboard's own `$resolved` would leak into that include.
- `src/Domains/Settings/Http/Controllers/SettingsController.php`: `atrium.settings` (list, no record) and, after the 404, `atrium.settings-panel` (detail, no record).
- Views (`dashboard/index`, `dashboard/widget-body`, `settings/index`, `settings/show`) are laid out per criterion 15. `header.actions` goes in the page header's actions, and the tab bar sits under the header. An open registered tab's panel replaces the page content. `before` and `after` render above and below that content. `aside` is a `lg:grid-cols-3` column (`data-testid="screen-aside"`) that renders only when it has a visible section. The dashboard also hides its edit-layout buttons and save status while a registered tab is open. The settings pages add the page header's actions slot only when `header.actions` has a visible section. As a result, with nothing registered, no wrapper, tab bar or empty actions container renders.
- `tests/Feature/Screens/AtriumScreensTest.php`: a dataset over the five screens:
  - A section in every slot renders in its slot, in order (header actions, then the tab bar, `before`, the page content, `aside`, `after`), and its resolver runs once.
  - A section in an undeclared slot never renders, and its resolver never runs.
  - The tab appears beside `overview` and opens through `?tab=`, showing only `header.actions` and the panel.
  - With nothing registered, there is no tab bar, tab, section or aside markup.
  - Two further tests: a widget body with nothing registered is byte-for-byte the widget's own view (trimmed), and the dashboard's inline widget bodies never render `atrium.dashboard-widget` sections.

**Tests.** Written before the code. `AtriumScreensTest` passes (17 tests, 177 assertions). `SettingsTest`, `LazyWidgetTest`, `DashboardRoutesTest`, `DashboardLayoutTest`, `DashboardPersistenceTest`, `AtriumStylesTest` and `ArchTest` also pass (75 tests). `pint --test` and `composer analyse` pass. The full suite was not run here; the gate runs it.

**Deviations.** None. Every class used is already in the compiled `public/atrium.css`.

**Left.**
- `row.actions` on `atrium.settings` is declared, because `Screen::standard(..., 'list')` declares it, but it is not rendered per settings panel row. A settings panel is a `SettingsPanel` value object, not a model. `ResolvedScreen::rowSections()`, `data()` and `x-atrium::screen-sections :row` all take a `Model`, so rendering it needs a choice about the public contract. That choice is returned to the user as a decision. The dataset leaves `row.actions` out of the settings index's expected slots until it is settled. 3.1 and 3.2 stay unticked for this reason, and 3.3 stays unticked with them.
- No Atrium screen sets `access()`, so `permission()` extensions are hidden on all five (criterion 8's default). Which permission check Atrium's screens should use is returned to the user as a decision.

## Group 3

Run 3, after D-031 and D-032. D-032 is built. D-031 is stopped before any code because it conflicts with an arch test (see Left).

**Files.**
- `src/Domains/Dashboard/Http/Controllers/DashboardController.php`, `DashboardWidgetController.php` and `src/Domains/Settings/Http/Controllers/SettingsController.php`: all five screens (`atrium.dashboard`, `atrium.named-dashboard`, `atrium.dashboard-widget`, `atrium.settings`, `atrium.settings-panel`) declare the D-032 `access()` closure, `Gate::forUser($request->user())->allows($permission, $record ? [$record] : [])`. `SettingsController` shares it between its two screens through a protected `access(Screen)` method.
- `tests/Feature/Screens/AtriumScreensTest.php`: two new tests.
  - On every screen, a `permission()` tab and `header.actions` section show while the Gate allows the ability and are hidden while it denies it (10 cases).
  - The Gate gets the screen's record as its one argument: the dashboard on both dashboard screens and the widget on the widget screen. It gets no arguments on the two settings screens (5 cases).

**Tests.** Written before the code. The "allowed" cases fail without `access()`, because criterion 8 hides every `permission()` extension on a screen that has none. `AtriumScreensTest` passes (32 tests, 237 assertions). `pint --test` passes on the changed files and `composer analyse` reports 0 errors. The full suite was not run here; the gate runs it.

**Deviations.** None.

**Left.**
- D-031 (`row.actions` per settings panel row) is not built. D-031 places the stand-in at `Domains\Settings\Models\SettingsPanelRowModel` and says its policy entry keeps the every-model-has-a-policy arch test passing. It doesn't cover the arch test "every model fires an event for every lifecycle hook" (`Arch::modelEventGaps()` over every `Domains/*/Models/*.php`, per models/lifecycle-events). A stand-in at that path fails that test unless it uses `DispatchesModelEvents` and ten `Domains\Settings\Events\SettingsPanelRow{Hook}Event` classes exist. None of those events would ever fire, because the model is never saved. Adding them creates public event classes, and exempting the stand-in changes `tests/ArchTest.php` (group 6's file) and breaks a standard. That choice is returned to the user as a decision. The model, its policy, the `atrium.policies` entry, the per-row rendering and the per-row test all wait on it.
- 3.1 and 3.2 stay unticked until `row.actions` is built, and 3.3 stays unticked with them.

## Group 3

Run 4, after D-033. This finishes `row.actions` on `atrium.settings` and the group.

**Files.**
- Added `src/Domains/Settings/Data/SettingsPanelRow.php`. It is a final Eloquent model with strict types, and it is never saved. Its string primary key `key` holds the panel's key, it has no incrementing key or timestamps, and it carries the panel as `public private(set) SettingsPanel $panel`. Rows are built with `SettingsPanelRow::for($panel)`. It sits in `Data/`, not `Models/`, so it has no policy entry, no lifecycle events and no arch-test exemption (D-033).
- `src/Domains/Settings/Http/Controllers/SettingsController.php`: `index()` passes `rows`, one `SettingsPanelRow` per visible panel. It still passes `panels` as well, so views that hosts have already published keep working.
- `resources/views/settings/index.blade.php`: iterates `rows`. Each panel card renders `x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$row" class="mt-3"` under its button. The cards sit inside the built-in branch, so row sections don't render while a registered tab is open (criterion 15).
- `tests/Feature/Screens/AtriumScreensTest.php`:
  - The dataset's settings index now expects `row.actions` as a rendered slot (the full plugin's panel is its one row), placed after the page content. The open-tab case now also asserts that `row.actions` is hidden and its resolver never runs.
  - New test: three panel rows (`alpha`, `beta`, `full`) with a section that admits only `beta`. The markup appears once, in `beta`'s card. `authorize` ran three times, each time with that row's `SettingsPanelRow` (key, panel key and the `Screen`), and the resolver ran once.
  - New test: rendering fresh `SettingsPanelRow` instances for the same panels twice in one request makes no further calls. This shows the memo is keyed by the panel key, not the object.
  - New test: a row is unsaved, keyed by the panel key, and carries the panel.

**Tests.** Written before the code. They use `SettingsPanelRow`, which didn't exist yet, but they were not run until the code was in. These pass:
- `AtriumScreensTest`: 35 tests, 264 assertions.
- `SettingsTest`, `ArchTest` and `AtriumStylesTest`: 34 tests.

`pint --test` passes on the changed files, and `composer analyse` reports 0 errors. The full suite was not run here; the gate runs it.

**Deviations.** None. `mt-3` is already in the compiled `public/atrium.css`.

## Group 3

Run 5, a retry for 3.1 (the per-row `row.actions` test), 3.2 (`SettingsPanelRow` and per-row rendering) and 3.3. Run 4 (`a403788`) had already committed all of it and ticked 3.1 to 3.3, so this run changed no code.

**Files.** None changed beyond this note. Checked against D-031 and D-033:
- `src/Domains/Settings/Data/SettingsPanelRow.php` is final, has strict types, and is an unsaved Eloquent model keyed by the panel key that carries the `SettingsPanel`.
- `SettingsController::index()` passes one row per panel.
- `settings/index` renders `screen-sections slot="row.actions" :row="$row"` once per panel card.
- The arch test "action input validates itself" scans `Data/` only for subclasses of Keystone's `Data`, so the stand-in doesn't trip it.

**Tests.** `AtriumScreensTest`, `ArchTest` and `SettingsTest` pass (56 tests, 293 assertions). The full suite was not run here; the gate runs it.

**Deviations.** None.

## Group 5

**Files.**
- Added `workbench/app/Atrium/ScreenHost/ScreenHostPlugin.php`. It is a final plugin keyed `screen-host`, with a `Screen host` navigation group whose two pages are `test.host` and `test.list`. The top layout draws a group with pages as a `top-tabs` row, so the matrix has a row to check for overlap.
- `workbench/app/Providers/WorkbenchServiceProvider.php` registers the plugin for `composer serve`.
- Added `tests/Browser/ScreenExtensionsTest.php`. It runs the dataset `screen extension looks`, 6 themes x `sidebar`/`top` x light/dark, as 24 named cases (`with data set "ledger top dark"`).
  - **Setup.** Each case registers the plugin with `ScreenHostController::register()` and renders `test.list`. The page has the built-in tabs `details` and `activity`, and twelve public registered tabs, `acme.tab-1` to `acme.tab-12`. The last one has the long label. There is a section in `before` and one in the `row.actions` row slot.
  - **Theme, layout and mode.** The theme comes from `atrium.themes.default`. The case sets the theme's layout on the registry's `Theme` before the visit. The mode comes from `inDarkMode()`/`inLightMode()`. The test asserts `data-atrium-theme`, `data-atrium-layout` and `.dark` match the case. In the top layout it also asserts the sidebar is hidden and the `group-screen-host` `top-tabs` row is visible. In the sidebar layout it asserts the sidebar is visible and the top nav is hidden.
  - **Sections.** The `before` section renders once. The row section renders three times, once per row, including in `row-2`.
  - **Tab bar.** These are asserted before and after the last tab opens. The links come in order: built-ins first, then the registered tabs. The nav's computed `overflow-x` is `auto` or `scroll`, and its `flex-wrap` is `nowrap`. Every link's `white-space` is `nowrap`. All links share one rounded top offset. In the top layout, exactly one `top-tabs` row is on screen and no tab's box overlaps it. In the sidebar layout there is none.
  - **Last tab.** After `scrollIntoView`, the last tab lies inside the nav's box and the viewport. A click opens it with `aria-current="page"`, `details` loses `aria-current`, and its panel renders. With the pointer moved onto the panel, the open tab's computed background is not transparent and differs from both `details` and `acme.tab-1`.
  - **Screenshot.** One per case, taken on the built-in tab: `tests/Browser/Screenshots/screen-extensions/{theme}-{layout}-{mode}.png`.

**Tests.** The test was written before the plugin existed. `vendor/bin/pest tests/Browser/ScreenExtensionsTest.php` passes 24 tests (744 assertions), and passes again on a second run. `pint --test` passes on every changed file. Only this file ran: the full suite and `composer test:browser` were not run here, because the gate runs them.

**5.2.** The matrix exposed no theme or layout issue in any of the 24 cases. I looked through the screenshots and nothing is clipped, wrapped or overlapping. No component or stylesheet changed.

**Deviations.**
- `tests/Pest.php` is outside the group's file list. At boot, pest-plugin-browser's `Screenshot::cleanup()` unlinks every entry in `tests/Browser/Screenshots` and then removes the directory. It can't unlink the `screen-extensions` subdirectory, so it can't remove `Screenshots` either. Each failure raises a suppressed warning, and `failOnWarning` fails the run: the second run of the file passed 24 tests and still exited 1 with 2 warnings. `Pest.php` now empties and removes `Screenshots/screen-extensions` before the plugin boots, outside parallel workers so they never race to delete it. The test makes the directory again. With this change, back-to-back runs exit 0.

## Group 5

Run 2, a retry of 5.1 to 5.3. Run 1 (`fb8ad25`) had already committed all of it and ticked 5.1 to 5.3, so this run changed no code.

**Files.** None changed beyond this note. Checked against criteria 17 and 18:
- `tests/Browser/ScreenExtensionsTest.php` runs a Pest dataset of 24 named cases (6 themes x `sidebar`/`top` x light/dark). Each case renders `test.list` with 2 built-in tabs, 12 public registered tabs (the last with a long label), a `before` section and a `row.actions` section.
- Each case asserts these:
  - The theme, layout and mode match the case.
  - Both sections render, the row section once in each row.
  - The nav's `overflow-x` is `auto` or `scroll` and its `flex-wrap` is `nowrap`. Every link's `white-space` is `nowrap`, and all links share one top offset. These are checked before and after the last tab opens.
  - In the top layout no tab overlaps the one visible `top-tabs` row.
  - The last tab scrolls into view, opens on a click with `aria-current="page"`, and, with the pointer on the panel, has a background that differs from the idle tabs'.
  - A screenshot is saved to `tests/Browser/Screenshots/screen-extensions/{theme}-{layout}-{mode}.png`. That path is gitignored.
- `ScreenHostPlugin` gives the top layout its `top-tabs` row. `WorkbenchServiceProvider` registers it for `composer serve`. The test suites boot only `AtriumServiceProvider`, so this registration doesn't affect them.

**Tests.** `pint --test` passes on the four group files (`tests/Pest.php` included). The suite and `composer test:browser` were not run here; the gate runs them.

**Deviations.** None beyond run 1's `tests/Pest.php` change, recorded above.

## Group 6

**Files.**
- `tests/ArchTest.php` gains these rules:
  - The `Domains\Screens` classes are final.
  - `Domains\Screens` and `Testing\ResetsScreenExtensions` declare strict types.
  - Every public property of `Screen`, `TabDefinition`, `SectionDefinition` and `ResolvedScreen` is `public private(set)`, and none of them is a `Closure`.
  - `ScreensServiceProvider` is in `DomainServiceProvider::$providers`.
  - `composer.json`'s `require` lists `refactor-circus/keystone` and no other `refactor-circus/*` package.
  - The History domain, `views/history`, `audit-trail` and `components/audit` no longer exist. This is criterion 20's arch test.
- Added `tests/Feature/DocsTest.php`:
  - The `## Screen extensions` section of the README and of the Boost skill contains `boot()`, `403`, `vendor.key`, `Keystone` and `config`, plus a marker for each bullet of criterion 21.
  - The README, the skill, `CLAUDE.md` and `domains.md` mention no `atrium.history`, `x-atrium::audit`, `audit-trail`, `historyNavItem` or `history/{package}`.
  - `CLAUDE.md` and `domains.md` list `Screens` and not `History`.
  - `CHANGELOG.md` names each removed route, class, method and component, Keen and `ScreenExtensions`.
- `README.md`:
  - New "Screen extensions" section, covering registration (tab, section, row section, `*` section), targets, keys, rendering, visibility, closures and evaluation order, opening tabs (403 versus 200), what renders around an open tab, failures, the theme contract, writing through your own routes, duplicates per environment and across targets, declaring a screen with `Screen::standard()` plus its Blade layout, the suite rule, the config-defaults pattern with an example, and the `ResetsScreenExtensions` trait.
  - Removed "A package's own audit log" (`historyNavItem`, `audit-trail`) and the History components line.
  - Added the Screens components and a `Screens` row in the package layout table.
- `resources/boost/skills/atrium-development/SKILL.md` has the same "Screen extensions" content in compact form. The front-matter description, the component list and the domain list in the anti-patterns are updated, and two anti-patterns are new: registering outside `boot()` or naming another package's screens in code, and requiring a suite package.
- `CLAUDE.md` is a symlink to `AGENTS.md`, so the edit went to `AGENTS.md`. The domain list has `Screens` and drops `History`, and a new "Screens declare themselves" convention says Atrium requires only Keystone and has no audit concept.
- `docs/agent/standards/atrium/domains.md` lists `Screens` and drops History in the front matter and the list. New lines describe the Screens domain and say History belongs to Keen.
- `CHANGELOG.md`:
  - Breaking: an upgrade note naming the `atrium.history.show` route, `HistoryServiceProvider`, `HistoryController`, the `atrium::history.show` view, `x-atrium::audit-trail`, `x-atrium::audit.entries`, `x-atrium::audit.changes`, the rest of `components/audit/` with its `@source` lines, and `Plugin::historyNavItem()`. It points to refactor-circus/keen and says to merge as a group.
  - Added: the registry, Atrium's declared screens and `ResetsScreenExtensions`.
  - Removed: the unreleased Added and Fixed entries that announced the history page, `historyNavItem()` and the audit components, which the note now supersedes.
- `npm run build:css` left `public/atrium.css` byte-identical, because the new components' classes were already compiled. It did add the `@source` lines for `screen-sections`, `screen-tab-panel` and `screen-tabs` to `resources/css/atrium.css`, which is committed.

**Workspace grep (6.3), for the PR.** Pattern: `atrium\.history|x-atrium::audit|historyNavItem`. Excluded: `vendor`, `node_modules`, `.git`, `storage` and `specs`.
- **This worktree:** only `CHANGELOG.md` (the upgrade note), `tests/Feature/HistoryRemovedTest.php` and `tests/Feature/DocsTest.php` (both assert the removal), plus this spec's own files. Nothing in `src`, `resources`, `docs/agent/standards`, the README or the Boost skill.
- **Main checkouts (on `main`, before the grouped merge):**
  - Atrium: 7 files (the history view, `audit-trail`, `Plugin.php`, README, CHANGELOG, two tests). This job removes them.
  - Cortex: 10 files.
  - Impex: 10.
  - Keen: 6.
  - PennantPlus: 6.
  - Polycart: 8.
  - Roster: 9.
  - Showroom: 16.

  In each of these packages the matches are its plugin's `historyNavItem()` call, its views' `x-atrium::audit-trail`, a `HistoryNavigationTest`, and its docs.
  - Keystone, Ringside, Standards and Stretch: none.
- **Sibling job worktrees** (`Cortex--…-register-roster-redirect-domains`, `Impex--…-register-showroom-run-link`, `Keen--…-history-section-by-capability`, `PennantPlus--…`, `Polycart--…`, `Roster--…-adopt-atrium-screen-registry`, `Showroom--…`): the same files still match. Those packages must drop the references in their own specs before the grouped merge (D-009).

**Tests.** I wrote the tests first. Only `tests/ArchTest.php` and `tests/Feature/DocsTest.php` ran here: 31 tests and 92 assertions, all passing. `pint --test` passes on both. I didn't run `vendor/bin/pest`, `composer test` or `composer test:browser`; the gate runs them (6.4 is ticked for the gate).

**Deviations.**
- `AGENTS.md` (the target of the `CLAUDE.md` symlink) is the file actually edited. It already had an unrelated uncommitted line from a ringside sync ("Keep this checkout on `main`…"). Only this group's hunks are committed; that line is left uncommitted.
- `resources/css/atrium.css` is outside the group's file list. `npm run build:css` regenerates its `@source` list, and this commit includes the result.

## Group 6

Run 2, a retry of 6.1 to 6.4. Run 1 (`6877adc`) had already committed all of it and ticked 6.1 to 6.4, so this run changed no committed code.

**Files.** Only this note changed. I checked run 1's work against criteria 16, 20, 21 and 22:
- `DocsTest` and the new `ArchTest` rules are as listed above.
- `composer.json` requires `refactor-circus/keystone` and no other suite package.
- `npm run build:css` leaves `public/atrium.css` byte-identical again.
- A grep of `src`, `resources`, `docs/agent/standards`, the README and the workbench finds no `atrium.history`, `x-atrium::audit`, `historyNavItem` or `audit-trail`. Run 1's workspace grep for the PR stands.

One more `docs` reference turned up. The generated `docs/agent/standards.index.yml` still described `atrium/domains` with `History` and without `Screens`, because run 1 edited `domains.md` without rebuilding the index, and `ringside check` failed. Running `ringside sync` in the worktree rebuilt it, and `ringside check` now passes. The index is gitignored, so there is nothing to commit for it. The sync also rewrote the uncommitted `AGENTS.md` ringside line, which stays uncommitted as before.

**Tests.** `tests/Feature/DocsTest.php` and `tests/ArchTest.php` pass (31 tests, 92 assertions). `pint --test` passes on both files, and `phpstan analyse` reports 0 errors. I didn't run `vendor/bin/pest`, `composer test` or `composer test:browser`; the gate runs them.

**Deviations.** None in the worktree. Outside it, my first `ringside check` and `ringside sync` ran in the workspace root (`/Users/jay/Projects/packages`), because the shell's cwd resets between calls. The sync regenerated the workspace's own ringside outputs: `docs/agent/standards.index.yml`, `docs/agent/standards.summary.md` and 14 `.claude/skills/ring-master-*/SKILL.md` files. Those are generated files, and the workspace is not a git repo.
