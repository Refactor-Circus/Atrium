# Atrium modules

A package's (or an app's) front end in Atrium is a **module**: Vue code built
with Atrium's Vite preset into one ES module and a stylesheet, committed to the
package, declared in its `composer.json`, and loaded by Atrium's page next to
Atrium's own prebuilt front end (decisions D-079 to D-087 in
`docs/agent/specs/2026-11-22-1823-atrium-v2-headless/decisions.md`).

This file is the contract, then the step-by-step move of a staged suite module
(`ui/modules/{pkg}` in this repository) into its own package (phase 2).

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
`@vue/test-utils` and `happy-dom` (see any `ui/modules/*/package.json`).

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

## Phase 2: moving a staged module into its package

Each `ui/modules/{pkg}` is laid out as the package's `atrium/` folder will be,
and already builds, type-checks and passes its suite against the contract
above. For package `{Pkg}` (key `{pkg}`):

1. **Copy the folder.** In the package's repository (a worktree beside it), copy
   Atrium's `ui/modules/{pkg}/` to `atrium/`: `package.json`, `vite.config.ts`,
   `tsconfig.json`, `src/`, `test/`, `auto-imports.d.ts`, `components.d.ts`.
   Do not copy `node_modules`, `dist`, the stand-in `composer.json` or `client/`.
2. **Use the package's own client.** Replace the vendored `client/` imports
   (`'../client/schema'`, `'../../client/schema'`) with the package's generated
   client (`'../../client/src/schema'`, or its `index.ts`), and point
   `src/env.d.ts` at it. Showroom keeps a copy of Impex's schema for its
   transfers page until it can depend on Impex's client (keep `client/impex/`
   as `atrium/types/impex-schema.d.ts`).
3. **`package.json`.** Rename to `@refactor-circus/{pkg}-atrium` (private),
   replace `"@refactor-circus/atrium": "workspace:*"` with
   `"github:refactor-circus/atrium#<tag or SHA>&path:ui/sdk"`, keep the other
   pins, add `"packageManager": "pnpm@10.18.0"`, run `pnpm install`, commit
   `pnpm-lock.yaml`.
4. **`tsconfig.json`.** Inline Atrium's `ui/tsconfig.base.json` options (the
   module no longer sits under `ui/`).
5. **`vite.config.ts`.** `atriumModule({ key: '{pkg}', outDir: '../dist/atrium',
   inputs: ['src', 'package.json', 'vite.config.ts', 'pnpm-lock.yaml'], test: {
   setupFiles: ['test/setup.ts'] } })` (drop Atrium's `../../sdk/…` inputs; the
   lockfile pins the SDK).
6. **`composer.json`.** Add the `extra.atrium` block from the staged
   `composer.json` (`key`, `scripts: ["dist/atrium/atrium.js"]`, `styles:
   ["dist/atrium/atrium.css"]`). Make sure `.gitattributes` does not
   export-ignore `dist/` (it ships) and does export-ignore `atrium/`.
7. **Build and check.** In `atrium/`: `pnpm typecheck`, `pnpm test`,
   `pnpm build`; commit `dist/atrium/` (with its `build.json`). Add a CI job
   that runs the three and fails on `git diff -- dist/atrium`.
8. **Try it in a host.** `composer require` the package (or a path repository),
   `php artisan atrium:discover`, open `/atrium`: the module's script is on the
   page once the integration is active.
9. **Remove the staged copy from Atrium** (one PR per package or one at the
   end): delete `ui/modules/{pkg}`, its `Atrium::module()` line in
   `workbench/app/Atrium/DemoSuite.php` (the workbench then needs the package
   installed, or keeps the stand-in), its entry in `ui/scripts/sync-clients.mjs`
   and `VendoredClientsTest`, and run `pnpm -C ui install`.
10. **Record it.** A line in the package's CHANGELOG ("ships its Atrium
    module"), and tick the package in Atrium's tasks (group 46).

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
