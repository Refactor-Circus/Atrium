---
description: "Atrium's domains (Access, Dashboard, Frontend, Integrations, Navigation, Plugins, Screens, Search, Settings, Themes, Widgets), its top-level package-wide code and per-package src/Integrations/{Pkg}, domain providers on Atrium\\Support\\ServiceProvider loading each domain's routes.php into the one JSON API group with loadApiRoutesFrom(), resource placement, and the Dashboard morph aliases."
tags: [atrium, domains, service-providers, routes, resources, api, morph-aliases]
kind: convention
---

# Atrium Domains

Complements [[domain-modules]], [[routes]] and [[resources]]: Atrium's code sits in eleven fixed domains whose providers load their routes into the one JSON API group (the `Frontend` domain's page and asset routes sit outside it).

## Domains

- `Access`, `Dashboard`, `Frontend`, `Integrations`, `Navigation`, `Plugins`, `Screens`, `Search`, `Settings`, `Themes`, `Widgets`, under `RefactorCircus\Atrium\Domains\{Domain}`.
- A new domain is added to this list and its provider to `Domains\DomainServiceProvider::$providers`.
- `Navigation` serves the shell (`atrium.shell`, `Http\Resources\ShellResource`): app, user, navigation (with each item's `live` key), themes, settings summaries, `search` (`min_length`, `per_source`, `sources`), `integrations`, `locale` and `api_version`.
- `Integrations` is the suite integration framework: the `Integration` contract and base, `IntegrationRegistry`, the `InstalledPackages` seam, `IntegrationFeatures`, `ScreenDeclaration`, and the `atrium.screens.show` endpoint (`GET screens/{screen}`) with its own `routes.php`. It is the only domain that knows the seven suite package keys; see [[integrations]].
- `Frontend` serves the front end (D-079 to D-082): the `atrium::app` page at every path under `atrium.client_path` (route `atrium.app`, behind `atrium.client.middleware`), the built files from `/{atrium.assets.path}/{owner}/{version}/{path}` (route `atrium.assets`, no middleware), module discovery from `extra.atrium` (`ModuleDiscovery`, cached by `atrium:discover`) and the app's own modules, scripts and styles (`ModuleRegistry`: `Atrium::module()`, `Atrium::script()`, `Atrium::style()`). It is the one domain that renders HTML, and `atrium.client.enabled = false` registers neither route.
- `Screens` holds the screen extensions registry: `Data\Screen`, `Data\TabDefinition`, `Data\SectionDefinition` and `Data\ResolvedScreen`, the `Services\ScreenExtensions` singleton (`Atrium::screens()`), the `scoped()` `Services\ScreenVisibility` and `Http\Resources\ResolvedScreenResource`. It registers no routes; screens are sent by the endpoints that declare them (Settings declares `atrium.settings` and `atrium.settings-panel`).
- Atrium has no History domain and no audit concept: the history screen, its components and its nav item belong to refactor-circus/keen.

## Top level

- `src/Integrations/{Pkg}/` (`{Pkg}Integration`, `{Pkg}Feature`) and `src/Integrations/Hooks/` sit at the top level, outside the domains, because the registry finds them by convention from the `atrium.integrations` keys and each package's definitions stay in one folder (a recorded departure from [[domain-modules]]). They hold declarations only and import nothing from a suite package.
- Package-wide code: `Atrium` (with `API_VERSION`), `AtriumServiceProvider`, `Facades\Atrium`, `Http\Requests\Request`, `Console\Commands\InstallCommand` (`atrium:install`), `Exceptions\AtriumException` (the abstract base of every Atrium exception, on Keystone's `PackageException`), `Exceptions\UnserializableDataException`, and `Support\` (`ClientPath`, `Iconify`, `JsonData`, `Tables`, `ScreenAccess`, `ServiceProvider`). `JsonData` and `UnserializableDataException` are top level because Widgets, Screens and Settings all use them.
- A domain's own exceptions sit in its `Exceptions/` (`Search\Exceptions\SearchSourceFailedException`), and its own console commands in its `Console/` (`Search\Console\InvokeSearchSourceCommand`, the hidden `atrium:search-source`), registered by its provider.
- Value objects in a domain's `Data/` include `NavItem`, `WidgetDefinition`, `SettingsPanel`, `SearchResult` and `Theme`. Their `icon()` setters take Iconify names only, and their `component` defaults to their key.

## Domain providers and routes

- Domain providers extend `RefactorCircus\Atrium\Support\ServiceProvider` (on Keystone's `Support\ServiceProvider`), not Keystone's base directly.
- Atrium's routes are a JSON API. Each domain that serves endpoints loads its own `routes.php` with `loadApiRoutesFrom()` (`$this->loadApiRoutesFrom(__DIR__.'/routes.php')`): Keystone's group from `atrium.routes.enabled`, `atrium.routes.prefix` (default `atrium/api`) and `atrium.routes.middleware` (default `['api', Authorize::class]`), named `atrium.`, skipped when routes are cached or disabled. Atrium's override forces JSON rendering ahead of the configured middleware. There is no `api.php` and no package-wide routes file.
- `Authorize` stays last in `atrium.routes.middleware`, after the host's guard; it answers 401 JSON for a guest itself and 403 when the `viewAtrium` gate refuses, and runs before route model binding.
- Plugin routes are loaded by `Plugins` inside the same group once every provider has booted, under `plugins/{key}`, named `atrium.plugins.{key}.`, behind the plugin's feature middleware.
- Models bind by public identity: `{dashboard:slug}`, and placements by `{widget:uuid}` with `scopeBindings()`.
- Every endpoint is a one-line controller method, `return $request->persist();`, with a `{Verb}{Entity}Request` doing the work.

## Resources

- A model's resource sits beside it in the domain's `Resources/` (`Dashboard\Resources\DashboardResource`, `DashboardWidgetResource`).
- A payload with no model behind it sits in the domain's `Http/Resources/` (`ShellResource`, `WidgetDefinitionResource`, `ResolvedScreenResource`, `SettingsPanelResource`, `SearchResultResource`).
- Every resource is `final` and extends Keystone's `JsonResource`. Abilities go in `meta.abilities`, added by the request or manager with `->additional()`, never read from the request inside the resource. Internal ids are never exposed.

## Morph aliases

- `DashboardServiceProvider` keeps `RefactorCircus\Atrium\Models\Dashboard` and `RefactorCircus\Atrium\Models\DashboardWidget` as morph aliases for the moved models; a test proves an old stored value resolves.
