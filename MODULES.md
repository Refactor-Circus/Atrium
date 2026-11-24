# Atrium modules

A package's (or an app's) front end in Atrium is a **module**: Vue code built
with Atrium's Vite preset into one ES module and a stylesheet, committed to the
package, declared in its `composer.json`, and loaded by Atrium's page next to
Atrium's own prebuilt front end (decisions D-079 to D-088 in
`docs/agent/specs/2026-11-22-1823-atrium-v2-headless/decisions.md`). What
Atrium's PHP shows of the package (its nav items, widgets, settings panel,
search sources, screens, feature flags and the tabs it adds to other
packages' screens) is the module's **integration manifest**, a JSON file
shipped beside the build (§8, D-090): the package needs no Atrium PHP class.

This file is the contract, then how to write a module. The eight suite
packages (Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and
Showroom) each ship theirs and are the worked examples (D-089).

## The contract

### 1. The entry: `defineAtriumModule()`

```ts
// src/atrium.ts
import './atrium.css'
import { defineAtriumModule, mergeAtriumMessages } from '@refactor-circus/atrium'
import OpenCarts from './components/OpenCarts.vue'
import en from './locales/polycart.en.json'
import { routes } from './routes'
import { openCarts, searchCarts } from './live'

export default defineAtriumModule({
  key: 'polycart',                      // the integration's (or plugin's) key
  // integration: 'polycart',           // default: `key` when Atrium lists that integration; null never gates
  routes,                               // added with router.addRoute() before the first navigation
  screens: { 'polycart.carts': 'polycart-carts' },   // PHP screen key -> route name
  widgets: { 'polycart.open-carts': OpenCarts },     // keyed by the `component` the API sends
  extensions: {},                       // screen tabs and sections
  settingsPanels: {},                   // settings panels
  liveResolvers: { 'polycart.open-carts': openCarts },  // a nav item's live.key
  searchSources: { polycart: searchCarts },             // the shell's search source key
  responseHandlers: {},                 // see every response of every Atrium client
  messages: { en: mergeAtriumMessages(en) },
  setup({ app, router, atrium, boot }) {}   // anything else, run last
})
```

- Importing the entry registers the module; the page imports every module's
  script before Atrium's own entry, which then installs the modules and mounts.
- A module registers only while its integration is active for the user (the
  page leaves an inactive integration's script out altogether). One that throws
  is reported and skipped; the others still register.
- Routes keep Nuxt's names: `pages/runs/[run].vue` under `/polycart` is
  `{ path: '/polycart/runs/:run', name: 'polycart-runs-run' }`. A page anyone may
  open, signed in or not, has `meta: { atrium: { public: true } }`: the app
  renders it in the public layout and loads no shell.
- A classic script (no bundler) can call `window.Atrium.register({ key, … })`
  with the same shape.

### 2. The package: `extra.atrium` in composer.json

```json
{
    "extra": {
        "atrium": {
            "key": "polycart",
            "scripts": ["dist/atrium/atrium.js"],
            "styles": ["dist/atrium/atrium.css"],
            "integration": "dist/atrium/integration.json"
        }
    }
}
```

- `integration` is the shipped integration manifest (§8); it defaults to
  `dist/atrium/integration.json` when that file exists. Its `key` must be the
  module's.
- No Composer dependency on Atrium. Paths are relative to the package; Atrium
  serves every file in the folders they name (chunks beside the script), from
  `/vendor/atrium/{key}/{version}/…`.
- Atrium discovers it from `vendor/composer/installed.json`, cached by
  `php artisan atrium:discover` (which `package:discover` and `optimize` run).
- `key` defaults to the package name's second part (`refactor-circus/polycart`
  is `polycart`). A suite integration's key gates the module by the integration.
- `dist/atrium/` is committed: hosts never run Node.

An app loads a module folder of its own with `Atrium::module(base_path('atrium'))`,
or plain scripts with `Atrium::script('resources/js/atrium.ts')` (a Vite entry of
the app) or `Atrium::script('https://…')`, and `Atrium::style()`.

