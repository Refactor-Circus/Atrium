# Atrium modules

A package's (or an app's) front end in Atrium is a **module**: Vue code built
with Atrium's Vite preset into one ES module and a stylesheet, committed to the
package, declared in its `composer.json`, and loaded by Atrium's page next to
Atrium's own prebuilt front end (decisions D-079 to D-088 in
`docs/agent/specs/2026-11-22-1823-atrium-v2-headless/decisions.md`).

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
            "styles": ["dist/atrium/atrium.css"]
        }
    }
}
```

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

- `vite build` writes `atrium.js`, `chunks/`, `atrium.css` and `build.json`.
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

Atrium's integration fixtures (the shell payload of its PHP declarations) are
`@refactor-circus/atrium/fixtures/integrations/{pkg}.json`.

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
6. **`composer.json`.** Add the `extra.atrium` block (§2). `.gitattributes`
   must not export-ignore `dist/` (it ships) and should export-ignore
   `/atrium`.
7. **Build and check.** In `atrium/`: `pnpm typecheck`, `pnpm test`,
   `pnpm build`; commit `dist/atrium/` with its `build.json`. Add a CI job
   that runs the three and fails on `git diff -- dist/atrium`.
8. **Try it.** In a host: `composer require` the package (or a path
   repository), `php artisan atrium:discover`, open `/atrium`; the module's
   script is on the page once the integration is active. In Atrium's
   workbench: `ATRIUM_SUITE_PATH=/path/to/checkouts composer serve`, with the
   package checked out there as `{Pkg}`; the workbench loads every sibling's
   built module from its `extra.atrium` and stands in for its API from its
   `openapi.json`.
9. **Record it.** A line in the package's CHANGELOG ("ships its Atrium
   module").

The PHP side of a suite integration (its nav items, widgets, screens and
settings panel as data) stays in Atrium's `src/Integrations/{Pkg}`, and the
shell payloads it produces are the fixtures
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
