# Standards for Screen extensions registry

| Standard | File | Source | Why it applies |
| --- | --- | --- | --- |
| architecture/public-api | vendor/refactor-circus/standards/standards/architecture/public-api.md | refactor-circus/standards@dev-main | `ScreenExtensions`, the definitions, `Screen` and the components become public API for every package |
| architecture/container-bindings | vendor/refactor-circus/standards/standards/architecture/container-bindings.md | refactor-circus/standards@dev-main | Singleton registry plus the `scoped()` `ScreenVisibility` memo |
| architecture/dependencies | vendor/refactor-circus/standards/standards/architecture/dependencies.md | refactor-circus/standards@dev-main | Packages link through string screen keys, with no `class_exists()` checks between them |
| architecture/domain-modules | vendor/refactor-circus/standards/standards/architecture/domain-modules.md | refactor-circus/standards@dev-main | New `Domains/Screens` module |
| atrium/components | docs/agent/standards/atrium/components.md | local | New `screen-tabs`, `screen-tab-panel` and `screen-sections` components, token-only |
| atrium/domains | docs/agent/standards/atrium/domains.md | local | Atrium domain layout and provider registration |
| data/value-objects | vendor/refactor-circus/standards/standards/data/value-objects.md | refactor-circus/standards@dev-main | Definitions and `Screen` use `public private(set)` and clone on register |
| http/authorization | vendor/refactor-circus/standards/standards/http/authorization.md | refactor-circus/standards@dev-main | Host authorization first, deny by default, a hidden `?tab=` answers 403 |
| testing/test-layers | vendor/refactor-circus/standards/standards/testing/test-layers.md | refactor-circus/standards@dev-main | Unit, feature and browser layers, including the theme matrix |
| testing/arch-tests | vendor/refactor-circus/standards/standards/testing/arch-tests.md | refactor-circus/standards@dev-main | New classes are final with strict types |
