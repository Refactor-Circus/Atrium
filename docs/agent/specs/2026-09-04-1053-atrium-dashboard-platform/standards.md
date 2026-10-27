# Standards for Atrium Dashboard Platform

## Agent OS standards

`agent-os/standards/index.yml` exists but contains only its header comment. No standards were defined at shaping time, so none could be applied.

When standards are added later, the ones most likely to govern this work are HTTP/route conventions, database migration patterns, and frontend component conventions.

## Governing conventions in their absence

Package conventions come from `AGENTS.md` and the repository's local skills. These carry the same weight as standards for this spec.

### From `AGENTS.md`

- Use Laravel-native package APIs and the existing service provider shape before adding abstractions.
- Keep package names, namespaces, Composer metadata, publish tags, documentation, and examples aligned with `refactor-circus/atrium`.
- Add only the files and dependencies needed for the behavior being implemented.
- Prefer explicit Laravel package code over helper abstractions unless the extension point is real.
- Keep tests focused on observable behavior through public APIs, provider wiring, commands, routes, published resources, and documentation promises.

### From the `package-scaffold` skill

- Container bindings and `mergeConfigFrom` belong in `register()` so the host app can override configuration.
- Resource loading belongs in `boot()` via `loadRoutesFrom`, `loadViewsFrom`, and `loadTranslationsFrom`.
- Guard `publishes`, `publishesMigrations`, and `commands` with `runningInConsole()`.
- Name publish tags with the `atrium-*` convention so consumers can target individual resource groups.
- Do not call `env()` outside config files.
- Do not replace explicit provider methods with `spatie/laravel-package-tools`.

### From the `package-testing` skill

- Write the smallest failing test first, then the smallest change that passes it.
- Cover happy path, unhappy path, and edge cases where failure modes are meaningful.
- Use focused feature tests for integration behavior and arch tests for broad constraints.
- Iterate with `composer test:unit -- --filter ...`, finish with `composer test`.
- Never delete real tests for convenience.

### Enforced automatically

- `tests/ArchTest.php` requires `declare(strict_types=1)` across `RefactorCircus\Atrium` and forbids `dd()`, `ddd()`, `env()`, and `exit()`.
- `composer test:types` requires 100% type coverage.
- `composer analyse` runs Larastan; `composer lint:check` runs Pint.

### Dependencies

Production dependencies stay at `php: ^8.3` and `illuminate/support: ^12.0||^13.0`. The no-Livewire decision for the component library is a direct consequence: adding Livewire as a hard requirement would change the package's dependency surface and force it on every consumer.
