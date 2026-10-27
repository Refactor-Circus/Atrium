# Atrium — Extensible Laravel Dashboard Platform

## Context

`refactor-circus/atrium` is currently a bare Laravel package skeleton (placeholder command, placeholder view, placeholder migration, empty `Atrium` class). The goal is to turn it into a plug-and-play admin dashboard platform in the spirit of Laravel Nova, without Nova's central constraint: Nova forces every screen through its resource/field abstraction and a single fixed layout.

Atrium inverts that. It ships a **dashboard shell** (chrome, navigation, auth gate) plus a **shared Blade component library** that developers can use anywhere — inside the shell or in their own pages. Third-party packages register an Atrium plugin and their nav items, pages, settings panels, widgets, and search sources appear automatically. Developers are never forced into a layout; the components are the product, the shell is opt-in scaffolding around them.

Intended outcome: `composer require` a plugin package, and it shows up in the dashboard with zero host-app configuration, while the host app retains full control to disable, reorder, or override anything.

## Shaping Decisions

| Decision | Choice | Why |
|---|---|---|
| Frontend | Blade + Alpine, **no Livewire dependency** in the component library | Components usable in any Laravel app. Plugins may use Livewire; Atrium does not require it. |
| Plugin registration | Auto-discovery, overridable in config | "Register and it shows up" is the core requirement; config escape hatch avoids Nova's rigidity. |
| Routing | Atrium owns the URL prefix; plugins register routes into it | Consistent URLs and one middleware/auth stack. |
| Components | Namespaced Blade components (`x-atrium::card`), publishable | Usable outside the shell, clean upgrade path. |
| Styling | Compiled CSS shipped as an asset, themed via CSS custom properties | No Tailwind build required in host apps; retheming without recompiling. |
| Dashboards | Own tables, per-user + shared, user-configurable, multiple per user | Widgets are *registered as available*, not auto-added. Users compose their own dashboards. |
| Sizing | Phased — foundation first | Full vision planned; plugin registry, shell, nav, gate, components land before widgets/dashboards/search. |

**Key constraint carried through every task:** widgets are *offered*, never auto-placed. A plugin declaring a widget makes it available in the widget picker. Only a user adding it to a dashboard puts it on screen.

## Architecture

```
Atrium (singleton, src/Atrium.php)
├── PluginRegistry      — discovered + configured plugins, ordered, filtered by authorization
├── NavigationRegistry  — nav items contributed by plugins, grouped and sorted
├── WidgetRegistry      — available widget types (NOT placed instances)
└── SearchRegistry      — search sources for the command palette
```

A plugin is a class implementing `RefactorCircus\Atrium\Contracts\Plugin`:

```php
interface Plugin
{
    public function key(): string;              // stable identifier, e.g. "billing"
    public function label(): string;
    public function authorize(Request $request): bool;
    public function navigation(): array;        // NavItem[]
    public function routes(): void;             // called inside Atrium's route group
    public function settings(): ?SettingsPanel;
    public function widgets(): array;           // WidgetDefinition[] — available, not placed
    public function search(): ?SearchSource;
}
```

An abstract `RefactorCircus\Atrium\Plugins\Plugin` base class provides no-op defaults for every optional method, so a plugin that only adds one nav item implements two methods.

**Discovery:** plugin packages declare their plugin class in `composer.json` under `extra.atrium.plugins`. Atrium reads the Composer installed-packages manifest at boot, caches the resolved list, and merges with `config('atrium.plugins')`. Host apps can add, remove, or reorder there. A `atrium:cache` / `atrium:clear` command pair mirrors Laravel's own caching conventions.

## Implementation Tasks

### Task 1 — Save spec documentation

Create `agent-os/specs/2026-09-04-1053-atrium-dashboard-platform/` containing:

- `plan.md` — this plan
- `shape.md` — scope, the decision table above, context
- `standards.md` — note that `agent-os/standards/index.yml` is currently empty, so package conventions come from `AGENTS.md` and the local skills instead
- `references.md` — the local skills studied (`package-scaffold`, `package-testing`) and the existing provider/test wiring
- `visuals/` — empty, no mockups provided

