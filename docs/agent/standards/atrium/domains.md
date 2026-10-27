---
description: "Atrium's domains (Access, Dashboard, History, Navigation, Plugins, Search, Settings, Themes, Widgets), its top-level package-wide code, domain providers on Atrium\\Support\\ServiceProvider loading routes with loadDashboardRoutesFrom(), and the Dashboard morph aliases."
tags: [atrium, domains, service-providers, routes, morph-aliases]
kind: convention
---

# Atrium Domains

Complements [[domain-modules]]: Atrium's code sits in nine fixed domains whose providers load their routes into the one dashboard route group.

## Domains

- `Access`, `Dashboard`, `History`, `Navigation`, `Plugins`, `Search`, `Settings`, `Themes`, `Widgets`, under `RefactorCircus\Atrium\Domains\{Domain}`.
- A new domain is added to this list and its provider to `Domains\DomainServiceProvider::$providers`.

## Top level

- Package-wide code: `Atrium`, `AtriumServiceProvider`, `Facades\Atrium`, `Http\Requests\Request`, `Console\Commands\InstallCommand` (`atrium:install`), `Exceptions\AtriumException` (the abstract base of every Atrium exception, on Keystone's `PackageException`), and `Support\` (`Icons`, `StyleRegistry`, `Tables`, `ServiceProvider`).
- A domain's own exceptions sit in its `Exceptions/` (`Search\Exceptions\SearchSourceFailedException`), and its own console commands in its `Console/` (`Search\Console\InvokeSearchSourceCommand`, the hidden `atrium:search-source`), registered by its provider.
- Value objects in a domain's `Data/` include `NavItem`, `WidgetDefinition` and `SearchResult`.

## Domain providers and routes

- Domain providers extend `RefactorCircus\Atrium\Support\ServiceProvider` (on Keystone's `Support\ServiceProvider`), not Keystone's base directly.
- Atrium's routes are dashboard screens, not a JSON API. A domain loads its `routes.php` with `loadDashboardRoutesFrom()`, which wraps it in the shared group built from `atrium.path` (default `atrium`), `atrium.domain`, `atrium.middleware` (default `['web']`) and the `atrium.` name prefix, and skips cached routes.

## Morph aliases

- `DashboardServiceProvider` keeps `RefactorCircus\Atrium\Models\Dashboard` and `RefactorCircus\Atrium\Models\DashboardWidget` as morph aliases for the moved models; a test proves an old stored value resolves.
