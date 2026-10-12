# Actions & Events

Actions hold mutating business logic; each announces with an event pair when it starts and, once the data is committed, when it finished.

Adapted from the `mono` standard of the same name, minus its Pennant feature-gating tier: Atrium is a package and cannot require Pennant of its consumers.

## Base class — `execute()` is the entry point, `handle()` does the work

- Actions extend `RefactorCircus\Keystone\Actions\Action` and live in their domain's `Actions/` (`RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction`); see [[domain-modules]].
- `Action::execute(mixed ...$args)` delegates to your **`protected handle(...)`**. You implement `handle()`, callers call `execute()`.
- Never make `handle()` public — one entry point keeps a place to add cross-cutting behavior later.
- No static constructors (`::run()`/`::make()`). Resolve and invoke via `app(XAction::class)->execute(...)`.
- Input is a `final readonly` `{Action}Data` in the domain's `Data/` (on `RefactorCircus\Keystone\Data\Data`), never an array: promoted constructor properties named in camelCase of the input keys, `T|Missing = new Missing` for partial updates, and `rules()` on the Data. `tests/ArchTest.php` rejects array input on `handle()`.

```php
class CreateDashboardAction extends Action
{
    protected function handle(CreateDashboardData $data, ?Model $owner = null): DashboardModel
    {
        DashboardCreatingActionEvent::dispatch($data, $owner);

        $dashboard = $this->perform($data, $owner);

        DashboardCreatedActionEvent::dispatch($dashboard);

        return $dashboard;
    }

    private function perform(CreateDashboardData $data, ?Model $owner): DashboardModel
    {
        return DB::transaction(fn (): DashboardModel => DashboardModel::query()->create([...]));
    }
}
```

## handle() signatures

- **Always a concrete return type — never `mixed`.** Create/update returns the model; delete returns `void`; index returns a paginator or collection.
- Bound models arrive as `handle()` parameters; array payloads carry array-shape PHPDoc (`@param array{...} $data`).
- **Read actions have no transaction and no events** — they query and return.

## Transactions & events

- `handle()` dispatches the **starting** event with the input, calls a private `perform()`, dispatches the **finished** event with the result, and returns it.
- Wrap every **mutating** `perform()` body in `DB::transaction()`. `tests/ArchTest.php` flags an action that writes without one (Keystone's `Arch::writesOutsideTransactions()`).
- Finished events implement `ActionFinishedEvent`, which extends `ShouldDispatchAfterCommit`, so they wait for the outermost transaction to commit and never fire on rollback. An action that throws fires its starting event and no finished event.
- When a caller needs post-commit column values, `return $model->refresh();` **outside** the transaction.

## Dependency injection

- **Do not constructor-inject the model** — pass it through `handle()` arguments. Constructor promotion is for injected services only.

## Event

- `final` classes in the domain's `Events/` (beside its model lifecycle events) using `Dispatchable` and `SerializesModels`; no base class.
- A plain data carrier using constructor property promotion; it may carry more than one value.
- Every action has exactly one pair: `{Subject}{Verb-ing}ActionEvent` implementing `RefactorCircus\Keystone\Contracts\ActionStartingEvent` (carries the input) and `{Subject}{Verb-ed}ActionEvent` implementing `RefactorCircus\Keystone\Contracts\ActionFinishedEvent` (carries the result) — `DashboardLayoutSavingActionEvent` / `DashboardLayoutSavedActionEvent`. A test enforces the pairing.

These are distinct from model **lifecycle events**. Default to ActionEvents for business logic; see [[lifecycle-events]].