### Task 2 — Plugin contract and registry (foundation)

- `src/Contracts/Plugin.php`, `src/Plugins/Plugin.php` (abstract base with no-op defaults)
- `src/Plugins/PluginRegistry.php` — register, resolve, order, filter by `authorize()`
- `src/Support/Discovery/ComposerPluginDiscovery.php` — read `extra.atrium.plugins` from installed packages
- Replace the empty `src/Atrium.php` body with the facade-backed API: `Atrium::plugin()`, `Atrium::plugins()`, `Atrium::navigation()`, `Atrium::widgets()`
- Wire discovery + registry as singletons in `AtriumServiceProvider::register()`
- Rewrite `config/atrium.php`: `path`, `domain`, `middleware`, `gate`, `plugins`, `theme`

Tests: discovery finds a plugin from a fake package manifest, config-declared plugins merge, disabled plugins are excluded, unauthorized plugins are filtered out.

### Task 3 — Routing, gate, and the dashboard shell

- `routes/atrium.php` — replace the commented placeholder with a real group using `config('atrium.path')`, `config('atrium.middleware')`, and an `Authorize` middleware; call each plugin's `routes()` inside the group
- `src/Http/Middleware/Authorize.php` — checks the `viewAtrium` gate; defined by the host app, denies all by default in non-local environments
- `src/Http/Controllers/DashboardController.php` — renders the shell
- `resources/views/layouts/app.blade.php` — the shell: sidebar, topbar, breadcrumb slot, content slot, all overridable via publishing
- Register the `atrium` view namespace (already wired) and the `x-atrium::` Blade component namespace

Tests: route registers under the configured path, gate denial returns 403, gate pass renders the shell, a plugin's routes land inside the group with the right middleware.

### Task 4 — Navigation registry

- `src/Navigation/NavItem.php`, `NavGroup.php`, `NavigationRegistry.php` — items carry label, icon, route/url, group, sort order, badge callback, and their own `authorize()`
- Sidebar Blade partial rendering the registry, with active-state detection

Tests: items from multiple plugins group and sort correctly, unauthorized items are hidden, active state resolves against the current route.

### Task 5 — Shared Blade component library

Namespaced components under `resources/views/components/`, no Livewire dependency, Alpine for interactivity:

`card`, `stat`, `table` (+ `table.row`, `table.cell`), `button`, `badge`, `modal`, `dropdown`, `tabs`, `empty-state`, `alert`, `form.input`, `form.select`, `form.textarea`, `form.checkbox`, `page-header`, `section`.

Every component works standalone outside the shell. Publishable under the existing `atrium-views` tag.

Tests: each component renders with defaults and with slots/attributes; a component renders correctly outside the dashboard shell.

### Task 6 — Theming and compiled assets

- Tailwind source under `resources/css/`, built output committed to `public/`
- All colors, spacing, radii expressed as CSS custom properties on a root scope so host apps retheme by overriding variables
- `config('atrium.theme')` maps to the variable overrides injected into the layout
- Assets published via the existing `atrium-assets` tag

Tests: published asset path exists after publishing, theme config values reach the rendered layout.

### Task 7 — Widget registry (available, not placed)

- `src/Widgets/WidgetDefinition.php` — key, label, description, default size, the view/component to render, an optional data resolver, and `authorize()`
- `src/Widgets/WidgetRegistry.php` — collects definitions from all plugins
- This task registers widget *types* only. Nothing renders on a dashboard yet.

Tests: plugin widgets appear in the registry, unauthorized widgets are excluded, duplicate keys across plugins throw a clear exception.

### Task 8 — Dashboard persistence

Replace `database/migrations/2026_01_01_000000_create_atrium_placeholder_table.php` with:

- `atrium_dashboards` — id, name, slug, `owner_type`/`owner_id` (nullable polymorphic; null = shared), `is_default`, `is_shared`, timestamps
- `atrium_dashboard_widgets` — id, dashboard_id, `widget_key`, position (row/col/width/height), settings JSON, sort order

