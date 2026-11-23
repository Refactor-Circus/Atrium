## Summary

<!-- What changes, and why. Link the spec or issue. -->

## Checks

- [ ] `composer test` passes (PHPStan, Pint, type coverage, Pest).
- [ ] `composer test:nuxt` passes, if anything under `nuxt/`, the API's payloads or the contract fixtures changed.
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

- [ ] The repository's tag ruleset protects `v*` tags (no update, no deletion, no force push) before the release tag is pushed: hosts extend `nuxt/layer` from the tag with giget, and Composer resolves the same tag. Owner: PR author.
- [ ] After publishing the release, the Update Changelog workflow did not add a second heading for a version the CHANGELOG already has. Owner: PR author.

### Manual documentation checks

The CHANGELOG upgrade guide is checked by Pest (`tests/Feature/ChangelogUpgradeTest.php`), and `tests/Feature/DocsTest.php` checks key phrases. Read these by hand as well:

- [ ] README: installation, authentication (cookie auth with CORS and CSRF, token auth with the `Authorization` header, token storage owned by the host, the workbench guard never in production), the `local` gate warning, the Nuxt layer (`extends`, `GIGET_AUTH`, SHA pinning, `client_path`, icon packs). Owner: PR author.
- [ ] CHANGELOG: the upgrade guide lists every removed API with its replacement, the removed config keys, the published-file cleanup, the route changes and the migration step. Owner: PR author.
- [ ] Boost skill (`resources/boost/skills/atrium-development/SKILL.md`) matches the README. Owner: PR author.
- [ ] `CLAUDE.md` (the architecture and frontend sections). Owner: PR author.
- [ ] Local standards `atrium/components` and `atrium/domains` (`docs/agent/standards/atrium/`), and `docs/agent/standards.index.yml` regenerated from them (`vendor/bin/ringside sync`). Owner: PR author.
