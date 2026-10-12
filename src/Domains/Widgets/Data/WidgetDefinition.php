<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Data;

use Closure;
use Illuminate\Http\Request;

/**
 * A widget type a plugin makes available.
 *
 * Registering a definition only offers the widget in the picker. It never
 * places the widget on a dashboard; that is always a user action.
 *
 * Every property is publicly readable but only writable from inside the class,
 * so a definition is configured through its fluent setters and cannot be
 * mutated from the outside once built.
 */
class WidgetDefinition
{
    public private(set) string $label;

    public private(set) ?string $description = null;

    public private(set) ?string $icon = null;

    public private(set) ?string $view = null;

    public private(set) ?string $component = null;

    public private(set) int $defaultWidth = 4;

    public private(set) int $defaultHeight = 2;

    public private(set) int $minWidth = 1;

    public private(set) int $minHeight = 1;

    public private(set) bool $lazy = false;

    /** @var (Closure(array<string, mixed>): array<string, mixed>)|null */
    private ?Closure $resolver = null;

    /** @var (Closure(Request): bool)|null */
    private ?Closure $authorize = null;

    final public function __construct(public readonly string $key)
    {
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

    public function description(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function icon(string $icon): static
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * Render the widget with a Blade view.
     */
    public function view(string $view): static
    {
        $this->view = $view;
        $this->component = null;

        return $this;
    }

    /**
     * Render the widget with a Blade or Livewire component.
     */
    public function component(string $component): static
    {
        $this->component = $component;
        $this->view = null;

        return $this;
    }

    public function defaultSize(int $width, int $height): static
    {
        $this->defaultWidth = $width;
        $this->defaultHeight = $height;

        return $this;
    }

    public function minSize(int $width, int $height): static
    {
        $this->minWidth = $width;
        $this->minHeight = $height;

        return $this;
    }

    /**
     * Render a placeholder with the page and fetch the widget's body
     * afterwards, so a slow widget does not hold up the dashboard. The body
     * arrives as HTML: Alpine in it starts, but its scripts do not run and
     * Livewire components in it are not booted, so keep lazy widgets to
     * plain Blade.
     */
    public function lazy(bool $lazy = true): static
    {
        $this->lazy = $lazy;

        return $this;
    }

    /**
     * Resolve the data passed to the view or component when rendering.
     *
     * @param  Closure(array<string, mixed>): array<string, mixed>  $resolver
     */
    public function resolve(Closure $resolver): static
    {
        $this->resolver = $resolver;

        return $this;
    }

    /**
     * @param  Closure(Request): bool  $callback
     */
    public function authorize(Closure $callback): static
    {
        $this->authorize = $callback;

        return $this;
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    public function resolveData(array $settings = []): array
    {
        return $this->resolver === null ? [] : ($this->resolver)($settings);
    }

    public function isAuthorized(Request $request): bool
    {
        return $this->authorize === null || ($this->authorize)($request) === true;
    }
}
