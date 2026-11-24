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

### Suite integration clients (D-020) and Keystone (D-037)

Each staged module vendors its package's generated client types in `ui/modules/{pkg}/client/` until the module moves into its package (phase 2 of D-082, see `MODULES.md`), where the package's own `client/` replaces it. Do these once every one of Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom has its v2 tag and its own module, in this order:

- [ ] Confirmed Polycart's `.gitattributes` no longer has `/client export-ignore` in the tagged release (and that no other package export-ignores `/client`): a pnpm git install reads the tag's archive, which would otherwise lack the client. Owner: PR author.
- [ ] Removed every staged module (`ui/modules/{pkg}`, D-082) once its package ships the module itself, and with them the vendored `client/` folders, `ui/scripts/sync-clients.mjs`, the `sync:clients` script, `VendoredClientsTest` and the workbench's staged `Atrium::module()` calls; `composer test:ui` passes. Owner: PR author.
- [ ] Widened the `refactor-circus/keystone` constraint in `composer.json` to include the Keystone release that drops its built-in `atrium` surface prefix (D-037), and `composer test` passes against it. Owner: PR author.

### Manual documentation checks

The CHANGELOG upgrade guide is checked by Pest (`tests/Feature/ChangelogUpgradeTest.php`), and `tests/Feature/DocsTest.php` checks key phrases. Read these by hand as well:

- [ ] README: installation, authentication (cookie auth with CORS and CSRF, token auth with the `Authorization` header, token storage owned by the host, session auth by default), the `local` gate warning, the page and modules (`client_path`, the asset route, `extra.atrium`, the preset, `Atrium::script()`, icon packs). Owner: PR author.
- [ ] CHANGELOG: the upgrade guide lists every removed API with its replacement, the removed config keys, the published-file cleanup, the route changes and the migration step. Owner: PR author.
- [ ] Boost skill (`resources/boost/skills/atrium-development/SKILL.md`) matches the README. Owner: PR author.
- [ ] `CLAUDE.md` (the architecture and frontend sections). Owner: PR author.
- [ ] README "Suite integrations": detection and `enabled`, the API base and the Polycart and Roster APIs behind auth, Pennant flags, the hook keys, the modules' routes, the vendored clients, Atrium's `openapi.json` and client, the parity departures, and the Guardian part (its API behind auth, `scope_types`, the two-factor middleware and pages, the deadline header through CORS, token drivers, passkeys and the module's `responseHandlers`). Owner: PR author.
- [ ] CHANGELOG "Suite integrations": every replaced package key, every `// Not ported (D-032)` item in the modules, the parity changes and the D-020 release step. Owner: PR author.
- [ ] Local standards `atrium/components`, `atrium/domains` and `atrium/integrations` (`docs/agent/standards/atrium/`), and `docs/agent/standards.index.yml` regenerated from them (`vendor/bin/ringside sync`). Owner: PR author.