Models `src/Models/Dashboard.php` and `DashboardWidget.php`, with an `owner()` morph relation and scopes for a given user plus shared dashboards. Published via the existing `atrium-migrations` tag.

Tests: migrations run on SQLite, a user's dashboards plus shared dashboards resolve together, deleting a dashboard cascades its widgets.

### Task 9 — Dashboard rendering and editing

- Grid renderer that resolves each placed widget's definition from the registry and renders it, skipping definitions that no longer exist so an uninstalled plugin cannot break a dashboard
- Alpine-driven edit mode: add from a widget picker listing available definitions, drag to reposition, resize, remove
- Endpoints to persist layout changes, scoped to dashboards the current user owns
- Dashboard switcher in the topbar; create, rename, delete, and set-default

Tests: placed widgets render, a placed widget whose plugin is gone degrades gracefully, layout saves persist, a user cannot modify another user's dashboard.

### Task 10 — Settings panels

- `src/Settings/SettingsPanel.php` — plugin-contributed settings section with a label, icon, and view
- Settings route and page in the shell aggregating every authorized plugin's panel

Tests: panels appear for authorized plugins only, panel routes resolve.

### Task 11 — Global search / command palette

- `src/Search/SearchSource.php`, `SearchRegistry.php` — a plugin returns results as label, subtitle, URL, icon
- Search endpoint querying all authorized sources
- Alpine command palette in the shell, keyboard-triggered

Tests: results aggregate across plugins, unauthorized sources are skipped, empty query short-circuits.

### Task 12 — Commands, workbench demo, and docs

- Replace `AtriumCommand` with real commands: `atrium:install` (publishes config + assets, prints the gate stub), `atrium:cache`, `atrium:clear`, `atrium:plugin` (scaffolds a plugin class)
- Workbench demo plugin under `workbench/app/` exercising nav, a page, a widget, a settings panel, and a search source, so `composer serve` shows a real dashboard
- README rewrite: installation, defining the gate, writing a plugin, using the component library standalone, theming
- Update `resources/boost/skills/atrium-development/SKILL.md` via the `package-generate-skill` skill

Tests: each command's observable output and side effects; the workbench plugin is discovered and renders.

## Files Being Replaced

These placeholder files from the skeleton go away:

- `src/Console/Commands/AtriumCommand.php` → real commands (Task 12)
- `resources/views/placeholder.blade.php` → shell layout + components (Tasks 3, 5)
- `database/migrations/2026_01_01_000000_create_atrium_placeholder_table.php` → dashboard tables (Task 8)
- `routes/atrium.php` commented placeholder → real route group (Task 3)
- `config/atrium.php` `placeholder` key → real config (Task 2)

## Conventions to Follow

From `AGENTS.md` and the `package-scaffold` skill:

- Namespace stays `RefactorCircus\Atrium\`; publish tags stay `atrium-*`
- Container bindings and `mergeConfigFrom` in `register()`; resource loading in `boot()`
- Keep `publishes`, `publishesMigrations`, and `commands` inside the existing `runningInConsole()` guard
- No `env()` outside config files; `declare(strict_types=1)` everywhere (enforced by `tests/ArchTest.php`)
- No new production dependencies beyond `illuminate/support` without approval

From `package-testing`: TDD per task, Pest 4/5 with Testbench, `tests/TestCase.php` already registers the provider. Type coverage must stay at 100%.

## Verification

Per task:

```
composer test:unit -- --filter <feature>
```

Before finishing each task:

```
composer test        # analyse + lint:check + test:types + test:unit
```

End-to-end, after Task 12:

```
composer build && composer serve
```

Then open the workbench app and confirm: the demo plugin's nav item appears, its page renders in the shell, its widget appears in the picker but is **not** auto-placed, adding it to a dashboard persists across reload, a second dashboard can be created and switched to, the settings panel appears, and the command palette returns the plugin's results.

Gate verification: with no `viewAtrium` gate defined, a non-local request to the dashboard must return 403.
