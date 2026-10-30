# Screen extensions registry

## Goal

Any package can add tabs and sections to any screen that declares itself with `Screen`, by registering them from its own `boot()` for one exact screen (`{package}.{screen}`), for every screen of a package (`{package}.*`) or for every screen (`*`). A screen declares only generic facts (key, package, record, kind, tabs and slots) and stops checking whether other packages are installed. Atrium knows nothing about any other suite package and has no audit concept: the history screen, its components and its nav item leave Atrium for Keen. Every Atrium page with a controller view declares itself with the standard slots and a tab bar, and tabs and sections render the same way in every Atrium theme and layout.

## Acceptance criteria

### Registry and definitions

1. `RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions` is bound as a singleton and reachable as `Atrium::screens()`; a test asserts both return the same instance. It has `tab(string $target, TabDefinition)` and `section(string $target, string $slot, SectionDefinition)`, each returning the registry for chaining. `$target` is an exact screen key, `*` or `{package}.*`. A registration for a key no installed package declares is stored and never renders, with no error: a unit test registers for `missing.screen` and asserts nothing throws and a declared screen is unaffected.
2. `TabDefinition::make($key)` and `SectionDefinition::make($key)` live in `Domains\Screens\Data`.
   - **Setters:** `label()`, `icon()` (tabs only), `view()` / `component()` (setting one clears the other), `resolve(Closure)`, `permission(string)`, `authorize(Closure)` and `public()`.
   - **Closure signatures (D-025):** `authorize(fn (Request $request, ?Model $record, Screen $screen): bool)` and `resolve(fn (?Model $record, Screen $screen): array)`. `Screen` is always the trailing argument; `$record` is the screen's record, or the row inside a row slot.
   - **State:** `key`, `label`, `icon`, `view`, `component`, `permission` and `public` are `public private(set)`. `label` defaults to the key, a tab's `icon` to `squares-2x2`, `public` to `false`. The resolver and `authorize` closures are private; reading either from outside throws `Error`.

   Unit tests cover view/component exclusivity, that writing any property throws `Error`, and that both closures receive the `Screen` as their last argument.
3. **Validation.** Each case below throws `InvalidArgumentException`, and a test covers each:
   - an extension key or slot name not matching `^[a-z0-9][a-z0-9._-]*$` (accepted: `acme.billing`, `header.actions`; rejected: uppercase, a space, a slash, empty)
   - a definition with neither a view nor a component
   - a target that is not an exact key `^[a-z0-9-]+\.[a-z0-9.-]+$`, `*` or `^[a-z0-9-]+\.\*$` (D-026). Accepted: `test.screen`, `*`, `test.*`. Rejected: `*.x`, `te*.x`, `test.a*`, `test.*.x`, `**`, `test.**`, empty. `Screen::make()` accepts the exact form only.

   The registry stores a clone: a test mutates the caller's instance after registering and asserts the stored copy is unchanged. Keys are read back as strings: a test registers `123` and `007` and asserts `?tab=007` reaches the view as `'007'`.
4. **Duplicates.**
   - **Same key on the same target string (D-022, D-026):** in the `local` and `testing` environments, registration throws `InvalidArgumentException` naming the key and the target. In any other environment it reports the exception once through `report()`, skips the later registration and keeps the first. Tests cover both environments for tabs and sections (same target and slot).
   - **Same key across targets on one screen (D-023, D-028):** the more specific target wins. The order is the exact key, then `{package}.*`, then `*`. Each less specific duplicate is skipped and reported once per request. Tested for tabs and sections in all three pairings (exact vs `pkg.*`, exact vs `*`, `pkg.*` vs `*`), with a page rendering the slot twice still reporting once.
5. **Test reset (D-010, D-011, D-027).**
   - `ScreenExtensions::snapshot(): array` returns the current registrations and `restore(array $snapshot)` replaces them with a snapshot.
   - The published Pest trait `RefactorCircus\Atrium\Testing\ResetsScreenExtensions` (beside `Testing\AtriumStyles`) takes one snapshot after the application boots and restores it after each test. Atrium's own `TestCase` uses it.
   - `flush()` forgets everything and is for the registry's own unit tests; nothing can be unregistered at runtime.
   - Tests: a tab registered from a provider's `boot()` is present in the second of two consecutive tests; a tab registered inside the first test is gone in the second; `restore(snapshot())` round-trips; `flush()` empties both listings.

