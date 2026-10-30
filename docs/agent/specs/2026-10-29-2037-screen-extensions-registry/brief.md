Risk: high

## What changed
- New `Domains/Screens`:
  - the `ScreenExtensions` registry, a singleton reached through `Atrium::screens()`
  - `TabDefinition` and `SectionDefinition`
  - `Screen`, with `standard()` slots: `header.actions`, `before`, `after`, `aside`, and the row slot `row.actions`
  - `ResolvedScreen`
  - the per-request memo `ScreenVisibility`
  - wildcard targets `*` and `{package}.*`
  - the `x-atrium::screen-tabs`, `screen-tab-panel` and `screen-sections` components
  - the `Testing\ResetsScreenExtensions` trait
- All five Atrium pages declare themselves with a tab bar, the standard slots and a Gate `access()` check: the dashboard, the named dashboard, widget detail, the settings index (with a `row.actions` slot on each panel row) and the settings panel.
- Removed and moved to Keen (D-014, D-016):
  - the History domain, the `history/{package}` route and `HistoryController`
  - `x-atrium::audit-trail` and `x-atrium::audit.*`
  - `Plugin::historyNavItem()`
- Added a README and Boost "Screen extensions" section, a CHANGELOG upgrade note, and a browser matrix over 6 themes, 2 layouts and light/dark.

## Why
This makes "register it from your own package" the only way to add tabs and sections to any screen, so host packages stop checking whether other packages are installed (D-017: no package knows another; integrations go through config). It generalises Roster's registered tabs (Roster PR #5).

## Look at
- `src/Domains/Screens/Services/ScreenExtensions.php`: registration, the duplicate rules by environment (D-022), and exact/`pkg.*`/`*` precedence (D-023, D-028).
- `src/Domains/Screens/Services/ScreenVisibility.php`: the per-request memo keyed by morph class plus key or the model itself. Visibility answers must never leak across viewers.
- `resources/views/components/screen-sections.blade.php`: failure isolation. It snapshots and restores the view factory's state so that a throwing section can't break the page (D-015).
- `src/Domains/Settings/Data/SettingsPanelRow.php`: the unsaved stand-in that carries each settings panel row (D-031, D-033).

## Tested
- `composer test`: phpstan 0 errors, pint, 100% type coverage, pest 589/589.
- `composer test:browser`: 46/46, including the 24 theme × layout × mode cases. The gate didn't run this suite; I ran it by hand after the job escalated.
- `npm run build:css`: `public/atrium.css` is unchanged, so the committed file is current.

## Risks
- Breaking: the history page, the audit components and `historyNavItem()` are gone. Every host that uses them breaks until its own spec lands (see Breaks). Merge as a group: Atrium, Keen, then the hosts (D-009).
- Wildcard and row-slot closures run on every matching screen or row, so a slow registrant slows every page. The README tells registrants to return early.
