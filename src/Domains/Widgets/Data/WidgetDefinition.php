<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Data;

use Closure;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Support\Iconify;

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

    /** An Iconify name, such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    /**
     * The key the client renders the widget with: the component registered
     * for it in the layer's `$atrium.widget()`. The definition key by default.
     */
    public private(set) string $component;

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
        $this->component = $key;
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

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-home`
     */
    public function icon(string $icon): static
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }

    /**
     * Render the widget with the client component registered under this key,
     * instead of the definition key.
     */
    public function component(string $component): static
    {
        $this->component = $component;

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
     * Send the widget without its data and let the client fetch the data
     * afterwards, so a slow widget does not hold up the dashboard.
     */
    public function lazy(bool $lazy = true): static
    {
        $this->lazy = $lazy;

        return $this;
    }

    /**
     * Resolve the data sent to the widget's component.
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
