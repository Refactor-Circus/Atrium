# Screen extensions registry — Shaping Notes

## Scope

Make "register it from your own package" the one standard way to add tabs and sections to any Atrium screen, replacing every place where a host package checks whether another package is installed and renders that package's UI itself.

This is a change to Atrium. It generalises Roster's `Atrium\Tabs` / `TabDefinition` / `TabVisibility` (Roster PR #5, spec `2026-10-23-2015-dynamic-tabs-orgs-users`) into Atrium so that every package's screens can be extended the same way.

In scope:

- **Registry.** One Atrium registry (working name `ScreenExtensions`), a singleton, populated from providers' `boot()`. It supports:
  - **Tabs** on a screen's tab bar.
  - **Sections:** named slots on a screen (a card or panel area, a table-row slot), each holding a list of registered sections.
  - Screens are identified by a **string key**, `{package}.{screen}` (`roster.organization`, `roster.user`, `roster.team`, `roster.sso-connection`, `showroom.product`, `showroom.transfers`, …), so a registering package never imports the host's classes.
- **Definitions.** Tab and section definitions keep Roster's proven behaviour:
  - fluent definitions (`label`, `icon`, `view` / `component`, `resolve`, `permission`, `authorize`, `public`)
  - key validation, reserved built-in keys and clone-on-register
  - default-deny visibility
  - a per-request `scoped()` visibility memo
  - a host's own screen authorization running before any registered code
  - a resolver running only for the open tab or rendered section
  - Roster's variables winning over resolver data
  - throwing `authorize` closures counted as a denial and reported once per request
  - `flush()` for tests only
- **Permission checks.** Atrium can't know each host's permission model. A host screen supplies its own access check, and Roster's `ScreenAccess::allows()` is one such check.
- **Screen declarations.** A host screen declares:
  - its key
  - its record, which may be absent for list or index screens
  - its built-in tab keys, which are reserved
  - its section slots
  - an optional **audited subject**: the package key plus the subject record, a scope record, or package-wide. Keen's History section uses this (see the Keen spec).
- **Shared rendering components.**
  - `x-atrium::screen-tabs`: a tab bar built from a screen's built-in and visible registered tabs, as `?tab=` links with `aria-current="page"`.
  - `x-atrium::screen-sections`: renders a slot's visible sections in registration order.
  - Both replace Roster's `roster::ui.partials.tabs` and `registered-tab` partials.
- **Themes.** Dynamic tabs and sections must render correctly in every built-in theme and both layouts:
  - themes: `atrium`, `harbor`, `sunset`, `forest`, `midnight`, `ledger`
  - layouts: `sidebar` and `top`
  - The `top` layout already shows the current section's pages as a tab row under the topbar. A screen's tab bar must not collide with that row, and must stay usable (scrolling or wrapping) when many tabs are registered.
  - Browser tests cover every theme in both layouts.
  - Theme authors get a documented contract: the components only use design tokens, so a new theme needs no tab-specific work.

## Decisions

- D-001: the registry lives in Atrium. Roster's `Tabs` / `TabDefinition` / `TabVisibility` are deleted, not kept as wrappers. Roster moves onto Atrium's registry in its own spec. This is a breaking change, accepted because nothing is on Packagist yet. (User, 2026-10-29.)
- D-002: screens are identified by string keys `{package}.{screen}`, and a registering package never imports host classes. Registering for a screen whose package isn't installed is harmless, because that tab or section simply never renders. Registering packages therefore need no `class_exists()` checks.
- D-003: Keen's audit trail is added by capability. Screens declare an audited subject, and Keen registers one section that attaches to any screen that declares one. The registry therefore needs a "for every screen declaring X" registration form, alongside the per-screen-key form. (User, 2026-10-29.)
- D-004: every theme and both layouts must handle dynamic tabs, enforced by browser tests across all themes and layouts. (User, 2026-10-29.)
- D-005: this replaces section A of the cross-package audit (tabs and sections gated on another package). Section B is out of scope: nav items, whole pages, `historyNavItem()`, the history page and `atrium.keen.*` route checks.
- D-006: the registry supports per-row section slots: a slot rendered once per table row, with that row's record as the section's record, the resolver and `authorize` running per row, and the visibility memo keyed by row record. Impex's run link on `showroom.transfers` needs this. (User, 2026-10-29.)
- D-007: `x-atrium::audit-trail` moves out of Atrium into Keen (Keen spec). `x-atrium::audit.entries` stays in Atrium, because Atrium's own history page (`resources/views/history/show.blade.php:17`) renders it. (User, 2026-10-29.)
- D-008: keys registered on another package's screen are vendor-prefixed (`guardian.sso`, `keen.activity`, `cortex.mcp`), so they never clash with a host's reserved built-in keys while both exist. The README recommends `vendor.key`, and these first-party registrations follow it.

## Context

- **References:** see `references.md`.
- **Order:** this spec is first. Every other spec in this initiative depends on it:
  - Roster: adopt the registry
  - Guardian
  - Keen: History section
  - Cortex
  - Impex
  - Showroom, Polycart, PennantPlus
- **Product:** Atrium is the shared dashboard for the Refactor Circus suite. Making it the extension point for screens means packages own their own UI wherever it appears.
- **Visuals:** none provided. The bar keeps the look of the existing Roster organization tab bar (`x-atrium::icon-button` items).

## Standards

- architecture/public-api: the registry, definitions and screen declaration become Atrium's public API for every package.
- architecture/container-bindings: the singleton registry plus the `scoped()` per-request visibility memo (Octane-safe).
- architecture/dependencies: hosts and registrants link only through string keys, with no `class_exists()` checks between packages.
- architecture/domain-modules: where the registry sits in Atrium's domains (likely a new `Screens` domain beside `Widgets` and `Plugins`).
- atrium/components: the new `screen-tabs` / `screen-sections` components, using design tokens only and safelisted utilities.
- atrium/domains: Atrium domain conventions.
- data/value-objects: immutable-from-outside definitions (`public private(set)`, clone on register).
- http/authorization: the host's screen authorization comes first, visibility is deny-by-default, and a hidden `?tab=` answers 403.
- testing/test-layers: unit tests for the registry and definitions, feature tests for rendering, and browser tests for every theme and layout.
- testing/arch-tests: new classes are final and use strict types.
