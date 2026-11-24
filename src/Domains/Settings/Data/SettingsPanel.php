<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Data;

use Closure;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Support\Iconify;

class SettingsPanel
{
    public private(set) string $label;

    public private(set) ?string $description = null;

    /** An Iconify name, such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    /**
     * The key the client renders the panel with: the component registered
     * for it in the front end's `defineAtriumModule({ settingsPanels }) ()`. The panel key by default.
     */
    public private(set) string $component;

    public private(set) int $sort = 100;

    /** @var (Closure(): array<string, mixed>)|null */
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
     * Render the panel with the client component registered under this key,
     * instead of the panel key.
     */
    public function component(string $component): static
    {
        $this->component = $component;

        return $this;
    }

    public function sort(int $sort): static
    {
        $this->sort = $sort;

        return $this;
    }

    /**
     * @param  Closure(): array<string, mixed>  $resolver
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
     * @return array<string, mixed>
     */
    public function resolveData(): array
    {
        return $this->resolver === null ? [] : ($this->resolver)();
    }

    public function isAuthorized(Request $request): bool
    {
        return $this->authorize === null || ($this->authorize)($request) === true;
    }
}
