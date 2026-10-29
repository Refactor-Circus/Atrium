# Screen extensions registry

## Goal

Any package can add tabs and sections to any screen that declares itself with `Screen` by registering them from its own `boot()`. Host screens declare where those extensions may go and stop checking whether other packages are installed. Tabs and sections render the same way in every Atrium theme and layout.

## Acceptance criteria

### Registry and definitions

1. `RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions` is bound as a singleton (`app(ScreenExtensions::class) === app(ScreenExtensions::class)`) and is reachable as `Atrium::screens()` (a test asserts that it returns the singleton). It supports these registration methods:
   - `tab(string $screen, TabDefinition)`
   - `section(string $screen, string $slot, SectionDefinition)`
   - `audited(SectionDefinition)`

   Each returns the registry, for chaining. A registration for a screen key that no installed package declares is stored and never renders, with no error. A unit test registers for `missing.screen` and asserts that nothing throws and that a declared screen with another key is unaffected.
2. `TabDefinition::make($key)` and `SectionDefinition::make($key)` live in `Domains\Screens\Data`.
   - **Fluent setters:** both have `label()`, `icon()` (tabs only), `view()` / `component()` (setting one clears the other), `resolve(Closure)`, `permission(string)`, `authorize(Closure)` and `public()`.
   - **Readable state:** `key`, `label`, `icon`, `view`, `component`, `permission` and `public` are `public private(set)`. `label` defaults to the key, a tab's `icon` defaults to `squares-2x2`, and `public` defaults to `false`.
   - **Private closures:** `resolver` and `authorize` are private, and reading either from outside throws `Error`.

   Unit tests cover the view/component exclusivity and assert that writing any property throws `Error`.
3. **Registration validation.**
   - Keys must match `^[a-z0-9][a-z0-9._-]*$`, or construction throws `InvalidArgumentException`. Tests cover an accepted `acme.billing`, and reject uppercase, a space, a slash and an empty key.
   - Registration also throws `InvalidArgumentException` for:
     - a duplicate key on the same screen (for tabs) or the same screen and slot (for sections), with a message naming the key, the screen and, where it can be found, the registering call site (first frame outside Atrium). The throw from `boot()` is deliberate: it is loud and early, and the README says so
     - a definition with neither a view nor a component
     - a screen key that doesn't match `^[a-z0-9-]+\.[a-z0-9.-]+$` (`{package}.{screen}`)
   - The registry stores a clone, so later fluent calls on the caller's instance change nothing. A test mutates the original after registering it and asserts that the registered copy is unchanged.
   - Keys are cast with `(string)` wherever they are read back. A test registers the keys `123` and `007` and asserts that `?tab=007` reaches the view as the string `'007'`.
4. `ScreenExtensions::flush()` forgets everything and is documented as for tests only; nothing can be unregistered at runtime. Atrium's `TestCase` and the published testing helper call it in `beforeEach` and `afterEach`. Whatever the helper's shape, a test asserts that a tab registered from a provider's `boot()` is still present in the second of two consecutive tests. A unit test registers a tab, a section and an audited section, calls `flush()`, and asserts that all three listings are empty.

### Screen declarations

5. A host renders a screen by building `Screen::make(string $key)` (`Domains\Screens\Data\Screen`). Its setters are:
   - `record(?Model)`
   - `tabs(array $builtIn)`, where each built-in entry gives its key, label and icon, in order
   - `defaultTab(string)`
   - `slots(string ...$names)`
   - `rowSlots(string ...$names)`
   - `access(Closure(string $permission, Request, ?Model $record): bool)`
   - `audits(string $package, ?Model $subject = null, ?Model $scope = null, ?string $action = null, string $slot = 'history')`

   It then passes the screen to `ScreenExtensions::resolve(Screen, Request): ResolvedScreen`.
   - **Reserved tab keys:** registering a tab whose key is one of the screen's built-in keys renders nothing, and resolving reports it once per request through `report()` with an `InvalidArgumentException` naming the key and the screen. The registry can't know a screen's built-ins at `boot()`, so the clash is caught at resolve time. Tested.
   - **Permission checks:** a definition's `permission()` is checked only through the screen's `access` closure. A screen without one treats every `permission()` tab or section as hidden. Tested.
