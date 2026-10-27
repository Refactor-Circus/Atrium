# Atrium Dashboard Platform — Shaping Notes

## Scope

Turn `refactor-circus/atrium` from a bare Laravel package skeleton into a plug-and-play admin dashboard platform in the spirit of Laravel Nova, without Nova's central constraint.

Nova forces every screen through its resource/field abstraction and a single fixed layout. Atrium inverts that: it ships a dashboard **shell** (chrome, navigation, auth gate) plus a shared **Blade component library** developers can use anywhere, inside the shell or in their own pages. Third-party packages register an Atrium plugin and their nav items, pages, settings panels, widgets, and search sources appear automatically.

Intended outcome: `composer require` a plugin package and it shows up in the dashboard with zero host-app configuration, while the host app retains full control to disable, reorder, or override anything.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Frontend | Blade + Alpine, **no Livewire dependency** in the component library | Components usable in any Laravel app. Plugins may use Livewire; Atrium does not require it. |
| Plugin registration | Auto-discovery, overridable in config | "Register and it shows up" is the core requirement; the config escape hatch avoids Nova's rigidity. |
| Routing | Atrium owns the URL prefix; plugins register routes into it | Consistent URLs and one middleware/auth stack. |
| Components | Namespaced Blade components (`x-atrium::card`), publishable | Usable outside the shell, clean upgrade path. |
| Styling | Compiled CSS shipped as an asset, themed via CSS custom properties | No Tailwind build required in host apps; retheming without recompiling. |
| Dashboards | Own tables, per-user + shared, user-configurable, multiple per user | Users compose their own dashboards rather than receiving a fixed one. |
| Sizing | Phased — foundation first | Full vision planned; plugin registry, shell, nav, gate, and components land before widgets, dashboards, and search. |

### Non-negotiable constraint

**Widgets are offered, never auto-placed.** A plugin declaring a widget makes it available in the widget picker. Only a user adding it to a dashboard puts it on screen. Task 7 registers widget types and renders nothing; Task 9 handles placement.

### Explicitly out of scope for v1

- Nova-style resource/CRUD scaffolding with a field abstraction. This is the Nova trap the package exists to avoid. It may return later as an opt-in layer on top, never as the required path.
- A full authorization policy system for dashboards. v1 uses per-user ownership plus a shared flag.

## Context

- **Visuals:** None provided.
- **References:** No prior art in this repository. The package was a fresh skeleton at shaping time, containing only placeholder command, view, migration, route, and config entries. Conventions were drawn from `AGENTS.md` and the local skills instead. See `references.md`.
- **Product alignment:** N/A. No `agent-os/product/` folder exists.

## Standards Applied

`agent-os/standards/index.yml` exists but is empty, so no Agent OS standards were available to apply. Package conventions come from `AGENTS.md` and the local skills instead. See `standards.md`.
