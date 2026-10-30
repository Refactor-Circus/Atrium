# References

## Roster registered tabs (the pattern to generalise)

- **Location:**
  - `Roster/src/Atrium/Tabs.php`, `TabDefinition.php` and `TabVisibility.php`
  - `Roster/resources/views/ui/partials/tabs.blade.php` and `registered-tab.blade.php`
  - spec `Roster/docs/agent/specs/2026-10-23-2015-dynamic-tabs-orgs-users/`, which includes D-005 to D-024 and the post-mortem
- **Relevance:** the behaviour to lift into Atrium as-is.
- **Borrow:**
  - key regex `^[a-z0-9][a-z0-9._-]*$`
  - reserved keys taken from a public constant
  - clone on register
  - `public private(set)` properties, with closures kept private
  - default deny and `public()`
  - a `scoped()` memo keyed by screen, record and tab
  - throwing `authorize` closures reported once per request
  - only the open tab's resolver runs
  - spread order `[...$data, ...$host]`
  - a single `data` prop for components
  - unknown icons fall back via `Icons::has()`
  - the README section, checked by a docs test

## Atrium widget and plugin registries

- **Location:** `Atrium/src/Domains/Widgets/Services/WidgetRegistry.php` and `WidgetDefinition`; `Atrium/src/Domains/Plugins/Services/PluginRegistry.php`.
- **Relevance:** existing Atrium registries with per-request availability (`WidgetRegistry::available(Request)`).
- **Borrow:** registry naming, provider wiring and how availability is filtered per request.

## Atrium themes

- **Location:** `Atrium/src/Domains/Themes/` (`Theme`, `ThemeRegistry`, `ThemesServiceProvider`, which defines `atrium`, `harbor`, `sunset`, `forest`, `midnight` and `ledger`), plus `resources/css/atrium.css` tokens.
- **Relevance:** dynamic tabs must work in every theme and in both the `sidebar` and `top` layouts.
- **Borrow:** token-only styling. The existing `x-atrium::tabs` (Alpine, client-side) and `tab-panel` components are related but not the same: screen tabs are server-side `?tab=` links.

## Existing tab bars that will move onto the registry

- Roster organization: `Roster/resources/views/ui/organizations/show.blade.php` and `OrganizationUiController`
- Roster user: `users/show.blade.php` and `UserUiController`
- Roster team: `teams/show.blade.php` and `TeamUiController`
- Roster SSO connection: `sso/show.blade.php` and `SsoUiController` (moves to Guardian)

## Audit trail component (capability target for Keen)

- **Location:** `Atrium/resources/views/components/audit-trail.blade.php` (props `source`, `subject`, `scope`, `action`, `limit`, `title`).
- **Relevance:** the audited-subject declaration must carry what this component needs (package key, subject or scope, and an optional action prefix).