### 3. The shared modules (versioned API, `ATRIUM_SHARED_API` = `1.0`)

The page's import map gives every module Atrium's own copy of these, and the
preset leaves them out of the module's bundle:

| Specifier | Version |
| --- | --- |
| `vue` | 3.5.46 |
| `vue-router` | 5.5.1 |
| `pinia` | 3.0.4 |
| `vue-i18n` | 11.4.23 |
| `@vueuse/core` | 13.9.0 |
| `openapi-fetch` | 0.17.0 |
| `@refactor-circus/atrium` | the SDK (registry, composables, `Atrium*` components, types) |
| `@refactor-circus/atrium/ui` | Nuxt UI 4.1.0's components (`UButton` …) and composables (`useToast` …), compiled with Atrium's theme |

Removing a specifier, or a new major of one of the libraries, is a new major
of the list; a module built for another major is not loaded (its
`dist/atrium/build.json` says which it targets). Anything else a module needs it
bundles itself (Guardian bundles `uqr`). Never import `@nuxt/ui` directly at run
time: its components are only styled in Atrium's build.

### 4. The preset: `@refactor-circus/atrium/vite`

```ts
// vite.config.ts
import { atriumModule } from '@refactor-circus/atrium/vite'

export default atriumModule({ key: 'polycart', outDir: '../dist/atrium', test: { setupFiles: ['test/setup.ts'] } })
```

- `vite build` writes `atrium.js`, `chunks/`, `atrium.css`, `build.json` and,
  from `src/integration.json` (or `integration.json`, or the `integration`
  option), `integration.json`: the preset checks the manifest as Atrium does
  and fails the build on the first problem, with its JSON pointer. The source
  is in the build hash (`inputs` covers `src`, or the preset adds it).
- `vitest run` gets the test config from the same call: Nuxt UI compiled with
  Atrium's theme, the same auto-imports, happy-dom.
- Auto-imports: Vue, Vue Router, Pinia, `useI18n`, every SDK export
  (`useAtriumIntegration`, `useAtriumScreen`, `navigateTo`, `useHead`,
  `useAsyncData`, …) and Nuxt UI's composables. `<U*>` and `<Atrium*>`
  components resolve by themselves. The preset writes `auto-imports.d.ts` and
  `components.d.ts` (commit them; `vue-tsc` reads them).
- The SDK's own components import every `Atrium*` and `U*` component they
  render, and its type dependencies (`@types/sortablejs`) are its own
  `dependencies` (D-088): installed from GitHub (under
  `node_modules/.pnpm/…`), it needs no resolver override, no `exclude`
  workaround in `vite.config.ts` and no extra dev dependency. Delete any such
  workaround when you bump the SDK pin.
- Tests never reach the network: a `fetch` no mock answers (`mockPackageApi`,
  `registerEndpoint`, `mockAtriumApi`, a `vi.spyOn(globalThis, 'fetch')`)
  rejects at once with `No test mock answers GET …`, instead of trying
  happy-dom's `http://localhost:3000`.
- Styles: `src/atrium.css` is

  ```css
  @import "@refactor-circus/atrium/module.css";
  @source "./";
  ```

  which compiles only the utilities the module uses and Atrium does not
  already define, against Atrium's theme, into the `atrium-modules` layer.
  Ship no design tokens of your own; build on Nuxt UI and the `Atrium*`
  components.
- Components (D-093): besides Nuxt UI, the SDK gives every module
  `<AtriumPageHeader>` (`title`, `overline`, `description`, `links`, `back`
  for a back button, and the slots `title` (a status badge beside the
  title, still in the `<h1>`), `leading`, `headline`, `description`, `meta`
  and the default one for actions; a `data-testid` the page passes replaces
  `atrium-page-header`), `<AtriumDetails>` (a record's facts as a compact
  description list: `items: { key?, label, value?, mono?, href?, wide?, testid? }[]`,
  `columns` 1–3, `empty`, and a slot per item `key` replacing its value)
  and `<AtriumSelect>` (a `<USelect>` with a blank item: `blank="Any"` puts
  it first and keeps `''` in the model, or `null` with `:blank-value="null"`;
  `<USelect>` refuses an item whose value is `''`, so no `NONE` stand-ins).
  Nuxt UI's types (`TableColumn`, `SelectItem`, `FormSubmitEvent`,
  `ButtonProps`, ...) come type-only from `@refactor-circus/atrium/ui`, never
  from `@nuxt/ui`. `<UTable>` takes the deck's look from Atrium's theme
  (mono caps headings, 34px rows, a lit hovered row): add no classes for it.

