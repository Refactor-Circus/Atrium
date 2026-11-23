# Decisions

## D-001: How is the Nuxt layer distributed to host apps?
- Choice: Git `extends` from the repo tag (`github:refactor-circus/atrium/nuxt/layer#v2.0.0`), no registry
- Rationale: The user took the recommendation: it needs no registry, and the layer stays on the same tag as the Composer package.
- Date: 2026-11-22
- Raised by: spec review (scope, testability)

## D-002: Where do the Nuxt checks (typecheck, build, Vitest) run?
- Choice: A `composer test:nuxt` script, which CI runs as its own job; `composer test` stays PHP-only
- Rationale: The user took the recommendation: Node stays out of the PHP gate, and the layer is still gated.
- Date: 2026-11-22
- Raised by: spec review (scope, testability)

## D-003: Is layer localization (i18n) in scope for v2.0.0?
- Choice: In scope: the layer ships i18n with locale files
- Rationale: Chosen by the user over the recommendation to leave it out.
- Date: 2026-11-22
- Raised by: spec review (scope)

## D-004: How is version skew between the Composer API and the Nuxt layer handled?
- Choice: The shell response carries an API version, and the layer warns on a mismatch
- Rationale: The user took the recommendation.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-005: What happens at boot when a v1 config still has the removed keys?
- Choice: Log a deprecation warning at boot that names the keys
- Rationale: The user took the recommendation. A guard left in the old `middleware` key must not be dropped silently.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-006: How does the layout save treat placements missing from the payload, and orphaned placements?
- Choice: Placements omitted from the payload are deleted; orphaned placements are kept
- Rationale: The user took the recommendation. The payload is the full layout, and orphans survive a plugin that is temporarily disabled.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-007: How do tests guard against drift between the API and the layer contract?
- Choice: PHP tests write JSON fixtures, and the Vitest tests and TypeScript types are checked against them
- Rationale: The user took the recommendation.
- Date: 2026-11-22
- Raised by: spec review (testability)

## D-008: How does layout save guard against a stale client overwriting a newer layout?
- Choice: Optimistic lock: the client sends the dashboard's version, a mismatch returns 409 and the layer reloads
- Rationale: Recommended; D-006 makes the payload the full layout, so a stale save would silently delete placements.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-009: What happens when an eager widget's resolver throws or fails JsonData::check()?
- Choice: Isolate in production only (placement gets data null plus error, logged); 500 in local and testing
- Rationale: Recommended; one broken plugin widget must not make the dashboard unloadable.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-010: Where does the layer get Iconify icon data?
- Choice: Bundle lucide locally; hosts add @iconify-json packs or opt in to the remote Iconify API
- Rationale: Recommended; works offline and under a strict CSP, and doesn't leak icon usage.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-011: Which locales ship in v2.0.0?
- Choice: English only; the i18n mechanism plus a second locale used only in Vitest
- Rationale: Recommended; bounds the D-003 scope.
- Date: 2026-11-22
- Raised by: spec review pass 2 (scope)

## D-012: What happens to the atrium.theme config key?
- Choice: Keep it; its values go out as the built-in theme's properties in the shell
- Rationale: Recommended.
- Date: 2026-11-22
- Raised by: spec review pass 2 (scope)

## D-013: How does ClientPath decide same-host, and what does it return for rejected forms?
- Choice: Same host means the host of config('app.url'); a rejected form returns null and the link is omitted
- Rationale: Recommended; the request host is the API's, not the SPA's.
- Date: 2026-11-22
- Raised by: spec review pass 2 (testability)

## D-014: How should the factory gate groups 2 to 5 while Blade-era callers remain until group 6?
- Choice: Accept a red full suite until group 6. Groups 2 to 5 are gated on their own test files plus PHPStan and Pint; the full gate (vendor/bin/pest, composer test) applies from group 6 on.
- Rationale: The user took the recommendation. The breaking tests belong to groups 3 to 6, which rewrite or delete them.
- Date: 2026-11-23
- Raised by: factory build (group 2 implementer)

## D-015: How should the archive rules treat `nuxt/`, given giget fetches GitHub tarballs built with `git archive`?
- Choice: Export-ignore only the dev parts (`/nuxt/playground`, `/nuxt/package.json`, `/nuxt/pnpm-workspace.yaml`, `/nuxt/pnpm-lock.yaml`, `/nuxt/layer/test`) and keep `/nuxt/layer` in the archive, so Composer dists carry the layer source too.
- Rationale: The user took the recommendation; D-001's git `extends` needs the layer in the tarball.
- Date: 2026-11-23
- Raised by: factory build (group 6 implementer)

## D-016: What happens to `Atrium::path()`, `Atrium::url()` and `NavItem::isActive()`, which read the removed `atrium.path` key?
- Choice: Remove `Atrium::path()` and `Atrium::url()` and their facade `@method` lines, list them in the v2.0.0 CHANGELOG, and make `NavItem::isActive()` stop reading `atrium.path`.
- Rationale: The user took the recommendation.
- Date: 2026-11-23
- Raised by: factory build (group 6 implementer)
