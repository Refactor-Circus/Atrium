# References for Atrium Dashboard Platform

## Similar implementations in this codebase

None. The package was a fresh skeleton at shaping time. Every source file was placeholder scaffolding:

- `src/Atrium.php` — empty class body
- `src/Console/Commands/AtriumCommand.php` — prints a placeholder line
- `resources/views/placeholder.blade.php` — one placeholder div
- `routes/atrium.php` — entirely commented out
- `config/atrium.php` — a single `placeholder` key
- `database/migrations/2026_01_01_000000_create_atrium_placeholder_table.php` — placeholder table

All of these are replaced by this spec. See the "Files Being Replaced" section of `plan.md`.

## Patterns studied instead

### Existing service provider wiring

- **Location:** `src/AtriumServiceProvider.php`
- **Relevance:** The publish-tag layout and console guard are already correct and should be extended, not rewritten.
- **Key patterns:** `mergeConfigFrom` in `register()`; `loadRoutesFrom`, `loadViewsFrom`, and `loadTranslationsFrom` in `boot()`; a single `runningInConsole()` guard wrapping all `publishes`, `publishesMigrations`, and `commands` calls; publish tags paired as `['atrium', 'atrium-<resource>']` so consumers can publish everything or one group.

### Test harness

- **Location:** `tests/TestCase.php`, `tests/Pest.php`, `tests/ArchTest.php`
- **Relevance:** All new tests inherit this setup; no per-test provider registration is needed.
- **Key patterns:** `TestCase` extends Orchestra Testbench and registers `AtriumServiceProvider` via `getPackageProviders()`. `Pest.php` applies that case to every test under `tests/`. `ArchTest.php` enforces strict types and the banned-function list package-wide, which means every new source file must declare strict types or the suite fails.

### Workbench

- **Location:** `testbench.yaml`, `workbench/`
- **Relevance:** This is where the demo plugin in Task 12 lives, and how the dashboard gets exercised end-to-end via `composer serve`.
- **Key patterns:** `workbench.discovers` currently enables web, api, commands, and factories but disables `views` and `components`. Both likely need enabling for the demo plugin to render. The build pipeline already runs `asset-publish`, `create-sqlite-db`, `db-wipe`, and `migrate-fresh`, so the dashboard migrations will apply automatically on `composer build`.
- **Note:** `WorkbenchServiceProvider` is registered but commented out in `testbench.yaml`. Task 12 needs to uncomment it for the demo plugin to load.

### Local skills

- **Location:** `.agents/skills/package-scaffold/SKILL.md`, `.agents/skills/package-testing/SKILL.md`
- **Relevance:** These define the repository's conventions in the absence of Agent OS standards.
- **Key patterns:** Captured in `standards.md`.

## External prior art

Laravel Nova is the reference point, studied as a counterexample rather than a model. Its plugin/tool system is the part worth borrowing: a package declares a tool class, and it appears in the sidebar. Its resource/field abstraction is the part being deliberately rejected, because it forces every screen through one layout.
