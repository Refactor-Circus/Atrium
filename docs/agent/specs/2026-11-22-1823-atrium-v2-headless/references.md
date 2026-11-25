# References

## spike/v2-headless (this repo, commit 2607d9a, worktree ../Atrium--v2-headless)
- **API controllers:**
  - Relevance: the route set and payload shapes, proven by `tests/Feature/Api/HeadlessApiTest.php` (22 tests).
  - Files:
    - `src/Domains/{Navigation,Dashboard,Widgets,Search,Settings}/Http/Controllers/Api/*`
    - `src/Domains/*/api.php`
  - Borrow: `ShellController` (one boot call: user, nav, themes, settings, search config), the slug-or-default dashboard read, and lazy widget data.
  - Fix: id binding and route files, per shape.md Decisions.
- **Resources:**
  - Files: `Dashboard/Http/Resources/{Dashboard,WidgetPlacement}Resource`, `Widgets/Http/Resources/WidgetDefinitionResource`, `Screens/Http/Resources/ResolvedScreenResource`.
  - Borrow: the `{key, component, data}` shape, and open-tab-only data for registered tabs.
  - Fix: placement, `final`/`@mixin`, slug.
- **`src/Support/ClientPath.php`:** maps server URLs to front-end paths for nav and search links. Keep it, or drop it if nav items become client routes. Write-spec decides.
- **`src/Support/JsonData.php` + `src/Exceptions/UnserializableDataException.php`:** the resolver-data guard. Keep its semantics; move the exception into the hierarchy.
- **`workbench/app/Http/Middleware/AuthenticateWorkbenchToken.php`:** a stand-in guard showing how a host plugs auth into `atrium.routes.middleware`.
- **Nuxt layer:**
  - Files: `nuxt/layer/app/**`
    - `plugins/atrium.ts`: `AtriumRegistry` with auth adapter and widget/extension/panel maps
    - `composables/useAtriumApi.ts`: `$fetch` with adapter headers and the 401 hook
    - `stores/atriumShell.ts`
    - `components/Atrium/{DashboardGrid,Widget,Screen,Search,Navigation,…}.vue`
  - Borrow: the whole layer as the starting point.
  - Gaps: no Vitest component tests yet, and theme tokens are only lightly mapped onto Nuxt UI `--ui-*`.
- **`nuxt/playground`:** the workbench demo as Vue widgets, plus the auth plugin example.

## ~/Herd/spike-seclock-v2/frontend (sibling app)
- **Relevance:** the stack this follows.
- **Borrow:**
  - `nuxt.config.ts`: `ssr:false` as the global standard, module set, pinned versions
  - `app/composables/useApi.ts`: the typed client pattern
  - `useAuth.ts`: a Passport token in a first-party cookie with keepalive refresh. This is an example host auth adapter, not something Atrium ships.

## Keystone
- **`vendor/refactor-circus/keystone/src/Support/ServiceProvider.php::loadApiRoutesFrom()`:** the API route group that `http/routes` names as the reference. Use it directly.
- **`Keystone\Http\Resources\JsonResource`:** the resource base required by `http/resources`.

## Polycart (sibling)
- **`config/polycart.php` `routes` block:** the existing JSON API config banner to match (enabled/prefix/middleware and the auth-middleware note).
