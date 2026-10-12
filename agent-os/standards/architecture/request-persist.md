# Requests & Controllers

Controllers are thin. Each request action is a FormRequest that owns validation and authorization, and exposes the work through `persist()`.

## Base

- Requests extend `RefactorCircus\Atrium\Http\Requests\Request` and live in their domain's `Http/Requests/` (controllers in `Http/Controllers/`). The base declares `abstract public function persist(): Response`.
- `authorize()` defaults to `true`; every concrete request overrides it with a policy check. `rules()` defaults to `[]`.

> Why abstract `persist()`: the compiler forces every request to own its work, so controllers cannot drift into holding logic, and every controller collapses to the same shape.

## Controller — pass through to persist()

```php
public function store(StoreDashboardRequest $request): RedirectResponse
{
    return $request->persist();
}
```

## Request — validate, authorize, act

```php
class StoreDashboardRequest extends Request
{
    public function rules(): array
    {
        return CreateDashboardData::rules();
    }

    public function persist(): RedirectResponse
    {
        $dashboard = app(CreateDashboardAction::class)->execute(
            CreateDashboardData::fromValidated($this->validated()),
            app(DashboardManager::class)->owner($this),
        );

        return redirect()->route('atrium.dashboard.show', $dashboard->slug);
    }
}
```

## Rules

- Naming: `Index`, `Store`, `Show`, `Update`, `Delete` + `{Entity}Request`.
- `persist()` calls an Action via `app(XAction::class)->execute(...)`, passing `XData::fromValidated($this->validated())` and/or the route-bound model. `rules()` returns `XData::rules()`, so input is validated once; never call `XData::from()` in a request (ArchTest). **Never put database writes in a controller.**
- Read-only requests omit `rules()`; the base defaults it to `[]`.
- Authorize in `authorize()`, not in the controller, through the policies in `atrium.policies`: `$this->allows('create', DashboardModel::class)`, `$this->allows('update', $this->dashboard())`, `$this->allowsEach('delete', $placements)`. The route middleware's gate still runs first.
- Route-bound models are resolved in a `protected` helper that aborts 404 when the binding is missing, so both `authorize()` and `persist()` share one resolution path.

Two tests enforce this: one asserts every request declares its own `persist()`, and one asserts no controller contains database calls.
