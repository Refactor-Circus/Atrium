---
description: "Atrium renders no HTML: PHP sends JSON keyed by component, and the Nuxt layer in nuxt/layer renders it with Vue components registered by key through $atrium; the layer owns every shared component and style, built on Nuxt UI with Iconify icons"
tags: [atrium, frontend, nuxt, vue, components, api]
kind: architectural
---

# Components and the Nuxt Layer

Atrium's PHP side serves data; the Nuxt layer in `nuxt/layer` (`@refactor-circus/atrium-nuxt`) renders it. Nothing in `src/` renders HTML, and the layer owns every shared component and style of the dashboard.

## The contract between PHP and Vue

- Every widget, screen tab, screen section and settings panel is sent as `{key, component, data}` (plus its own fields). `component` is a client key, not a template name: it defaults to the definition's key and changes with `->component('...')`.
- The layer looks `component` up in the `$atrium` registry: `$atrium.widget(key, component)`, `$atrium.extension(key, component)` (tabs and sections) and `$atrium.settingsPanel(key, component)`. A key with no component renders `<AtriumUnregistered>`, never an error.
- Component props are fixed: a widget gets `data` and `settings`, an extension `data` and `record`, a settings panel `data`.
- `data` is whatever the PHP resolver returned, checked by `Support\JsonData`: JSON-serializable values only, preferably a JSON resource. A failed resolver arrives as `data: null` plus `error`, and the layer renders `<AtriumErrorCard>`.
- Links are `{path, external}` from `Support\ClientPath`, or null. The layer renders only paths starting with `/` or http(s) URLs, and external links get `rel="noopener noreferrer"`.
- Icons are Iconify names (`i-lucide-home`), validated by `Support\Iconify` when a PHP definition is built and rendered by `<AtriumIcon>` with a fallback for unknown names.

## The layer

- A Nuxt 4 layer, `ssr: false`, on Nuxt UI 4, Pinia, VueUse and `@nuxtjs/i18n`. Distributed by git `extends` from the release tag (D-001), never from a registry, so `nuxt/layer/package.json` has no `workspace:` dependency and the layer imports nothing outside `nuxt/layer`.
- Its public surface: the `$atrium` registry plugin (`auth()`, `widget()`, `extension()`, `settingsPanel()`), the `useAtrium*` composables, the `Atrium*` components and the `ScreenData` / `Shell` types. Anything else is internal.
- Its own strings come from locale files (`i18n/locales`, `en` shipped); server-side labels stay translated by Laravel.
- Icons come from collections bundled locally (`icon.serverBundle`, `lucide` by default); the remote Iconify API stays off unless a host opts in.
- Styling uses Nuxt UI components and the design tokens in `nuxt/layer/app/assets/css/atrium.css`. Themes (`Domains\Themes`) are sent in the shell as token values and applied on `:root`; never hard-code a colour a theme should own.

## Suite packages

- A suite package's Atrium UI is PHP definitions and JSON plugin routes, plus Vue components registered under its keys. It ships no stylesheet and no design tokens of its own: its components are built from Nuxt UI and the layer's `Atrium*` components and tokens.
- When a package needs a generic piece of UI, add an `Atrium*` component to the layer rather than styling it in the package.
- Atrium knows no suite package by name: no layer code, fixture or test refers to another package's keys.

## Enforcement

- `tests/ArchTest.php` fails if `src/` calls `view(`, references `Illuminate\View` or uses `Blade::`.
- PHP feature tests compare the API's payloads with the contract fixtures in `nuxt/layer/test/fixtures` (rewritten only with `UPDATE_FIXTURES=1`), and Vitest type-checks each fixture against the layer's types.
- `composer test:nuxt` runs the frozen install, typecheck, build, Vitest and a consumer build against a copy of the layer. Run it after any change under `nuxt/`.
