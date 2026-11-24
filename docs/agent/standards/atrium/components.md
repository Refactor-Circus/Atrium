---
description: "Atrium renders one HTML page: PHP sends JSON keyed by component, and the prebuilt Vue 3 front end (sources in ui/) renders it with components that modules register by key through defineAtriumModule(); the SDK in ui/sdk owns every shared component and style, built on Nuxt UI with Iconify icons"
tags: [atrium, frontend, vue, modules, components, api]
kind: architectural
---

# Components and the Front End

Atrium's PHP side serves data; its prebuilt front end renders it (D-079 to D-087, `MODULES.md`). The one HTML Atrium renders is the `Frontend` domain's page, `atrium::app`, which loads Atrium's app from the committed `dist/` and every module's script and stylesheet. The SDK owns every shared component and style of the dashboard.

## The contract between PHP and Vue

- Every widget, screen tab, screen section and settings panel is sent as `{key, component, data}` (plus its own fields). `component` is a client key, not a template name: it defaults to the definition's key and changes with `->component('...')`.
- The front end looks `component` up in the registry a module fills with `defineAtriumModule({ key, widgets, extensions, settingsPanels, ... })` (tabs and sections are `extensions`), or with `useAtrium().widget()` / `.extension()` / `.settingsPanel()` from a module's `setup()`. A key with no component renders `<AtriumUnregistered>`, never an error.
- Component props are fixed: a widget gets `data` and `settings`, an extension `data` and `record`, a settings panel `data`.
- `data` is whatever the PHP resolver returned, checked by `Support\JsonData`: JSON-serializable values only, preferably a JSON resource. A failed resolver arrives as `data: null` plus `error`, and the front end renders `<AtriumErrorCard>`.
- Links are `{path, external}` from `Support\ClientPath` against `atrium.client_path`, or null. The front end renders only paths starting with `/` or http(s) URLs, and external links get `rel="noopener noreferrer"` (`<AtriumLink>`).
- Icons are Iconify names (`i-lucide-home`), validated by `Support\Iconify` when a PHP definition is built and rendered by `<AtriumIcon>` with a fallback for unknown names.

## The workspace

- `ui/` is a pnpm workspace: `ui/sdk` (`@refactor-circus/atrium`, the SDK), `ui/app` (Atrium's entry, router, layouts and core pages, built to `dist/`) and `ui/workbench` (the workbench's module). No package's module lives in Atrium (D-089). Vue 3, Vue Router, Pinia, Nuxt UI 4 through its Vite plugin in Vue mode, vue-i18n and VueUse, built with Vite. Every build is committed with its `build.json` (D-085).
- The SDK's public surface: the registry (`useAtrium()`: `auth()`, `widget()`, `extension()`, `settingsPanel()`, `searchSource()`, `live()`, `responseHandler()`, `notify()`), `defineAtriumModule()`, the `useAtrium*` composables (including `useAtriumIntegration()`, `atriumClientOptions()` and `useAtriumClient()`), the `Atrium*` components, the types, the Vite preset (`@refactor-circus/atrium/vite`), Nuxt UI as Atrium compiled it (`@refactor-circus/atrium/ui`), the module stylesheet (`@refactor-circus/atrium/module.css`) and the test helpers (`@refactor-circus/atrium/testing`). Anything else is internal.
- The shared modules of the page's import map are a versioned API (`ATRIUM_SHARED_API` in `ui/sdk/vite/shared.mjs`): removing a specifier or moving a library to a new major is a new major.
- The SDK's response types in `ui/sdk/src/types/atrium.ts` are aliases of `components['schemas']` in `ui/sdk/src/client/schema.d.ts`, generated from Atrium's `openapi.json` (`pnpm -C ui generate:client`), with the public names kept.
- Atrium's own strings come from `ui/sdk/locales` (`en` shipped); each module brings its own `messages`; server-side labels stay translated by Laravel.
- Icons come from collections bundled locally (`lucide`; more with `addAtriumIcons()`); the remote Iconify API stays off unless `atrium.icons.remote` is on.
- Styling uses Nuxt UI components and the design tokens in `ui/sdk/css/theme.css`, shared by Atrium's stylesheet (`ui/app/src/assets/atrium.css`) and every module's. Nuxt UI is compiled once, in Atrium's build, with the theme config in `ui/sdk/vite/ui-config.mjs`; modules never run its plugin for a build or bundle it, and their utilities go in the `atrium-modules` layer (D-084). Themes (`Domains\Themes`) are sent in the shell as token values and applied on `:root`; never hard-code a colour a theme should own.

## Modules and suite packages

- A package's Atrium UI is PHP definitions and JSON plugin routes, plus a module: Vue code built with `atriumModule()`, committed to `dist/atrium/`, declared in its `composer.json` under `extra.atrium` (`scripts`, `styles`), with no Composer dependency on Atrium.
- The eight suite packages (Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster, Showroom) each ship their module this way, in the package's own `atrium/` (D-089), and call the package's API through `useAtriumIntegration(pkg).client`; they are the examples `MODULES.md` points to. Never stage a package's module in Atrium's `ui/` (no `ui/modules/{pkg}`); see [[integrations]].
- A module ships no design tokens of its own: its components are built from Nuxt UI and the SDK's `Atrium*` components (`AtriumNoAccess`, `AtriumIntegrationScreen`, `AtriumErrorCard`, ...) and tokens.
- When a package needs a generic piece of UI, add an `Atrium*` component to `ui/sdk` rather than styling it in the module.
- The SDK is a library installed under `node_modules`, where no consumer's resolver reaches (D-088): every SDK `.vue` file imports each `Atrium*` component it renders (`./AtriumX.vue`) and each `U*` from the same `@nuxt/ui/...` file `ui/sdk/src/ui.ts` exports it from, and every type its sources import comes from its own `dependencies`. Atrium's suites leave SDK sources out of the component resolver, and `ui/scripts/check-consumer.mjs` (in `composer test:ui`) builds, type-checks and tests a module against the packed SDK.
- A module never imports from another module. The SDK and Atrium's app refer to no suite package's keys, except through the shell's data and the integration fixtures.

## Enforcement

- `tests/ArchTest.php` fails if `src/` outside `Domains\Frontend` calls `view(`, references `Illuminate\View` or uses `Blade::`.
- PHP feature tests compare the API's payloads with the contract fixtures in `ui/sdk/test/fixtures` (rewritten only with `UPDATE_FIXTURES=1`), and Vitest type-checks each fixture against the SDK's types.
- `tests/Feature/Frontend/BuildFreshnessTest.php` fails when a committed build's source hash is stale.
- `composer test:ui` runs the frozen install, the `generate:client` and `theme:check` checks, typecheck, Vitest and every build. Run it after any change under `ui/`, and commit the rebuilt `dist/` and `ui/workbench/dist/atrium/`.
