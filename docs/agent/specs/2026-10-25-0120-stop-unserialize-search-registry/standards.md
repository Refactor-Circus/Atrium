# Standards for Stop using unserialize in SearchRegistry

| Standard | File | Source | Why it applies |
| --- | --- | --- | --- |
| testing/arch-tests | vendor/refactor-circus/standards/standards/testing/arch-tests.md | refactor-circus/standards@dev-main | `security()` preset runs over `src/` with no `SearchRegistry` exception |
| architecture/service-providers | vendor/refactor-circus/standards/standards/architecture/service-providers.md | refactor-circus/standards@dev-main | New child command registered from `SearchServiceProvider` behind `runningInConsole()` |
| architecture/naming | vendor/refactor-circus/standards/standards/architecture/naming.md | refactor-circus/standards@dev-main | Command and exception class names and placement |
| atrium/domains | docs/agent/standards/atrium/domains.md | local | Command, exceptions and decoding live in the `Search` domain |
| data/value-objects | vendor/refactor-circus/standards/standards/data/value-objects.md | refactor-circus/standards@dev-main | Rebuilding `SearchResult` from an array without widening its API |
| errors/exceptions | vendor/refactor-circus/standards/standards/errors/exceptions.md | refactor-circus/standards@dev-main | Failure and timeout reports become package exceptions, not raw `RuntimeException` |
| testing/test-layers | vendor/refactor-circus/standards/standards/testing/test-layers.md | refactor-circus/standards@dev-main | Round trip through the process driver; command wiring tested on its own |