### Screen declarations

6. A host builds `Screen::make(string $key)` (`Domains\Screens\Data\Screen`) with `record(?Model)`, `kind('detail'|'list')`, `tabs(array $builtIn)` (key, label and icon per entry, in order), `defaultTab(string)`, `slots(string ...)`, `rowSlots(string ...)` and `access(Closure(string $permission, Request, ?Model $record): bool)`.
   - **Exposed state:** `key`, `package` (the key's first segment), `record`, `kind`, `tabs`, `slots` and `rowSlots`, all `public private(set)`.
   - **Standard slots (D-013):** `Screen::standard(string $key, string $kind)` returns a screen with `header.actions`, `before` and `after`; a `detail` screen also gets `aside`, a `list` screen also gets the row slot `row.actions`. Hosts may add slots afterwards. A unit test asserts both lists.
   - **Overview tab:** a screen with no built-in tabs gets one built-in tab, `overview`, holding the page, which is the default tab. Registered tabs are never the default.

   Tests cover `package` derivation, both `standard()` kinds and the synthetic `overview` tab.
7. The host passes the screen to `ScreenExtensions::resolve(Screen, Request): ResolvedScreen`, which exposes `screen`, `tabs` (visible tabs: built-ins as given, then exact registrations, then wildcard registrations, each in registration order), `openTab` (string), `openRegisteredTab` (`?TabDefinition`), `sections(string $slot)`, `rowSections(string $slot, Model $row)` and `data(TabDefinition|SectionDefinition, ?Model $row = null): array` (computed on first call, memoized for the request).
   - **Reserved keys:** a registered tab (exact or wildcard) whose key is one of the screen's built-in keys, `overview` included, is skipped and reported once per request with an `InvalidArgumentException` naming the key and screen. Tested for an exact and a `*` registration.
   - **Open tab:** `?tab=` is read only as a string (`?tab[]=x` counts as absent). An absent or unknown key opens `defaultTab`, or the first built-in, with a 200. A visible registered key opens that tab. A registered key the viewer can't see answers 403; that 403-versus-200 difference reveals which keys exist, which is accepted and documented. A feature test covers each case.
8. **Visibility.** A tab or section is visible only when its `permission()` passes the screen's `access` closure, its `authorize` closure returns `true`, both pass when it has both, or, with neither, after `public()`. A screen without `access` hides every `permission()` extension.
   - A throwing `authorize` counts as a denial and is reported once per request per screen and key.
   - Answers and `data()` are memoized in `ScreenVisibility` (bound `scoped()`), keyed by screen, slot, extension key and record identity: morph class plus key, or the model itself held strongly when its key is null (never a bare `spl_object_id`). Nothing is cached on the registry or the definitions.
   - Tests, for tabs and sections: permission only, closure only, `public()`, neither (hidden), both passing, one failing, a throwing closure (reported once, called once, page 200). Memo tests: two rows with the same id in two model classes get separate answers and data; a freed unsaved row and a new one each run `authorize` and the resolver; two requests with `forgetScopedInstances()` between them and different viewers evaluate afresh.
9. **Order of evaluation.**
   - Hosts call `resolve()` only after their own authorization; a test host denied with 403 runs no `authorize` closure or resolver (both counted).
   - Resolvers run only through `data()`: for the open registered tab and for each section actually rendered. A counting resolver on a hidden tab, an unopened tab, a hidden section and a section in an unrendered slot is never called.
   - Component path: resolver data arrives as one `data` prop. View path: resolver data is spread first and the host's `screen`, `record` and `tab` over it, so the host wins (tested by a resolver returning those three keys).

### Row slots, wildcards and failures

10. **Row slots (D-006).** `<x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$row" />` renders once per row; `authorize` and the resolver receive the row as `$record`, memoized per row identity (criterion 8). A feature test renders three rows with a section admitting only the second and asserts: the markup appears once, in that row; `authorize` ran three times and the resolver once; re-rendering the rows in the same request makes no further calls. A row slot rendered without `:row`, or a normal slot rendered with `:row`, throws `InvalidArgumentException`. A section on a slot the screen didn't declare is never rendered and its closures never run. All tested.
11. **Wildcards (D-017, D-026).** A `*` registration applies to every declared screen (tabs) or every screen declaring the slot (sections); a `{package}.*` registration only to screens whose `package` matches. Wildcard extensions are default-deny like any other. Tests: a `*` section renders on two test-host screens and receives each one's `Screen`; a `test.*` section renders on `test.a` and not on `other.screen`; a `*` tab opens through `?tab=`; a wildcard section on an undeclared slot never runs its closures; a wildcard `authorize` that returns early on `$screen->key` makes no resolver call elsewhere.
12. **Failure isolation (D-015).** Each section and row section renders into a buffer. If its resolver or view throws any `Throwable` (including `HttpException`), the buffer is discarded, the failure is reported once per request per screen and key, the section renders nothing and the page still returns 200. Isolation is active in tests too. A throwing open registered tab panel propagates to the exception handler (500). Tests: a view that emits markup then throws leaves none in the response; a section failing in three rows is reported once; a throwing panel gives 500.

### Rendering

13. `x-atrium::screen-tabs :screen="$resolved"` renders a `<nav>` of `x-atrium::icon-button` links:
    - each link is `?tab={key}`, keeping the query string except `page` and `tab`, escaped through the URL helpers (tests: `?page=2&q=x` keeps only `q=x`; `q[]=a&b` and `q=<x>"` stay escaped)
    - each has `data-testid="tab-{key}"`; the open tab alone has `aria-current="page"` and the primary variant (the test names its markup and asserts the others lack both)
    - labels are escaped (tested with markup in a label); an icon `Icons::has()` doesn't know renders as `squares-2x2` (compared with a `squares-2x2` tab's markup)
    - it renders nothing when fewer than two tabs are visible: tested with only `overview`, and with one built-in plus one hidden registered tab

    Built-in labels come from the host; Atrium translates nothing.