6. `ResolvedScreen` exposes:
   - `tabs` (visible tabs in order: the built-ins as given, then registered tabs in registration order)
   - `openTab` (string)
   - `openRegisteredTab` (`?TabDefinition`)
   - `sections(string $slot): list<SectionDefinition>` (visible, in registration order)
   - `rowSections(string $slot, Model $row): list<SectionDefinition>`
   - `data(TabDefinition|SectionDefinition, ?Model $record = null): array` (the resolver's output, computed on first call and memoized for the request)

   Resolving reads `?tab=` only as a string; `?tab[]=x` counts as absent. Feature tests cover each rule below (array `?tab[]`, unknown key, default tab, a screen with no default tab, a visible registered tab, a hidden registered tab). The open tab is chosen this way:
   - **Absent or unknown key:** `defaultTab`, or the first built-in if none is set, with a 200. Registered tabs are never the default.
   - **Visible registered tab:** that tab.
   - **Registered tab the viewer can't see:** a 403 HTTP exception. An unknown key answers 200 and a hidden registered key answers 403, so a viewer can tell which tab keys exist. This is accepted, and the README records it.
7. **Visibility.**
   - A tab or section is visible only when:
     - its `permission()` passes the screen's `access` closure
     - its `authorize(fn (Request, ?Model $record): bool)` returns `true`
     - both pass, when it has both
     - with neither, only after `public()`
   - A throwing `authorize` closure counts as a denial and is reported once per request per screen and key.
   - Results are memoized per request in `ScreenVisibility`, bound with `scoped()` and keyed by screen, slot, extension key and the record's identity: the model's morph class plus its key, or `spl_object_id` when the key is null, so rows of different classes sharing an id never share an answer. The same composite key is used for the `data()` memo. Results never live on the registry or the definitions.
   - Tests cover, for both tabs and sections: permission only, closure only, `public()`, neither (hidden), both passing, one failing, and a throwing closure (reported exactly once, closure called exactly once, screen returns 200). Memo-key tests use two rows with the same id across two model classes (each gets its own answer and data) and an unsaved row (no collision with another unsaved row). Two sequential requests with `app()->forgetScopedInstances()` between them and different viewers each evaluate visibility afresh.
8. **Order of evaluation.**
   - Hosts call `resolve()` only after their own screen authorization. The README states this, and a test-host screen denied with a 403 asserts that no `authorize` closure or resolver runs (both counted).
   - Resolvers run only when `data()` is called: for the open registered tab, and for each section the component renders. A counting resolver on a hidden tab, an unopened tab, a hidden section and a section in a slot the view doesn't render is never called.
   - On the component path, resolver data reaches the view as a single `data` prop. On the view path it is spread first, with the host's variables (`screen`, the record under `record`, and `tab`) spread over it, so the host's variables win. A test returns `screen`, `record` and `tab` from a resolver and asserts that the host's values win.

### Per-row slots

9. A `rowSlots()` slot renders once per row: `<x-atrium::screen-sections :screen="$resolved" slot="actions" :row="$run" />`.
   - Inside a row slot, the section's `authorize` closure and resolver receive that row's model, and visibility is memoized per row identity (morph class plus key, as in criterion 7). A section registered on a slot the screen never declared is never rendered and its closures are never called; tested.
   - A feature test renders a three-row table with a section whose `authorize` admits only the second row, and asserts:
     - the section markup appears exactly once, in that row
     - `authorize` was called three times and the resolver once
     - a second render of the same rows in the same request makes no further calls
   - A section registered on a row slot and rendered without `:row` throws `InvalidArgumentException`; so does a normal slot rendered with `:row`. Tested.

### Audited screens (capability)

10. `audited(SectionDefinition)` registers a section for every screen that calls `audits(...)`. It renders in the slot the screen named (default `history`) and is visible only when that screen declares an audited subject.
    - The section's resolver and view receive an `AuditedSubject` value (`package`, `subject`, `scope`, `action`) instead of the record. A positive feature test asserts the received fields, and that a non-default `slot:` is honoured.
    - Audited sections follow default-deny like any other: one with no permission, `authorize` or `public()` stays hidden on a screen that declares `audits()`. Tested. The README says the host's `audits()` subject must be one the viewer is already authorized to see.
    - A screen without `audits()` never renders it, and its `authorize` and resolver are never called. Tested with counting closures.
    - A screen that declares `audits()` but doesn't render the named slot also doesn't call them. Tested.

### Rendering components

11. `x-atrium::screen-tabs :screen="$resolved"` renders a `<nav>` of `x-atrium::icon-button` links:
    - each link goes to `?tab={key}`, keeping the current query string except `page` and `tab`, escaped through the URL helpers. Tests cover `?page=2&q=x` (links keep `q=x` only) and array and special-character parameters (`q[]=a&b`, `q=<x>"`) staying escaped
    - each has `data-testid="tab-{key}"`
    - the open tab gets `aria-current="page"` and the primary variant (the class or attribute `icon-button` emits for it, named in the test); the others get neither, which the test asserts
    - labels are escaped, and a test registers a label containing markup to prove it
    - an icon name that Atrium doesn't know (`Icons::has()`) falls back to `squares-2x2`. The test compares the rendered icon markup with a `squares-2x2` tab's.
    - when the screen has fewer than two visible tabs, it renders nothing

    Labels for built-in tabs are given by the host, so Atrium translates nothing.
12. `x-atrium::screen-tab-panel :screen="$resolved"` renders the open registered tab's view or component per criterion 8. `x-atrium::screen-sections :screen="$resolved" slot="..." [:row="$model"]` renders the slot's visible sections in registration order. Each section is wrapped in an element with `data-testid="section-{key}"` and passes through any `class` attribute given to the component. With no visible sections it renders nothing, so the host's layout is unchanged. Feature tests cover the `class` passthrough, an empty string for an empty slot, and registration order.

### Themes and layouts

13. The new components use only design tokens and utilities from Atrium's compiled safelist. `AtriumStyles::missingClasses()` and `inlineStyles()` are empty for them (tested). Rebuilding `public/atrium.css` is a done-step.
14. In both layouts the tab bar scrolls horizontally (`overflow-x-auto`, no wrap) on narrow screens, and never wraps beneath or overlaps the top layout's `top-tabs` row. The browser test asserts that the nav's computed `overflow-x` is `auto` or `scroll`, that `flex-wrap`/`white-space` is `nowrap`, and that all links share one top offset, in both layouts.
15. A browser test (`tests/Browser/ScreenExtensionsTest.php`) renders a workbench test-host screen with:
    - two built-in tabs
    - twelve registered tabs, one with a long label
    - a section in a normal slot
    - a section in a row slot
    - an audited section

    For each built-in theme (`atrium`, `harbor`, `sunset`, `forest`, `midnight`, `ledger`), in both layouts (`sidebar`, `top`) and in light and dark mode, it asserts that:
    - every tab is reachable: the last tab can be scrolled into view and clicked, and opens with `aria-current="page"`
    - the open tab's computed background differs from an idle tab's
    - no tab overlaps the `top-tabs` row, compared by bounding boxes in the top layout
    - the sections render

    Every assertion message, or each dataset row, names the theme, layout and mode, so a failure identifies its combination. It saves a screenshot per theme, layout and mode under `tests/Browser/Screenshots/screen-extensions/`.

### Documentation and architecture

16. The README gains a "Screen extensions" section with:
    - registration examples for a tab, a section, a row section and an audited section
    - the host-side `Screen` declaration example
    - the boot-only rule and `vendor.key` keys
    - the evaluation order
    - the theme contract (token-only, nothing per theme)

    The Boost skill under `resources/boost/skills` gets the same. The README also records that a malformed or colliding registration throws from `boot()` on purpose, and the 403-versus-200 tab-key behaviour. A docs test only checks that a "Screen extensions" section exists in both files. Atrium's `CLAUDE.md` and `docs/agent/standards/atrium/domains.md` are updated to list the Screens domain.
17. `x-atrium::audit-trail` is removed from Atrium (moved to Keen, D-007). `x-atrium::audit.entries` stays, and `history/show` still renders (a feature test asserts a 200 with `audit.entries`). The CHANGELOG notes the removal and points to Keen.
18. `tests/ArchTest.php` passes: the new classes are final with strict types, the value objects use `public private(set)`, and the domain has a `ScreensServiceProvider` registered by `Domains\DomainServiceProvider`. Done means `composer test` and `composer test:browser` pass.

## Design

**Domain `Domains/Screens`** (`ScreensServiceProvider`, following atrium/domains):

- **`Data`:**
  - `TabDefinition`, `SectionDefinition`. Both are final and share a `Concerns\DefinesExtension` trait for the key, label, view/component, resolver, permission, authorize and public, plus `allows(Request, ?Model, Closure $access): bool` and `resolveData(mixed $record): array`.
  - `Screen`: the host declaration, built per request.
  - `ResolvedScreen`.
  - `AuditedSubject` (`package`, `?Model subject`, `?Model scope`, `?string action`).
- **`Services`:**
  - `ScreenExtensions`: singleton; registrations only, keyed `[screen][key]`, `[screen][slot][key]` and `[audited][key]`.
  - `ScreenVisibility`: `scoped()`; holds the memo of answers, resolved data and reported keys.
- **Views:** `resources/views/components/screen-tabs.blade.php`, `screen-tab-panel.blade.php` and `screen-sections.blade.php`.
- **Facade:** `Atrium::screens()` returns the registry.

Roster's `Tabs`/`TabDefinition`/`TabVisibility` are the source. The behaviour is carried over, and the changes are:

- the screen is a string key, not a method
- permissions go through the host's `access` closure, not Roster's `ScreenAccess`
- the record may be null on list screens
- there are sections, row slots and the audited capability

Atrium's own `Support\ScreenAccess` stays as it is: hosts may use it inside their `access` closure.

No config, migrations, routes, events or MCP surface. The registry is code-only, registered from `boot()`.

## Out of scope

- Moving any package's screens onto the registry. Each package has its own spec: Roster, Showroom, Polycart, PennantPlus, Cortex, Impex, Keen and Guardian.
- Nav items, whole pages, `historyNavItem()` and the history page (section B).
- Ordering controls, priorities, badges, async tab bodies, and per-tab routes.
- Translating registered labels.
- Overriding, hiding or reordering a host's built-in tabs.
- Audited tabs (only audited sections exist), and any config, event or MCP surface for the registry.

## Risks and open questions

- Reserved built-in keys are only known at resolve time, so a clash is reported per request rather than thrown at boot. Vendor-prefixed keys (D-008) make this unlikely.
- `x-atrium::audit-trail`'s removal breaks every package that still uses it inline, until its host spec lands. Order: Atrium, then Keen, then the hosts. Merges should be grouped, or Atrium could keep the component for one release with a deprecation note. Spec review should decide.
- The browser matrix (6 themes × 2 layouts × 2 modes = 24 renders) adds suite time, so it may need to run as one test with a loop rather than 24 tests.

## Addendum (2026-10-29): every screen, standard slots, history to Keen

These decisions extend scope. The numbered criteria above still apply; where they conflict, this addendum wins.

- **Standard slots (D-013).** Atrium defines one slot vocabulary that every screen in the suite declares, so registrants can target any screen the same way:
  - all screens: `header.actions` (beside the page header actions), `before` (above the main content) and `after` (below it)
  - screens with a record (detail screens) also have `aside` (the side column, or under the content on narrow layouts) and the audited `history` slot when the screen calls `audits()`
  - list screens also have the row slot `row.actions` (one render per table row)

  `Screen::standard()` returns these names for a detail or list screen. Hosts may declare extra slots of their own.
- **Tab bar everywhere (D-013).** Every screen renders `x-atrium::screen-tabs` and `x-atrium::screen-tab-panel`. Screens with no built-in tabs declare one default tab (`overview`) holding the page, so registered tabs can be added. Per criterion 11, the bar renders nothing until at least two tabs are visible, so screens without registered tabs look unchanged.
- **Atrium's own screens declared here:**
  - `atrium.dashboard` (`/` and `d/{slug}`)
  - `atrium.dashboard-widget`
  - `atrium.settings`
  - `atrium.settings-panel`

  A feature test per screen registers a tab and a section in every standard slot and asserts that they render. With nothing registered, the existing feature and browser suites pass unchanged.
- **History moves to Keen (D-014).**
  - Removed from Atrium: the `history/{package}` route, `HistoryController`, `history/show`, `x-atrium::audit.entries` and `x-atrium::audit-trail`.
  - Updated: Atrium's `audit/` component directory and the `@source` entries in `atrium.css`.
  - A CHANGELOG note points to Keen.
  - Criterion 17's "audit.entries stays" no longer applies.
  - Still open: whether `Plugin::historyNavItem()` moves to Keen.
