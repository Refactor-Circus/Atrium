# References

- **`src/Domains/Search/Services/SearchRegistry.php:190-273`** (`runInProcesses()`, `decode()`) — the code being changed. Borrow: per-process timeout loop, the JSON envelope check, gzip-tail stripping, and the failure report wording.
- **`vendor/laravel/framework/src/Illuminate/Concurrency/Console/InvokeSerializedClosureCommand.php`** — per D-003 the Atrium command calls this in-process (`Artisan::call('invoke-serialized-closure', ...)`) so the framework does the `unserialize`; the wrapper closure hands results back as arrays and the Atrium command writes the JSON. Borrow: hidden command, `LARAVEL_INVOKABLE_CLOSURE` env var, `successful`/`message` envelope and exception reporting.
- **`src/Domains/Search/Data/SearchSource.php:97-120`** — hand-written `__serialize`/`__unserialize` wrapping closures in `SerializableClosure`; pattern for moving closures across processes.
- **`src/Domains/Search/Data/SearchResult.php`** — `toArray()` already emits every field; rebuilding is `make()` plus the fluent setters for non-null optionals.
- **`src/Console/Commands/InstallCommand.php`** — existing Atrium command, for registration and naming.
- **`tests/Feature/SearchTest.php`** — process-driver tests (`useProcessDriver()`, `pidSources()`, timeouts, concurrency limit) to extend with the round-trip cases.
- **`tests/ArchTest.php:16-18`** — the `security()->ignoring(SearchRegistry::class)` exception to remove.
