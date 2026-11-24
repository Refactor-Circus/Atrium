## Summary

<!-- What changes, and why. Link the spec or issue. -->

## Checks

- [ ] `composer test` passes (PHPStan, Pint, type coverage, Pest).
- [ ] `composer test:ui` passes, and its rebuilt `dist/` and module builds are committed, if anything under `ui/`, the API's payloads or the contract fixtures changed.
- [ ] The CHANGELOG has an entry for every user-facing change, and an upgrade note for every breaking one.

## Release checks

Tick these on a PR that changes a migration, the API contract, or prepares a major release. Leave the ones that do not apply unticked and say why. Each item names its owner.

### Migrations on MySQL and Postgres

CI runs the migrations on SQLite only.

- [ ] Ran the new or changed migrations (for v2.0.0, `add_uuid_and_version_to_atrium_dashboards`) up and down on **MySQL** 8 and **Postgres**, against a database holding v1 data, with the default table names and with renamed `atrium.tables`. Every placement got a distinct, non-null `uuid`, the unique index exists, and `down()` restored the v1 schema. Owner: PR author.

### Sibling packages stay on a tag range

Before merging a breaking release to `main`, each of the 7 sibling packages (Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom) must require Atrium by tag range (`^1`, or the pre-2 range it uses, such as `^0.1`), never `dev-main`, and no sibling CI may resolve Atrium from the main checkout.

- [ ] Ran, from the workspace root, for each sibling:

  ```bash
  grep -n '"refactor-circus/atrium"' <Package>/composer.json
  grep -rn 'atrium' <Package>/.github/workflows
  ```

  and pasted the output below. Every sibling is confirmed, or the missing tags are cut first; do not merge until then. Owner: PR author.

<details>
<summary>Sibling constraint grep output</summary>

```text

```

</details>

### Release tags

- [ ] The repository's tag ruleset protects `v*` tags (no update, no deletion, no force push) before the release tag is pushed: modules install the SDK (`ui/sdk`) from the tag with pnpm, and Composer resolves the same tag. Owner: PR author.
- [ ] After publishing the release, the Update Changelog workflow did not add a second heading for a version the CHANGELOG already has. Owner: PR author.

### Suite modules (D-089) and Keystone (D-037)

Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom each ship their own Atrium module in their repository (`atrium/`, built to `dist/atrium/`, declared in `extra.atrium`; see `MODULES.md`), with their own generated client. Atrium stages none of them and vendors no package client any more (D-089, superseding D-020).

- [ ] Each suite package's tagged v2 release pins the SDK at this release's tag (`github:refactor-circus/atrium#v2.0.0&path:ui/sdk`), and its committed `dist/atrium/build.json` targets shared API `1.0`. Owner: PR author.
- [ ] Widened the `refactor-circus/keystone` constraint in `composer.json` to include the Keystone release that drops its built-in `atrium` surface prefix (D-037), and `composer test` passes against it. Owner: PR author.

### Manual documentation checks

The CHANGELOG upgrade guide is checked by Pest (`tests/Feature/ChangelogUpgradeTest.php`), and `tests/Feature/DocsTest.php` checks key phrases. Read these by hand as well:

- [ ] README: installation, authentication (cookie auth with CORS and CSRF, token auth with the `Authorization` header, token storage owned by the host, session auth by default), the `local` gate warning, the page and modules (`client_path`, the asset route, `extra.atrium`, the preset, `Atrium::script()`, icon packs). Owner: PR author.
- [ ] CHANGELOG: the upgrade guide lists every removed API with its replacement, the removed config keys, the published-file cleanup, the route changes and the migration step. Owner: PR author.
- [ ] Boost skill (`resources/boost/skills/atrium-development/SKILL.md`) matches the README. Owner: PR author.
- [ ] `CLAUDE.md` (the architecture and frontend sections). Owner: PR author.
- [ ] README "Suite integrations": detection and `enabled`, the API base and the Polycart and Roster APIs behind auth, Pennant flags, the hook keys, the modules' routes, where each module lives, Atrium's `openapi.json` and client, the parity departures, and the Guardian part (its API behind auth, `scope_types`, the two-factor middleware and pages, the deadline header through CORS, token drivers, passkeys and the module's `responseHandlers`). Owner: PR author.
- [ ] CHANGELOG "Suite integrations": every replaced package key, every `// Not ported (D-032)` item in the modules, the parity changes and the packages' own modules (D-089). Owner: PR author.
- [ ] Local standards `atrium/components`, `atrium/domains` and `atrium/integrations` (`docs/agent/standards/atrium/`), and `docs/agent/standards.index.yml` regenerated from them (`vendor/bin/ringside sync`). Owner: PR author.
