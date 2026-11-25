# Standards for Atrium v2 headless

| Standard | File | Source | Why it applies |
| --- | --- | --- | --- |
| architecture/configuration | vendor/refactor-circus/standards/standards/architecture/configuration.md | refactor-circus/standards@dev-main | New `routes` banner with the auth-middleware note; Blade keys removed |
| architecture/domain-modules | vendor/refactor-circus/standards/standards/architecture/domain-modules.md | refactor-circus/standards@dev-main | Resources beside models, Http/Resources per domain, `routes.php` per domain |
| architecture/dependencies | vendor/refactor-circus/standards/standards/architecture/dependencies.md | refactor-circus/standards@dev-main | Atrium still requires only Keystone; the layer knows no sibling package |
| architecture/public-api | vendor/refactor-circus/standards/standards/architecture/public-api.md | refactor-circus/standards@dev-main | Facade loses `css()`/`stylesheet()`; contracts lose `view()` |
| architecture/naming | vendor/refactor-circus/standards/standards/architecture/naming.md | refactor-circus/standards@dev-main | `{Entity}Resource`, `{Verb}{Entity}Request`, `{Reason}Exception` |
| http/authorization | vendor/refactor-circus/standards/standards/http/authorization.md | refactor-circus/standards@dev-main | Gate first in the API group; 401 vs 403 with host-supplied auth |
| http/request-persist | vendor/refactor-circus/standards/standards/http/request-persist.md | refactor-circus/standards@dev-main | Mutating requests' `persist()` call actions and return resources |
| http/resources | vendor/refactor-circus/standards/standards/http/resources.md | refactor-circus/standards@dev-main | Every payload is a final resource; slug not id; no request conditionals |
| http/routes | vendor/refactor-circus/standards/standards/http/routes.md | refactor-circus/standards@dev-main | One API group from config, `atrium.*` names, slug binding, scoped bindings |
| models/stored-identifiers | vendor/refactor-circus/standards/standards/models/stored-identifiers.md | refactor-circus/standards@dev-main | Dashboards by slug, placements by uuid, never internal ids |
| errors/exceptions | vendor/refactor-circus/standards/standards/errors/exceptions.md | refactor-circus/standards@dev-main | `UnserializableDataException` joins the `AtriumException` hierarchy |
| data/value-objects | vendor/refactor-circus/standards/standards/data/value-objects.md | refactor-circus/standards@dev-main | Definitions change `component`/`icon` state; `view` removed |
| testing/arch-tests | vendor/refactor-circus/standards/standards/testing/arch-tests.md | refactor-circus/standards@dev-main | ArchTest bans Blade/`view()` in `src/` |
| testing/test-layers | vendor/refactor-circus/standards/standards/testing/test-layers.md | refactor-circus/standards@dev-main | API tests check wiring by route name; behavior stays at the actions |
| atrium/components | docs/agent/standards/atrium/components.md | local | Rewritten: Vue components in `nuxt/layer`, registered by key |
| atrium/domains | docs/agent/standards/atrium/domains.md | local | Rewritten: domains load `routes.php` through the API group |
