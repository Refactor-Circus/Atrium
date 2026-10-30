# Release Notes

## [Unreleased](https://github.com/Refactor-Circus/Atrium/commits/main)

### Breaking

- Moved to the Refactor Circus organisation: the package is now `refactor-circus/atrium` with the PHP namespace `RefactorCircus\Atrium` (it was `jayi/atrium` and `JayI\Atrium`). Update `composer.json` requirements and `use` statements. Old class names are not kept as aliases, so stored values written under them - polymorphic `*_type` columns, audit subjects, Pennant feature names - need updating to the new names.
- Actions take Data objects, not arrays: `CreateDashboardAction` takes a `CreateDashboardData`, `UpdateDashboardAction` an `UpdateDashboardData` (fields left out stay as they are), and `SaveDashboardLayoutAction` a `SaveDashboardLayoutData` whose `widgets` are `WidgetPlacementData` objects (`Domains\Dashboard\Data`). The requests' validation rules live on the Data, and the starting events carry it: `DashboardCreatingActionEvent::$data` and `DashboardUpdatingActionEvent::$data` are Data objects, and `DashboardLayoutSavingActionEvent` carries `$data` (its `widgets`) in place of `$widgets`.
- `Domains\Dashboard\Policies\Policy::allowsOnDashboard()` is gone: policies defer to the parent dashboard with refactor-circus/keystone's `Policy::allowsOn()`, which takes the same arguments.
- **History moved to Keen.** Atrium has no audit concept any more: the history screen, its components and its nav item now live in [refactor-circus/keen](https://github.com/Refactor-Circus/Keen), which adds a History nav item for every package that audits. Install Keen to keep them, and merge Atrium, Keen and the packages that used them together, since the removal breaks anything still calling them. Removed from Atrium:
  - the `atrium.history.show` route (`GET {path}/history/{package}`), which now answers 404;
  - the `History` domain: `RefactorCircus\Atrium\Domains\History\HistoryServiceProvider` (no longer registered by `Domains\DomainServiceProvider`) and `RefactorCircus\Atrium\Domains\History\Http\Controllers\HistoryController`;
  - the `atrium::history.show` view (`resources/views/history/show.blade.php`);
  - the `x-atrium::audit-trail` component, `x-atrium::audit.entries`, `x-atrium::audit.changes` and the rest of `resources/views/components/audit/`, with their `@source` lines in `resources/css/atrium.css`;
  - `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin::historyNavItem()`: stop calling it from a plugin's `navigation()`; Keen adds the links;
  - the 24 `atrium::atrium.audit_*` translation keys (`audit_history`, `audit_empty`, `audit_when`, `audit_action`, `audit_subject`, `audit_actor`, `audit_surface`, `audit_source_app`, `audit_none`, `audit_system`, `audit_no_changes`, `audit_field`, `audit_before`, `audit_after`, `audit_view_all`, `audit_log`, `audit_log_for`, `audit_action_hint`, `audit_subject_type`, `audit_subject_id`, `audit_filter`, `audit_clear`, `audit_newest`, `audit_older`): a view or a published `lang/vendor/atrium` file that still uses them should take Keen's strings instead.

### Added

- **Screen extensions**: any package can add tabs and sections to any screen that declares itself, registered from its `boot()` with `Atrium::screens()` (`Domains\Screens\Services\ScreenExtensions`, a singleton) for one screen (`{package}.{screen}`), every screen of a package (`{package}.*`) or every screen (`*`). Definitions are `Domains\Screens\Data\TabDefinition` and `SectionDefinition`, visible only through a `permission()` the screen's `access` closure grants, an `authorize()` closure or `public()`; their `authorize` and `resolve` closures receive the `Screen` last. Hosts declare a screen per request with `Screen::standard()` (the `header.actions`, `before`, `after` slots, plus `aside` or the row slot `row.actions`), resolve it with `ScreenExtensions::resolve()` into a `ResolvedScreen`, and render it with the new `x-atrium::screen-tabs`, `x-atrium::screen-sections` and `x-atrium::screen-tab-panel` components. Answers and data are memoized per request in the `scoped()` `ScreenVisibility`; a failing section is reported once and renders nothing. A same-key duplicate on one target throws in `local` and `testing` and is reported and skipped elsewhere; across targets the most specific wins. See the README's "Screen extensions".
- Atrium's own pages declare themselves as screens: `atrium.dashboard`, `atrium.named-dashboard`, `atrium.dashboard-widget`, `atrium.settings` (with `row.actions` per settings panel, as a `Domains\Settings\Data\SettingsPanelRow`) and `atrium.settings-panel`. With nothing registered they render as before.
- `RefactorCircus\Atrium\Testing\ResetsScreenExtensions`, a test case trait that snapshots the screen extensions after boot and restores them after each test (`ScreenExtensions::snapshot()` and `restore()`).

- **Lazy widgets**: `WidgetDefinition::lazy()` renders a placeholder with the dashboard and fetches the widget's body afterwards from the new `atrium.dashboards.widgets.show` route (`GET {path}/dashboards/{dashboard}/widgets/{widget}`), which answers whoever may see the dashboard. Widgets stay eager unless marked lazy.
- **Configurable table names**: both tables are named under the new `atrium.tables` config key (`dashboards`, `dashboard_widgets`) and read by the migrations and models through `Support\Tables` (on refactor-circus/keystone's `Database\Tables`). Rename them before migrating; keys a published config leaves out keep their default.
- Four more themes - **Sunset**, **Forest**, **Midnight** and **Ledger** - and theme layouts: `Theme::layout('top')` (or `'layout' => 'top'` in config) lays the shell out with sections across a bar under the topbar and the current section's pages as tabs beneath, as Ledger does.
- A two-level sidebar: a rail of sections (the app's own pages, then one icon per group) and a docked panel with the current section's pages. Clicking a section shows its pages without leaving the page, and hovering previews them. `NavGroup` gains `icon()` and `sort()` for its place in the rail. `Atrium::navigationSections()` lists the rail's entries.
- Themes: a second built-in theme, **Harbor**, beside the default **Atrium**; themes from `atrium.themes.available` and `Atrium::theme()`; and a theme switcher beside the light/dark toggle, shown behind the `atrium.themes.switcher_feature` feature (Atrium's own `Domains\Themes\Features\ThemeSwitcherFeature` by default, a Pennant feature that is on until turned off, globally or per user, once a feature resolver such as refactor-circus/pennantplus is registered).
- Shared components so the packages of the suite need no markup or styles of their own: `description-list`, `chip`, `search-input`, `flash`, `banner`, `guest`, `form.combobox`, `form.actions`, a `bare` mode for form controls, and `prefix`/`suffix` slots on `form.input`.
- `Plugin::featuresFromConfig()`, `RefactorCircus\Atrium\Support\ScreenAccess` and the `AuthorizesScreens` controller trait, so a package's plugin and screens stop copying the same feature loading and policy checks.
- A safelist of layout utilities in the compiled stylesheet, and `RefactorCircus\Atrium\Testing\AtriumStyles` for checking a package's views use only Atrium's styles.

### Fixed

- The search box cancels the search in flight when the query changes, so a slow, stale response can no longer replace the results of a newer query.
- A missing record on an Atrium route (`atrium.*`), asked for as JSON, answers a plain `{"message": "Not found."}` 404 instead of Laravel's message naming the model class. Pages keep their usual 404.

- A page beneath a navigation item now counts as that item's: an item on a resource's `*.index` route stays active on its `*.show` and `*.edit` pages, and a URL item on the paths beneath it. The sidebar's panel and Ledger's tabs no longer disappear on a record's own page.
- Ledger's top bar no longer has a hover menu as well as its row of tabs.
- Form controls no longer render an `id` twice when one is passed.
- `form.input` and `form.select` no longer use `null` as an array offset when no `wrapper` is passed, which PHP 8.5 deprecates.

### Changed

- `DashboardWidgetPolicy` asks the dashboard's policy through refactor-circus/keystone's `Policy::allowsOn()`, and its methods take the user as `Model&Authenticatable` (it was `Model`): an application subclass typed `Model $user` still works, but a model that is not `Authenticatable` is refused by the type.
- The architecture tests now fail on a table named as a literal string and on a model without a policy in `atrium.policies`.
- `tests/ArchTest.php` also checks that every action writes inside a transaction and that every model fires an event for every Eloquent lifecycle hook (refactor-circus/keystone's `Arch::writesOutsideTransactions()` and `Arch::modelEventGaps()`).
- Updating a dashboard over HTTP may leave out its `name` and change only `is_default`.
- **Faster global search by default**: `atrium.search.concurrency` now defaults to `sync`, running sources inside the request, instead of null (the application's default, usually `process`, which booted a PHP process per source on every keystroke). Set it to `process` for per-source timeouts and concurrency, or to null for the old behaviour.
- The search box waits for `atrium.search.min_length` characters (new, 2 by default) before asking for results, and the search endpoint runs no source for a shorter query.
- Discovered plugins are cached in `bootstrap/cache/atrium-plugins.php` instead of reading Composer's `installed.json` on every boot. `package:discover` and `optimize` rebuild the cache (new `atrium:discover` command), `optimize:clear` removes it (new `atrium:clear-discovered`), and without it discovery reads the packages live as before.
- A page decides which plugins the request may see once (`PluginRegistry::authorized()` answers per request), builds the sidebar's sections from one pass over the groups and items, works out each navigation item's active state and URL once (`Domains\Navigation\Services\NavigationState`, a scoped service), asks whether the theme switcher shows once, and reads the visible dashboards once (`DashboardManager::pick()`).
- An `audit.enabled` config key: set it to false to keep Atrium's own dashboard changes out of Keen's audit log.
- Guests get 401 rather than 403 from Atrium's requests (refactor-circus/keystone's request base).
- With the `process` search driver, each source's results come back from its child process as JSON through the new hidden `atrium:search-source` command, so `SearchRegistry` no longer calls `unserialize()`. Only a result's `title`, `url`, `subtitle`, `icon` and `group` come back: a `SearchResult` subclass, or extra state on one, is no longer preserved. Failures and timeouts are reported as `SearchSourceFailedException` and `SearchSourceTimedOutException` (both `RuntimeException`s). Rebuild caches on upgrade (`php artisan optimize:clear`), or every source fails with the command not defined.

- Atrium now stands on [refactor-circus/keystone](https://github.com/Refactor-Circus/Keystone), the shared runtime of the suite. The `Action` base, the `ActionStartingEvent`, `ActionFinishedEvent` and `ModelLifecycleEvent` contracts and the `DispatchesModelEvents` trait moved there: import them from `RefactorCircus\Keystone\...` instead of `RefactorCircus\Atrium\...`. Atrium registers itself as the `atrium` package.
- Atrium now requires PHP 8.5. CI runs on PHP 8.5 only, and the development dependencies are raised to their latest releases (Playwright 1.64, Alpine.js 3.17.4).

### Fixed

- Opening a dashboard by its slug (`/atrium/d/{slug}`, which the dashboard switcher links to) no longer returns 404. The route parameter was bound to the dashboard model by id.
- The dashboard switcher opens toward the page instead of off its right edge, and labels shared dashboards "Shared".
- Tooltips are no longer clipped by scrolling or `overflow: hidden` containers, such as tables: the bubble is drawn on `<body>`, fixed beside its trigger, and kept inside the viewport.

### Breaking

- The source is reorganised into domain modules under `src/Domains/{Domain}` (`Access`, `Dashboard`, `Navigation`, `Plugins`, `Search`, `Settings`, `Widgets`), mirroring the `mono` application. Almost every class moved; there are no aliases for the old names, so update `use` statements, `extends`/`implements` clauses, and any class names in a published `config/atrium.php` (`middleware`, `policies`). The models are renamed `DashboardModel` and `DashboardWidgetModel`, value objects moved into `Data\`, registries into `Services\`, and model and action events now sit together in `Domains\Dashboard\Events`. `AtriumServiceProvider`, the `Atrium` class and facade, `Actions\Action`, `Http\Requests\Request`, the event contracts (`Contracts\Action*Event`, `Contracts\ModelLifecycleEvent`), `Support\Icons` and `Console\Commands\InstallCommand` keep their names. Config keys, route names, view and component names, translation keys, publish tags, table names and the `atrium.feature` middleware alias are unchanged. The models keep their old class names (`RefactorCircus\Atrium\Models\Dashboard`, `RefactorCircus\Atrium\Models\DashboardWidget`) as morph aliases, so stored polymorphic values still resolve and new rows store the same strings. The full map:

  | Old | New |
  | --- | --- |
  | `RefactorCircus\Atrium\Access\Concerns\Gated` | `RefactorCircus\Atrium\Domains\Access\Concerns\Gated` |
  | `RefactorCircus\Atrium\Access\Gatekeeper` | `RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper` |
  | `RefactorCircus\Atrium\Actions\CreateDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction` |
  | `RefactorCircus\Atrium\Actions\DeleteDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\DeleteDashboardAction` |
  | `RefactorCircus\Atrium\Actions\SaveDashboardLayoutAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction` |
  | `RefactorCircus\Atrium\Actions\UpdateDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction` |
  | `RefactorCircus\Atrium\Assets\StyleRegistry` | `RefactorCircus\Atrium\Support\StyleRegistry` |
  | `RefactorCircus\Atrium\Console\Commands\MakePluginCommand` | `RefactorCircus\Atrium\Domains\Plugins\Console\Commands\MakePluginCommand` |
  | `RefactorCircus\Atrium\Console\Commands\PluginListCommand` | `RefactorCircus\Atrium\Domains\Plugins\Console\Commands\PluginListCommand` |
  | `RefactorCircus\Atrium\Contracts\Plugin` | `RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin` |
  | `RefactorCircus\Atrium\Dashboards\DashboardManager` | `RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager` |
  | `RefactorCircus\Atrium\Events\Action\DashboardCreatedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardCreatingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardDeletedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardDeletingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardLayoutSavedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardLayoutSavingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardUpdatedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardUpdatingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingActionEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardCreatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardCreatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardDeletedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardDeletingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardReplicatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardReplicatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardRetrievedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardRetrievedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardSavedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardSavedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardSavingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardSavingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardUpdatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardUpdatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetCreatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetCreatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetDeletedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetDeletedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetDeletingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetDeletingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetReplicatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetReplicatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetRetrievedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetRetrievedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetSavedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetSavedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetSavingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetSavingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetUpdatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetUpdatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetUpdatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetUpdatingEvent` |
  | `RefactorCircus\Atrium\Exceptions\DuplicateWidgetException` | `RefactorCircus\Atrium\Domains\Widgets\Exceptions\DuplicateWidgetException` |
  | `RefactorCircus\Atrium\Exceptions\InvalidPluginException` | `RefactorCircus\Atrium\Domains\Plugins\Exceptions\InvalidPluginException` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardController` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardCrudController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardCrudController` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardLayoutController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardLayoutController` |
  | `RefactorCircus\Atrium\Http\Controllers\SearchController` | `RefactorCircus\Atrium\Domains\Search\Http\Controllers\SearchController` |
  | `RefactorCircus\Atrium\Http\Controllers\SettingsController` | `RefactorCircus\Atrium\Domains\Settings\Http\Controllers\SettingsController` |
  | `RefactorCircus\Atrium\Http\Middleware\Authorize` | `RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize` |
  | `RefactorCircus\Atrium\Http\Middleware\EnsureFeaturesAreEnabled` | `RefactorCircus\Atrium\Domains\Access\Http\Middleware\EnsureFeaturesAreEnabled` |
  | `RefactorCircus\Atrium\Http\Requests\DeleteDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\DeleteDashboardRequest` |
  | `RefactorCircus\Atrium\Http\Requests\SaveDashboardLayoutRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\SaveDashboardLayoutRequest` |
  | `RefactorCircus\Atrium\Http\Requests\StoreDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\StoreDashboardRequest` |
  | `RefactorCircus\Atrium\Http\Requests\UpdateDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\UpdateDashboardRequest` |
  | `RefactorCircus\Atrium\Models\Concerns\DispatchesModelEvents` | `RefactorCircus\Atrium\Support\Models\Concerns\DispatchesModelEvents` |
  | `RefactorCircus\Atrium\Models\Dashboard` | `RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel` |
  | `RefactorCircus\Atrium\Models\DashboardWidget` | `RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel` |
  | `RefactorCircus\Atrium\Navigation\NavGroup` | `RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup` |
  | `RefactorCircus\Atrium\Navigation\NavItem` | `RefactorCircus\Atrium\Domains\Navigation\Data\NavItem` |
  | `RefactorCircus\Atrium\Navigation\NavigationRegistry` | `RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry` |
  | `RefactorCircus\Atrium\Plugins\Plugin` | `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin` |
  | `RefactorCircus\Atrium\Plugins\PluginRegistry` | `RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry` |
  | `RefactorCircus\Atrium\Policies\DashboardPolicy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy` |
  | `RefactorCircus\Atrium\Policies\DashboardWidgetPolicy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardWidgetPolicy` |
  | `RefactorCircus\Atrium\Policies\Policy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\Policy` |
  | `RefactorCircus\Atrium\Search\SearchRegistry` | `RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry` |
  | `RefactorCircus\Atrium\Search\SearchResult` | `RefactorCircus\Atrium\Domains\Search\Data\SearchResult` |
  | `RefactorCircus\Atrium\Search\SearchSource` | `RefactorCircus\Atrium\Domains\Search\Data\SearchSource` |
  | `RefactorCircus\Atrium\Settings\SettingsPanel` | `RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel` |
  | `RefactorCircus\Atrium\Settings\SettingsRegistry` | `RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry` |
  | `RefactorCircus\Atrium\Support\Discovery\ComposerPluginDiscovery` | `RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery` |
  | `RefactorCircus\Atrium\Widgets\WidgetDefinition` | `RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition` |
  | `RefactorCircus\Atrium\Widgets\WidgetRegistry` | `RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry` |
- The bundled Pennant plugin (the Feature flags page, `FeatureFlagManager`, its requests, actions and `Feature*ActionEvent` events, and the `atrium.pennant` config) moved to `refactor-circus/pennantplus` under `RefactorCircus\PennantPlus\Atrium`. Install that package to keep the page; its settings now live under `pennantplus.atrium`.
- The PHP namespace changed from `Atrium\Atrium` to `RefactorCircus\Atrium`, matching the other `refactor-circus/*` packages. Update `use` statements, the service provider and facade references, and any class names in your config (such as `atrium.php` middleware). The package name `refactor-circus/atrium`, the `atrium::` view namespace, `atrium.*` config keys, route names and `atrium-*` publish tags are unchanged.
- Event classes moved and were renamed. Model events now live in `RefactorCircus\Atrium\Events\Model` (`Events\Dashboard\DashboardCreatedEvent` is now `Events\Model\DashboardCreatedEvent`, and `Events\DashboardWidget\*` moved the same way). Action events moved from `Atrium\Atrium\Events\Actions` to `RefactorCircus\Atrium\Events\Action`. Update the `use` statements of your listeners.
- The `Atrium\Atrium\Events\Event` base class was removed. Events are now final classes implementing `Contracts\ModelLifecycleEvent`, `Contracts\ActionStartingEvent` or `Contracts\ActionFinishedEvent`.
- Model events now fire synchronously as Eloquent fires the hook, rather than after commit, so `creating`, `updating`, `saving` and `deleting` listeners can cancel a write. Action finish events still wait for the commit.
- Dashboard requests are authorized through model policies. Guests can no longer create a dashboard through `POST dashboards`.
- The `Plugin` contract gained `features()` and `navigationGroups()`. Plugins extending `RefactorCircus\Atrium\Plugins\Plugin` inherit empty defaults; classes implementing the contract directly must add both.
- Child navigation items are now filtered by their own rules. A parent without a link of its own is hidden once all of its children are.

### Added

- `Atrium::css()` and `Atrium::stylesheet()` let packages add styles to the dashboard's `<head>`, after Atrium's own stylesheet.
- `icon-button`, `icon` and `status-dot` components and the Heroicons outline set (`RefactorCircus\Atrium\Support\Icons`, extensible with `Icons::register()`), with screen conventions in the README: icon-only actions, status dots with `info` kept for pending, and navigation icons.
- Navigation gating: `NavItem::can()` and `feature()` beside `authorize()`, `NavGroup` rules for whole sidebar groups (from a plugin's `navigationGroups()` or `Atrium::navigationGroup()`), and plugin `features()` that hide a plugin and 404 its routes while a feature is off.
- `Atrium::resolvePermissionsUsing()` and `Atrium::resolveFeaturesUsing()` to plug in any permission or feature-flag system. Permissions default to the Gate; features are on until a resolver is registered.
- `atrium.feature:{features}` route middleware and `Atrium::featureEnabled()`.

- Every action now fires a start event before its work, carrying its input: `DashboardCreatingActionEvent`, `DashboardUpdatingActionEvent`, `DashboardDeletingActionEvent` and `DashboardLayoutSavingActionEvent`.
- `ModelLifecycleEvent`, `ActionStartingEvent` and `ActionFinishedEvent` contracts, to listen to a whole family of events at once. Model events expose `model()` and `hook()`.
- The `DispatchesModelEvents` trait, so an application's subclass of `Dashboard` fires the package's `Dashboard*` events.
- `DashboardPolicy` and `DashboardWidgetPolicy`, registered from the new `atrium.policies` config key. The owner of a dashboard may do anything, everyone may view a shared dashboard, and widget placements defer to their dashboard through the Gate. Every dashboard request, and the dashboard's edit controls, check them on top of the `atrium.gate` gate.

### Changed

- Visual refresh of the shell and every component: a zinc palette, an inset content panel over a new `canvas` token, and quieter buttons, inputs, cards, tables and badges.
- The sidebar collapses to an icon rail with hover labels and child flyouts, folds its groups, and expands child items in place.
- Dark mode is built in, with a light / dark / system switcher in the topbar. Search focuses with ⌘K / Ctrl K.
- Requires `laravel/framework` instead of `illuminate/support`, since the package uses form requests, events, queues and views from the framework.


## [v0.1.0](https://github.com/Refactor-Circus/Atrium/compare/...v0.1.0) - 202x-xx-xx

Initial pre-release.
