---
description: "Atrium owns every component and style of the first-party suite; packages use x-atrium components plus the safelisted utilities only, checked by AtriumStyles; third parties may still add CSS and component namespaces"
tags: [atrium, frontend, blade, components, css]
kind: architectural
---

# Components and Styles

Atrium owns every Blade component and every style of the first-party suite; other first-party packages build their screens from `x-atrium::*` components and the safelisted utilities only.

## First-party packages

- Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom ship no `resources/css`, no compiled stylesheet, no `Atrium::css()` / `Atrium::stylesheet()` call and no component namespace.
- Their views are domain screens built from `x-atrium::*` components plus the layout utilities Atrium safelists in `resources/css/atrium.css` (`@source inline(...)`): grid columns and spans, flex alignment, gap, spacing, widths and heights, sizes, text sizes, font and wrapping helpers, overflow, positioning, borders and the surface/text tokens.
- No package CSS, `<style>` block or `style` attribute. A screen that needs something not covered gets a new generic component in Atrium, or a safelist entry.

## Existing generic pieces

- `description-list`, bare form controls (`bare`), input `prefix`/`suffix`, `form.combobox`, `search-input`, `chip`, `banner` (`standalone` for host-app pages), `form.actions`, `flash`, `guest`, `audit-trail`, `audit.entries`, `audit.changes`.

## Enforcement

- Each first-party package has a test asserting `AtriumStyles::missingClasses()` and `AtriumStyles::inlineStyles()` are empty for its `resources/views`.

## Third parties

- Third-party packages may still register styles with `Atrium::css()` / `Atrium::stylesheet()` and their own component namespace.

## Building

- After changing any Atrium Blade file or the safelist, run `npm run build:css` and commit `public/atrium.css`.