### 5. The SDK at development time

Modules depend on the SDK as a **development** dependency only (the page
provides it at run time):

```json
"devDependencies": {
  "@refactor-circus/atrium": "github:refactor-circus/atrium#v2.0.0&path:ui/sdk"
}
```

Pin a tag or a commit SHA. Against a local checkout, use
`"link:../../Atrium/ui/sdk"` (or `pnpm link`), and switch back before
committing. Add the shared modules' exact versions above as dev dependencies
too (`vue`, `vue-router`, `pinia`, `vue-i18n`, `@vueuse/core`, `openapi-fetch`,
`@nuxt/ui`, `@unhead/vue`), with `vite`, `vitest`, `vue-tsc`, `typescript`,
`@types/node`, `@vue/test-utils` and `happy-dom` (see any suite package's
`atrium/package.json`). Nothing else: the SDK brings what its own
sources need (`sortablejs` and its types, the Vite and Tailwind plugins).
Atrium's `composer test:ui` installs the packed SDK into a module exactly so
(`ui/scripts/check-consumer.mjs`) and builds, type-checks and tests it.

### 6. Clients

Keep your package's own generated client (`client/`, `createXClient(options)`).
Atrium supplies the base URL and the signing `fetch` (session cookie and XSRF
token by default, or the app's auth adapter):

```ts
const client = createPolycartClient(atriumClientOptions('polycart')!)
// or, cached per key:
const { active, client } = useAtriumIntegration('polycart', createPolycartClient)
```

Or type the plain `useAtriumIntegration('polycart')` client once, in
`src/env.d.ts`:

```ts
import type { paths } from '../client/src/schema'

declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths { polycart: paths }
}
```

which also types `useIntegrationQuery('polycart', …)` and the test helper
`mockPackageApi('polycart', …)`.

A module that imports the package's client entry (`../../client/src/index.ts`,
for `createXClient`) type-checks that file too, and its `import createClient
from 'openapi-fetch'` resolves from `client/`, where nothing is installed in
the module's CI. Point the specifier at the module's own copy in
`atrium/tsconfig.json` (the version is the shared one, so it is the same
code at run time):

```json
"compilerOptions": {
  "paths": { "openapi-fetch": ["./node_modules/openapi-fetch"] }
}
```

Importing only the generated `schema.d.ts` types (`import type { paths }`)
needs no such entry.

### 7. Tests

