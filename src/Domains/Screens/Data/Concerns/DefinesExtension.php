<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data\Concerns;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * What tabs and sections share: a key, a label, a view or a component, the
 * data resolver and who may see it.
 *
 * An extension is hidden unless it says who may see it: a `permission()` the
 * screen's `access` closure grants, an `authorize()` closure answering true
 * (both must pass when it has both), or `public()`. Both closures receive the
 * screen as their last argument; `$record` is the screen's record, or the row
 * inside a row slot.
 */
trait DefinesExtension
{
    /**
     * Goes into `?tab=`, `data-testid` and URLs. Prefix it with a vendor,
     * such as `vendor.key`.
     */
    public private(set) string $key;

    public private(set) string $label;

    public private(set) ?string $view = null;

    public private(set) ?string $component = null;

    public private(set) ?string $permission = null;

    public private(set) bool $public = false;

    /** @var (Closure(?Model, Screen): array<string, mixed>)|null */
    private ?Closure $resolver = null;

    /** @var (Closure(Request, ?Model, Screen): bool)|null */
    private ?Closure $authorize = null;

    public function __construct(string $key)
    {
        if (preg_match(Screen::NAME_PATTERN, $key) !== 1) {
            throw new InvalidArgumentException("Screen extension key [{$key}] must match ".Screen::NAME_PATTERN.'; use lowercase letters, digits, dots, dashes and underscores, such as vendor.key.');
        }

        $this->key = $key;
        $this->label = $key;
    }

    public static function make(string $key): static
    {
        return new static($key);
    }

    public function label(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    /**
     * Render with a Blade view, instead of any component.
     */
    public function view(string $view): static
    {
        $this->view = $view;
        $this->component = null;

        return $this;
    }

    /**
     * Render with a Blade component, instead of any view.
     */
    public function component(string $component): static
    {
        $this->component = $component;
        $this->view = null;

        return $this;
    }

    /**
     * The data the view or component gets. Runs only when the extension
     * renders, after the viewer's access is checked.
     *
     * @param  Closure(?Model, Screen): array<string, mixed>  $resolver
     */
    public function resolve(Closure $resolver): static
    {
        $this->resolver = $resolver;

        return $this;
    }

    /**
     * Show only to viewers the screen's `access` closure grants this
     * permission; a screen without one grants none.
     */
    public function permission(string $permission): static
    {
        $this->permission = $permission;

        return $this;
    }

    /**
     * Show only when the callback answers true. It runs on every screen and
     * row it may appear on, so keep it cheap; one that throws hides the
     * extension and is reported.
     *
     * @param  Closure(Request, ?Model, Screen): bool  $callback
     */
    public function authorize(Closure $callback): static
    {
        $this->authorize = $callback;

        return $this;
    }

    /**
     * Show to anyone who may open the screen.
     */
    public function public(): static
    {
        $this->public = true;

        return $this;
    }

    /**
     * Whether the viewer may see the extension: the permission through the
     * screen's access closure, then the authorize closure. Anything they
     * throw propagates; ScreenVisibility reports it and counts it a denial.
     *
     * @param  (Closure(string, Request, ?Model): bool)|null  $access
     */
    public function allows(Request $request, ?Model $record, Screen $screen, ?Closure $access): bool
    {
        if ($this->permission === null && $this->authorize === null) {
            return $this->public;
        }

        if ($this->permission !== null && ($access === null || $access($this->permission, $request, $record) !== true)) {
            return false;
        }

        return $this->authorize === null || ($this->authorize)($request, $record, $screen) === true;
    }

    /**
     * The resolver's data, or none without a resolver. A resolver returning
     * anything but an array fails with a TypeError.
     *
     * @return array<string, mixed>
     */
    public function resolveData(?Model $record, Screen $screen): array
    {
        return $this->resolver === null ? [] : ($this->resolver)($record, $screen);
    }
}
