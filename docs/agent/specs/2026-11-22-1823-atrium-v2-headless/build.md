# Build log: Atrium v2 headless

## Group 1

Support primitives and config. Criteria 13, 14, 18, 29, 33, 37.

### Files

- `src/Support/JsonData.php`: ported from the spike. `check(array $data, string $owner)` now serializes as it walks (Arrayable through `toArray()`, so a model's `$hidden` applies; JsonSerializable through `jsonSerialize()`) and checks the result, with a cycle guard (object ids on the current path) and `MAX_DEPTH = 64`. New `resolve(string $owner, callable $resolver)`: returns `['data' => ...]`; outside `local`/`testing` a failure is reported and becomes `['data' => null, 'error' => ['message' => '{Kind} failed to load']]`, where `{Kind}` is the owner before ` [` (`Widget [orders]` gives `Widget failed to load`), so the client never sees the key.
- `src/Support/ClientPath.php`: rewritten. The instance (`new ClientPath($appHost, $clientPath)->link($url)`) holds the logic, so it is unit-tested without the framework; `ClientPath::for($url)` builds it from `app.url`'s host and `atrium.client_path` (default `/`). Accepts lower-case `http(s)://` URLs with a host and no userinfo, and root-relative paths. Returns null for everything else: other or mixed-case schemes, `//host`, backslashes, control characters, leading or trailing whitespace, `http:host`, userinfo, bare relative paths, bare `#`/`?`, and any result that would start with `//` once `client_path` is removed. A same-host URL or a path outside `client_path` is returned as given with `external: true`.
- `src/Support/Iconify.php`: `Iconify::PATTERN` (`^i-[a-z0-9]+(-[a-z0-9]+)+$` with the `D` modifier, so a trailing newline fails) and `Iconify::assert($name): string`, which throws `InvalidArgumentException` and truncates a long value (inline SVG) in the message.
- `src/Exceptions/UnserializableDataException.php`: `final`, extends `AtriumException`, status 500, private constructor with readonly `owner` and `path`. `forValue()` gives `Widget [orders] returned unserializable data at [rows.0.cell]: Closure`; `forCycle()` and `forDepth()` name the cycle and the depth limit.
- `config/atrium.php`: new `API Routes` section (`routes.enabled`, `routes.prefix` `atrium/api`, `routes.middleware` `['api', Authorize::class]`, top-level `client_path` `/`), with a banner covering everything AC 18 lists. Removed `path`, `domain`, `middleware`, `alpine` and `logout_route`. `theme` stays. The gate banner now describes the `local` behaviour for authenticated users.
- `src/Atrium.php`: `public const string API_VERSION = '2.0'`.
- `src/AtriumServiceProvider.php`: `boot()` first logs one `warning` per process (a private static flag) naming the removed keys present in `config('atrium')`, in a fixed order, and pointing to `atrium.routes.middleware`.

### Tests

- `tests/Unit/Support/JsonDataTest.php`: every accepted type (scalars, null, arrays, Carbon, CarbonImmutable, DateTimeImmutable, a backed enum, JsonSerializable, Arrayable, Collection, a model with `$hidden`) and rejected type (closure, Htmlable, Htmlable that is also Arrayable, stdClass, a pure enum), the exact message, a bad value inside a collection, final/AtriumException/500, the depth limit at and beyond `MAX_DEPTH`, a by-reference array cycle, a self-containing JsonSerializable, and a shared non-cyclic object.
- `tests/Unit/Support/ClientPathTest.php`: tables for a root and a `/admin` client path, `client_path` normalisation, no app host, 28 rejected forms (every AC 14 bypass), and the `//` left behind after stripping `client_path`.
- `tests/Unit/Support/IconifyTest.php`: valid names, `lucide:home`, inline SVG, `i-home` and other bad forms, and the message.
- `tests/Feature/ConfigTest.php`: the `routes` defaults and `client_path`, the banner grep (prefix, middleware, no-auth note with guard examples, `Authorize` last, `client_path`, CORS/CSRF/`Authorization`, the `local` gate warning), removed keys absent and `theme` kept, `ClientPath::for()` reading `app.url` and `atrium.client_path`, and `Atrium::API_VERSION`.
- `tests/Feature/RemovedConfigKeysTest.php`: `Log::spy()`; one warning naming exactly the present keys after three boots (two of the registered provider, one of a new instance); a key present with a null value counts; no warning without removed keys. The static flag is reset by reflection before and after each test.
- `tests/Feature/JsonDataResolveTest.php` (not in the group's file list): `resolve()` needs the app environment and `report()`, so its AC 33 tests are a feature test: success, a throwing resolver and a failing check isolated and reported in `production`, the kind-only message for `Settings panel [shop]`, and a rethrow with nothing reported in `local` and `testing`.

Pint and PHPStan pass on the changed files. The test suite was not run here, as instructed; the gate runs it.

### Deviations and notes

- Touched `src/Support/ServiceProvider.php` (owned by group 5): with `atrium.middleware` gone from the config, the Blade route group's fallback was `['web']`, which would have dropped `Authorize` from every v1 route until group 5 lands. The fallback is now `['web', Authorize::class]`, so those routes stay fail-closed and the v1 route tests keep passing. Group 5 replaces this method.
- `Iconify::assert()` throws a bare `InvalidArgumentException`, as AC 15 requires, rather than an `AtriumException` subclass (`errors/exceptions`). It is a definition-time programmer error, like the existing `Screen` and `Theme` checks.
- `UnserializableDataException` has `forCycle()` and `forDepth()` beside `forValue()`, since a cycle or a depth overflow has no single bad value to name.
- `UnserializableDataException` renders its message with status 500 (Keystone's `PackageException::render()`), so a lazy widget's failure shows the owner, path and PHP type to the client. That follows the spec; isolation (AC 33) keeps it out of eager payloads in production.

### Retry

- `src/Support/ClientPath.php`: a same-host URL whose path starts with `//` (`https://app.test//evil.test`) now returns null whatever `client_path` is. Before, with a non-root `client_path` it fell outside the client path and came back as an external link, so `ClientPathTest`'s rejected-forms case failed for `/admin`. The root case already returned null.
- The group's test files (`tests/Unit/Support/*`, `ConfigTest`, `RemovedConfigKeysTest`, `JsonDataResolveTest`) pass: 108 tests. Pint and PHPStan pass on the changed file. The full suite was not run here; the gate runs it.