`@refactor-circus/atrium/testing` gives every suite the app a page has:
`mountSuspended(component, { route, props })`, `withSetup()`, `settle()`,
`inApp()`, `shell()`, `mockAtriumApi(fn)` (Atrium's own API),
`mockPackageApi(key, routes)` / `mountIntegration()` / `resetPackageApis()` (a
package's API), `mockNavigateTo(fn)`, `registerEndpoint(path, handler)`,
`setAtriumBoot()`, `runInAtrium()`, `useRouter()`, `useTestModule(definition)`
and `missingI18nKeys('polycart')`. `test/setup.ts` is:

```ts
import { useTestModule } from '@refactor-circus/atrium/testing'
import Polycart from '../src/atrium'

useTestModule(Polycart)
```

`expectIntegrationManifest(path?, key?)` reads the manifest (by default
`src/integration.json`) and checks it as Atrium does, throwing with the JSON
pointer of the first problem; `validateIntegrationManifest(json)` returns
`{ valid, errors: [{ pointer, message }] }`:

```ts
// test/integration.test.ts
import { expectIntegrationManifest } from '@refactor-circus/atrium/testing'

it('declares a valid integration', () => {
  const manifest = expectIntegrationManifest('src/integration.json', 'polycart')

  expect(manifest.screens?.map(screen => screen.key)).toEqual(['polycart.carts', 'polycart.cart', 'polycart.types'])
})
```

Atrium's integration fixtures (the shell payload of the suite's manifests)
are `@refactor-circus/atrium/fixtures/integrations/{pkg}.json`.

**Driving Nuxt UI** (D-093). A module's fields are Nuxt UI, not native
elements: a `<USelect>` is a Reka listbox rendered in a portal only while
open, `<UCheckbox>` / `<USwitch>` are `role="checkbox"` / `role="switch"`
buttons, `<UInputNumber>` commits on blur, and a `<UTable>` row takes no
attributes. The testing entry drives them by `data-testid`; use these
instead of local helpers:

| Helper | What it does |
| --- | --- |
| `tableRows(root, testid?)` | the `<UTable>`'s data rows (not its empty row), as `DOMWrapper<HTMLTableRowElement>[]` |
| `tableRow(root, testid)` / `hasTableRow(root, testid)` | the row holding the element marked `testid` (a wrapper whose `exists()` is false when none does) |
| `tableHeaders(root, testid?)` | the column headings' text |
| `tableCell(row, column)` / `tableCellText(row, column)` | a row's cell by heading (case-insensitive) or index |
| `tableColumn(root, testid, column)` | every row's text in a column |
| `findSelect(wrapper, testid)` | the `<AtriumSelect>`, `<USelect>` or `<USelectMenu>` marked `testid` |
| `selectItems()` / `selectValues()` / `selectLabels()` / `selectValue()` | what it offers (`{ value, label }`, groups flattened, separators left out) and holds |
| `chooseOption(wrapper, testid, value)` | sets it through `v-model` (`update:modelValue`), failing on a value it does not offer: the quick way |
| `pickOption(wrapper, testid, label)` / `openSelectLabels(wrapper, testid)` | opens the portal listbox and clicks the option labelled `label` (or reads the labels): the end-to-end way; mount with `attachTo: document.body` |
| `isChecked(root, testid)` / `toggle()` / `setChecked(root, testid, on)` | a `<UCheckbox>` or `<USwitch>`, clicked as a person does |
| `findInput(root, testid)` / `setNumber(root, testid, n)` | the `<input>` Nuxt UI wraps; types a number into a `<UInputNumber>` and commits it |
| `findField()` / `hasField()` / `fieldValue()` / `isDisabled()` / `setField(wrapper, testid, value)` | any Nuxt UI field by the `data-testid` it was given, set through `v-model` |
| `rawHtmlIn(dir, allow?)` / `rawHtmlElements(source)` | the Nuxt UI guard below |

**The `<UTable>` row convention.** `UTable` (4.1) sets no attribute on a
`<tr>`, so a page puts the row's test id on its **first cell's content**,
and tests find the row from it:

```vue
<UTable :data="runs" :columns="columns" data-testid="impex-runs">
  <template #flow-cell="{ row }">
    <ULink :to="runPath(row.original.id)" :data-testid="`impex-run-row-${row.original.id}`">{{ row.original.flow }}</ULink>
  </template>
</UTable>
```

```ts
const row = tableRow(wrapper, 'impex-run-row-run-1')
expect(tableCellText(row, 'Status')).toBe('running')
expect(tableRows(wrapper, 'impex-runs')).toHaveLength(2)
await chooseOption(wrapper, 'impex-runs-status', 'failed')
```

**The Nuxt UI guard.** Every module composes Nuxt UI, as Atrium's own
components do (D-091): no page or component renders a raw `<button>`,
`<input>`, `<select>`, `<textarea>`, `<table>`, `<details>` or `<a href>`
(use `<UButton>`, `<UInput>` / `<USelect>` / `<AtriumSelect>` / `<UTextarea>`,
`<UTable>`, `<UCollapsible>`, `<UButton to>` / `<ULink>`, or `<AtriumLink>`
for an API link that may be external). Atrium no longer styles raw tables,
native selects, `.atrium-querybar` or `.atrium-empty` (D-093). Copy this
test:

```ts
// test/nuxt-ui-guard.test.ts
import { rawHtmlIn } from '@refactor-circus/atrium/testing'

it('composes Nuxt UI, with no raw HTML controls (D-091)', () => {
  expect(rawHtmlIn('src')).toEqual([])
})
```

`rawHtmlIn(dir, { 'components/Download.vue': ['<a href>'] })` lets a file
keep a named element; each finding is `{ file, elements }`.

### 8. The integration manifest: `src/integration.json`

The JSON Schema is `@refactor-circus/atrium/schema/integration.schema.json`
(`ui/sdk/schema/integration.schema.json`); point `$schema` at it for your
editor. Polycart's, shortened:

```json
{
  "$schema": "../node_modules/@refactor-circus/atrium/schema/integration.schema.json",
  "version": 1,
  "key": "polycart",
  "label": "Polycart",
  "features": ["polycart.atrium"],
  "navigation": [
    { "label": "Carts", "path": "/polycart/carts", "icon": "i-lucide-shopping-cart", "group": "Polycart", "sort": 30 },
    { "label": "Cart types", "path": "/polycart/types", "icon": "i-lucide-layers", "group": "Polycart", "sort": 31 }
  ],
  "widgets": [
    { "key": "polycart.carts-by-type", "label": "Carts by type", "description": "…", "icon": "i-lucide-chart-column", "size": { "width": 6, "height": 2 } }
  ],
  "search_sources": [{ "key": "polycart", "label": "Carts", "icon": "i-lucide-shopping-cart" }],
  "screens": [
    { "key": "polycart.carts", "kind": "list", "path": "/polycart/carts" },
    { "key": "polycart.cart", "kind": "detail", "path": "/polycart/carts/:cart" }
  ]
}
```

| Field | What it is |
| --- | --- |
| `version` | `1` |
| `key`, `label` | The package key (the module's) and its name in the shell |
| `features` | Pennant flag names that must all be on (`{pkg}.atrium` by convention). Atrium defines each as on until the host defines it; without Pennant all are on. `atrium.integrations.{pkg}.features` replaces the list |
| `navigation` | Items: `label`, `path` (under `/{pkg}/`, never a URL), `icon`, `group`, `sort`, `live` (`{key, options}`, the module's `liveResolvers` key), `children`, `when` (declared only while true) |
| `widgets` | `key` (`{pkg}.…`), `label`, `description`, `icon`, `component` (default `key`), `size` and `min_size` (`{width, height}`), `lazy` |
| `settings` | One panel: `key`, `label`, `description`, `icon`, `component`, `sort` |
| `search_sources` | `key` (the module's `searchSources` key), `label`, `icon` |
| `screens` | `key` (`{pkg}.…`), `kind` (`list` or `detail`), `path` (under `/{pkg}/`, `:param`s), `subject_type` (the record's morph alias, or the suite's name for it when the morph type depends on the host), `subject_model` (then the model it is stored as: a class, alias or `$config`; Atrium sends hooks its morph type), `options` (static data the page reads) |
| `hooks` | Tabs and sections this package adds to other packages' screens (below) |

Labels are plain English: Atrium passes them through Laravel's `__()`, so a
host translates `"Carts"` in `lang/de.json`. Icons are Iconify names.

**Values read from config.** Where a value comes from config (screen
`options`, a nav item's `sort`, `when` or `live.options`, hook `data`), write
an expression; Atrium reads it when the integration registers:

```json
{ "$config": "atrium.integrations.showroom.transfers.flow_prefix", "type": "string", "default": "showroom:" }
```

`$config` reads only your own config (`{pkg}.*`) or your integration's
(`atrium.integrations.{pkg}.*`); missing or null is `default`. `type` casts:
`string`, `bool`, `int`, `positive-int` (`nullable`: an explicit null stays
null), `enum` (`values`), `strings` (`single`, `unique`, `non_empty`),
`string-map`, `path` (`/` plus the trimmed string), `map` (string keys to
non-empty strings, a null value read from `fallback.{key}`; `entries:
["key", "type"]` makes it a list of pairs). Guardian's manifest uses most of
them.

**Hooks.** A package that renders something on another package's screens
declares it, as the package whose API the component calls:

```json
{
  "config": "redirect_domains.screens",
  "format": "map",
  "default": { "roster.organization": "tab", "roster.user": "aside" },
  "screens": { "kind": "detail", "subject": true },
  "tabs": { "cortex.mcp": { "label": "MCP", "icon": "i-lucide-globe", "data": { "owner_type": { "$screen": "subject_type" } } } },
  "sections": { "cortex.redirect-domains": { "label": "Redirect domains", "data": { "owner_type": { "$screen": "subject_type" } } } }
}
```

- `$screen` `subject_type` is the morph type the host stores the screen's
  record as: the screen's `subject_model` resolved through the host's morph
  map (Roster's user is `roster.users.model`, so `App\Models\User` or its
  alias), else its `subject_type`. The record the component gets is the
  screen's route parameter, the model's route key (an organization's slug,
  a user's id), so an API a hook calls accepts the route key (D-092).
- `default` places the hook; a host replaces it with
  `atrium.integrations.{pkg}.{config}`. Targets are `*`, `{package}.*` or a
  screen key.
- `format`: `map` (target to `tab` or a slot, for one tab and/or one
  section), `lists` (target to a list where a string is a tab key and
  `{"slot": "key"}` a section; Guardian's), `targets` (`screens`, `slot`,
  `exclude`, for one section; Keen's history) or `options` (target to
  options for one tab, read with `{"$option": "scope", "type": "bool",
  "default": true}`; Keen's activity).
- `screens` keeps only matched screens of a `kind`, with a `subject_type`
  (`subject`), or of other packages (`others`).
- `data` may use `{"$screen": "subject_type" | "package" | "key"}` (with
  `kinds` to leave it out elsewhere) and `{"$subject_scope": <a map
  $config>, "self": "user"}` (the record's scope type; the tab is skipped,
  with a warning, where it does not resolve). The component registered under
  the tab or section key (the module's `extensions`) adds the record from
  `?record=`.

The eight suite manifests are in each package's `atrium/src/integration.json`
(and Atrium's `tests/Fixtures/Manifests/`): Cortex and Impex for `map` hooks,
Keen for `targets` and `options` and a `when` nav item, Guardian for `lists`,
`$subject_scope` and config-derived options, Showroom for a `$config` option.

## Writing a module

Every suite package keeps its module in `atrium/` and commits the build in
`dist/atrium/`; read one beside these steps:

| Package | Worth reading for |
| --- | --- |
| Polycart | a compact one: pages, two widgets, a search source |
| Cortex | a cross-package hook (redirect domains on Roster's screens) |
| Guardian | `responseHandlers` (the two-factor challenge), shell-less pages, a bundled dependency (`uqr`) |
| Impex | runs and flows, the run-link hook on Showroom's transfers |
| Keen | the history and activity hooks on other packages' screens |
| PennantPlus | one page over the package's feature-flag API |
| Roster | a public page (`/roster/invitations/:token`) |
| Showroom | the largest (27 screens); a copy of Impex's schema types (`atrium/types/impex-schema.d.ts`) for its transfers page |

For package `{Pkg}` (key `{pkg}`):

1. **The folder.** `atrium/` holds `package.json`, `vite.config.ts`,
   `tsconfig.json`, `src/` (`atrium.ts`, `atrium.css`, `routes.ts`,
   `env.d.ts`, `pages/`, `components/`, `locales/`), `test/` (with
   `test/setup.ts`, §7) and the preset's generated `auto-imports.d.ts` and
   `components.d.ts` (committed).
2. **`package.json`.** `"name": "@refactor-circus/{pkg}-atrium"`, `"private":
   true`, `"type": "module"`, `"packageManager": "pnpm@10.18.0"`, the scripts
   `"build": "vite build"`, `"typecheck": "vue-tsc --noEmit -p tsconfig.json"`
   and `"test": "vitest run"`, and the dev dependencies of §5 with the SDK
   pinned at a tag or a commit SHA. Run `pnpm install` and commit
   `pnpm-lock.yaml`.
3. **`tsconfig.json`.** Standalone (`strict`, `moduleResolution: "Bundler"`,
   `types: ["vite/client", "node"]`, `jsx: "preserve"`), including `src`,
   `test`, the two generated `.d.ts` files and `vite.config.ts`; add the
   `openapi-fetch` path from §6 if a source imports the client's `index.ts`.
4. **`vite.config.ts`.** One call:

   ```ts
   export default atriumModule({
     key: '{pkg}',
     outDir: '../dist/atrium',
     inputs: ['src', '../client/src', 'package.json', 'vite.config.ts', 'pnpm-lock.yaml'],
     test: { setupFiles: ['test/setup.ts'] }
   })
   ```

   `../client/src` in `inputs` makes the committed build stale when the client
   is regenerated; the lockfile pins the SDK. Nothing else goes in the config:
   no Nuxt UI plugin override and no `exclude` for the SDK (D-088).
5. **The client.** Type `useAtriumIntegration('{pkg}')` with the package's own
   generated client (`../client/src/schema`) in `src/env.d.ts`, or pass its
   factory (§6). A module never imports another package's client or module:
   call another package's API untyped, or keep a copy of the types you need.
6. **The integration manifest.** Write `src/integration.json` (§8): what
   Atrium shows of the package, the hooks your module's extensions render
   on other packages' screens, and `$config` for anything the host
   configures. Add `test/integration.test.ts` with
   `expectIntegrationManifest('src/integration.json', '{pkg}')` (§7) and
   assert what matters (every screen key has a route in `src/atrium.ts`'s
   `screens` map, every hook tab or section key is in `extensions`).
7. **`composer.json`.** Add the `extra.atrium` block (§2), with
   `"integration": "dist/atrium/integration.json"`. `.gitattributes` must not
   export-ignore `dist/` (it ships) and should export-ignore `/atrium`.
8. **Build and check.** In `atrium/`: `pnpm typecheck`, `pnpm test`,
   `pnpm build` (which checks the manifest and writes
   `dist/atrium/integration.json`); commit `dist/atrium/` with its
   `build.json`. Add a CI job that runs the three and fails on
   `git diff -- dist/atrium`.
9. **Try it.** In a host: `composer require` the package (or a path
   repository), `php artisan atrium:discover`, open `/atrium`; the module's
   script is on the page once the integration is active. In Atrium's
   workbench: `ATRIUM_SUITE_PATH=/path/to/checkouts composer serve`, with the
   package checked out there as `{Pkg}`; the workbench loads every sibling's
   built module and integration manifest from its `extra.atrium` and stands
   in for its API from its `openapi.json`.
10. **Record it.** A line in the package's CHANGELOG ("ships its Atrium
   module and integration manifest").

Atrium has no PHP of any package (D-090): what it shows of yours is your
manifest. The shell payloads the suite's manifests produce are the fixtures
`@refactor-circus/atrium/fixtures/integrations/{pkg}.json`.

### Gotchas

- A module never imports from another module. Use the other package's API
  through `useAtriumIntegration('{other}')` (untyped unless you add its paths).
- `<AtriumIntegrationScreen>` renders its slot while `atrium.screens.show` is
  loading: a child keyed or seeded from the screen's options mounts twice
  unless you wait for the request (Guardian's security page does).
- A page that must work signed out (`meta.atrium.public`) builds its own
  client and never calls `atrium.screens.show`; on such a page a 401 does not
  reload the page.
- Nuxt UI's `<ULink>` renders no `rel`; use `<AtriumLink>` for an external link
  that needs one.
