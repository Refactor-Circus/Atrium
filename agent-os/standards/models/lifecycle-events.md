# Model Lifecycle Events

Every Atrium model maps its Eloquent hooks to typed event classes via `$dispatchesEvents`, separate from the package's domain action events (see [[actions-events]]).

## Convention

- Every model `use DispatchesModelEvents;` (`RefactorCircus\Keystone\Models\Concerns`). Models live in `Domains\{Domain}\Models` and are named `{Entity}Model`; the trait maps each Eloquent hook to `Domains\{Domain}\Events\{Entity}{Hook}Event` (`DashboardWidgetModel` → `DashboardWidgetCreatingEvent`) by convention and skips hooks with no class, so no `$dispatchesEvents` array is written by hand. A subclass of a package model fires the package model's events.
- Each event is a `final` class using `Dispatchable` and `SerializesModels`, implementing `RefactorCircus\Keystone\Contracts\ModelLifecycleEvent` (`model()`, `hook()`), with the model as a typed public property (`$dashboard`, `$widget`). They fire synchronously, not after commit, so a `creating`/`saving`/... listener can cancel the write.
- Cover the full lifecycle the model actually has. Atrium's models do not use soft deletes, so they have no `restoring`, `restored`, `trashed`, `forceDeleting`, or `forceDeleted` classes; a model that adds soft deletes must add those five.
- A test listens on `ModelLifecycleEvent` and asserts every hook fires for each model, so a missing class fails the suite rather than silently going unheard. `tests/ArchTest.php` also checks every model for a class per hook with Keystone's `Arch::modelEventGaps()`.

## Lifecycle vs domain ActionEvents

| | Model lifecycle events | Domain `*ActionEvent` |
|---|---|---|
| Fires | automatically on every database operation | explicitly from an Action |
| Carries | the model only | model plus business context |
| Listen for | data concerns (audit, computed fields, cascades) | business side effects (notifications, integrations) |

Default to **ActionEvents** for business logic; reach for lifecycle events only for data-level concerns.

## Why this matters for a package

Atrium's models live in someone else's application. Lifecycle events give host applications and plugins a supported way to observe dashboard data without patching the model or overriding the package's classes.