14. `x-atrium::screen-sections :screen="$resolved" slot="..." [:row="$model"]` renders the slot's visible sections in order, each wrapped in an element with `data-testid="section-{key}"`, passing through any `class` attribute, and renders an empty string for an empty slot. `x-atrium::screen-tab-panel :screen="$resolved"` renders the open registered tab per criterion 9. Feature tests cover order, `class` passthrough and the empty slot.
15. **Around an open registered tab (D-024).** The tab's panel replaces the host's page content. `header.actions` always renders; `before`, `after`, `aside` and row slots render only while a built-in tab is open. A feature test on a test-host screen with a section in every standard slot asserts all of them on the built-in tab, and only `header.actions` plus the panel with a registered tab open (and that the hidden slots' resolvers never ran).

### Themes and layouts

16. The new components use only design tokens and utilities in Atrium's compiled safelist: `AtriumStyles::missingClasses()` and `inlineStyles()` are empty for them (tested). Rebuilding `public/atrium.css` is a done-step.
17. In both layouts the tab bar scrolls horizontally rather than wrapping and never overlaps the top layout's `top-tabs` row. The browser test asserts the nav's computed `overflow-x` is `auto` or `scroll`, its `flex-wrap` is `nowrap`, each link's `white-space` is `nowrap`, and all links share one top offset. The top-layout fixture has a workbench plugin with pages, so `top-tabs` is present.
18. **Browser matrix (D-004, D-012).** `tests/Browser/ScreenExtensionsTest.php` uses a Pest dataset over the 6 themes (`atrium`, `harbor`, `sunset`, `forest`, `midnight`, `ledger`) x 2 layouts (`sidebar`, `top`) x light/dark, so each of the 24 cases is its own named test. Each renders a workbench test-host screen with two built-in tabs, twelve registered tabs (one with a long label), a normal-slot section and a row-slot section, and asserts: the last tab scrolls into view, clicks and opens with `aria-current="page"`; the open tab's computed background differs from an idle tab's with the pointer elsewhere; in the top layout no tab's bounding box overlaps `top-tabs`; both sections render. It saves a screenshot per case under `tests/Browser/Screenshots/screen-extensions/`.

### Atrium's screens

19. **Declared screens (D-013, D-021).** Every Atrium page with a controller view declares itself with `Screen::standard()` and renders `x-atrium::screen-tabs`, `x-atrium::screen-tab-panel` and the sections of every slot it declares, laid out per criterion 15. Each has only the synthetic `overview` tab built in:

    | Key | Route | Kind | Record | Slots |
    |---|---|---|---|---|
    | `atrium.dashboard` | `/` | detail | the dashboard | `header.actions`, `before`, `after`, `aside` |
    | `atrium.named-dashboard` | `d/{slug}` | detail | the dashboard | `header.actions`, `before`, `after`, `aside` |
    | `atrium.dashboard-widget` | `dashboards/{dashboard}/widgets/{widget}` | detail | the widget | `header.actions`, `before`, `after`, `aside` |
    | `atrium.settings` | `settings` | list | none | `header.actions`, `before`, `after`, `row.actions` (per settings panel row) |
    | `atrium.settings-panel` | `settings/{panel}` | detail | none (a panel is not a model) | `header.actions`, `before`, `after`, `aside` |

    Anything else (login, error pages, `search`, JSON and form-post routes) is out of scope. Per screen, a feature test registers a tab and a section in every standard slot and asserts each section renders in its slot and not in an undeclared one, and the tab appears and opens through `?tab=`. With nothing registered, no tab bar or extra markup renders, and the existing feature and browser suites pass unchanged.

### History removal

20. **History leaves Atrium (D-009, D-014, D-016).** Removed: the `History` domain (`HistoryServiceProvider`, the `history/{package}` route `atrium.history.show`, `HistoryController`), `resources/views/history/show`, `x-atrium::audit-trail`, `x-atrium::audit.entries` and the rest of the `components/audit/` directory, their `@source` lines in `atrium.css`, and `Plugin::historyNavItem()`. Keen takes them over in its own spec.
    - Tests: `GET history/{package}` returns 404; an arch test asserts `HistoryController` and the audit component files no longer exist; `method_exists(Plugin::class, 'historyNavItem')` is false; `atrium.css` has no `audit` `@source`.
    - Done-steps: no reference remains in `src`, `resources`, `docs`, the README or the Boost skill; a workspace grep for `atrium.history`, `x-atrium::audit` and `historyNavItem` is listed in the PR; `AtriumStyles::missingClasses()` still passes; `CHANGELOG.md` has an upgrade note naming each removed route, class, method and component and pointing to Keen. Merges are grouped (Atrium, Keen and the hosts together) because the removal breaks packages that still use these.

### Documentation and architecture

21. The README gains a "Screen extensions" section, and the Boost skill under `resources/boost/skills` the same content, covering:
    - registration examples for a tab, a section, a row section and a wildcard section, and the host-side `Screen::standard()` declaration
    - the boot-only rule, `vendor.key` keys (D-008), duplicate handling per environment (D-022, D-023) and the 403-versus-200 tab-key behaviour
    - closure signatures with the trailing `Screen`, the evaluation order, and that wildcard and row-slot closures must be cheap (return early on `$screen->key` or `kind`)
    - what renders around an open registered tab, and the theme contract (tokens only, nothing per theme)
    - that a section renders inside the host's page but writes through the registrant's own routes and authorization
    - the suite rule (D-018): Atrium requires only Keystone; every other suite package is suggested
    - the config-defaults pattern (D-019) for registrants targeting another package's screens: an editable list of target screens and slots in the registrant's own config, applied only when the target screen exists, with an example

    A docs test asserts the section exists in both files and contains `boot()`, `403`, `vendor.key`, `Keystone` and `config`. Atrium's `CLAUDE.md` and `docs/agent/standards/atrium/domains.md` list the Screens domain and drop History.
22. `tests/ArchTest.php` passes: the new classes are final with strict types, the value objects use `public private(set)`, and `ScreensServiceProvider` is registered by `Domains\DomainServiceProvider`. `composer.json` still requires only Keystone among suite packages. Done means `composer test` and `composer test:browser` pass.

## Design

**Domain `Domains/Screens`** (`ScreensServiceProvider`, per atrium/domains):

- **`Data`:** `TabDefinition` and `SectionDefinition` (final, sharing a `Concerns\DefinesExtension` trait for key, label, view/component, closures, permission and public, plus `allows(Request, ?Model, Screen, ?Closure $access): bool` and `resolveData(?Model, Screen): array`); `Screen` (host declaration, built per request); `ResolvedScreen`.
- **`Services`:** `ScreenExtensions`, a singleton holding registrations only, keyed `[target][key]` for tabs and `[target][slot][key]` for sections, with `snapshot()`/`restore()`/`flush()`. Resolution merges exact, `{package}.*` and `*` targets for the screen. `ScreenVisibility`, bound `scoped()`, holds the visibility and data memos and the reported-once set.
- **Views:** `components/screen-tabs`, `screen-tab-panel` and `screen-sections`.
- **Testing:** `Testing\ResetsScreenExtensions` trait.
- **Facade:** `Atrium::screens()`.

The behaviour comes from Roster's `Tabs`/`TabDefinition`/`TabVisibility`, changed so that: the screen is a string key; permissions go through the host's `access` closure (Atrium's `Support\ScreenAccess` may be used inside it); the record may be null; closures receive the `Screen`; and there are sections, row slots, standard slots and wildcard targets.

No config, migrations, routes, events or MCP surface; the registry is code-only, filled from `boot()`.

## Out of scope

- Moving other packages' screens onto the registry: Roster, Showroom, Polycart, PennantPlus, Cortex, Impex, Keen and Guardian each have their own spec.
- The history page, History nav items and audit components in Keen (Keen's spec). Only their removal from Atrium is in scope.
- Nav items and whole pages as extension points; screens not in criterion 19.
- Any audit concept in Atrium; wildcard forms other than `*` and `{package}.*`.
- Ordering controls, priorities, badges, async tab bodies, per-tab routes, translated registered labels, and overriding, hiding or reordering a host's built-in tabs.

## Risks

- Reserved built-in keys are only known at resolve time, so those clashes are reported per request rather than thrown at boot; `vendor.key` keys (D-008) make them unlikely.
- In production a duplicate registration is skipped with one report rather than thrown (D-022), so a misconfigured app keeps running with the first registration; the report is the only signal.
- Wildcard and row-slot closures run on every matching screen or row; slow closures slow every page. The README tells registrants to return early.
- The history removal breaks every package still using it until its own spec lands, so Atrium, Keen and the hosts merge as a group (D-009).
- Scope is large: a new domain, five declared screens, the removals and a 24-case browser dataset.

## Changelog

- D-009: history and audit components are removed now; Atrium, Keen and hosts merge as a group (criterion 20, Risks).
- D-010: test reset snapshots after boot and restores after each test; `flush()` only for the registry's unit tests (criterion 5).
- D-011: published Pest trait `Testing\ResetsScreenExtensions` (criterion 5).
- D-012: browser matrix is a Pest dataset, one test per combination (criterion 18).
- D-013: every screen declares the standard slots and a tab bar, with a synthetic `overview` tab; `Screen::standard()` and `kind` added (criteria 6, 19).
- D-014: the history screen and `x-atrium::audit.entries` move to Keen, superseding D-007 (criterion 20).
- D-015: section and row-section failures are isolated and reported once; open-tab panel failures propagate (criterion 12).
- D-016: `Plugin::historyNavItem()` is removed; Keen adds History nav items (criterion 20).
- D-017: no audit concept in Atrium; `audits()`, `AuditedSubject`, `audited()` and the old criterion 10 replaced by `*` and `{package}.*` targets (criteria 1, 3, 11).
- D-018: Atrium requires only Keystone; the README states the suite rule (criteria 21, 22).
- D-019: the README documents the config-defaults pattern (criterion 21).
- D-020: spec rewritten in place; addenda replaced by this changelog.
- D-021: every Atrium page with a controller view is declared, with `/` and `d/{slug}` as separate keys (criterion 19).
- D-022: same key on one target throws in local/testing, reports once and skips in production (criterion 4).
- D-023: an exact registration beats a wildcard with the same key; the duplicate is reported once per request (criterion 4).
- D-024: an open registered tab replaces page content; only `header.actions` stays (criterion 15).
- D-025: `Screen` is the trailing argument to every `authorize` and `resolve` closure (criteria 2, 11).
- D-026: wildcard grammar limited to `*` and `{package}.*`; duplicates checked per target string at boot (criteria 3, 4).
- D-027: `snapshot(): array` and `restore(array)` named (criterion 5).
- D-028: same key across wildcard levels: the more specific target wins (exact, then `{package}.*`, then `*`).
- D-030: view variables are `screen` (the `Screen`), `record` and `tab` (the open key as a string); components get only `data` (criterion 9).
- D-031: settings panel rows render `row.actions` with an unsaved `SettingsPanelRowModel` stand-in per panel (criterion 19).
- D-032: Atrium's screens declare a Gate-based `access()` closure (criterion 19).
