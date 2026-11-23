<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Data;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Access\Concerns\Gated;
use RefactorCircus\Atrium\Support\Iconify;

class NavItem
{
    use Gated;

    public private(set) ?string $url = null;

    /** The route name this item points at, when it was built from a route. */
    public private(set) ?string $route = null;

    /** @var array<string, mixed> */
    private array $routeParameters = [];

    /** An Iconify name, such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    public private(set) ?string $group = null;

    public private(set) int $sort = 100;

    /** @var (Closure(): (string|int|null))|null */
    private ?Closure $badge = null;

    /** @var array<int, NavItem> */
    public private(set) array $children = [];

    final public function __construct(public readonly string $label) {}

    public static function make(string $label): static
    {
        return new static($label);
    }

    public function url(string $url): static
    {
        $this->url = $url;
        $this->route = null;

        return $this;
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    public function route(string $name, array $parameters = []): static
    {
        $this->route = $name;
        $this->routeParameters = $parameters;
        $this->url = null;

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

    public function group(string $group): static
    {
        $this->group = $group;

        return $this;
    }

    public function sort(int $sort): static
    {
        $this->sort = $sort;

        return $this;
    }

    /**
     * @param  Closure(): (string|int|null)  $badge
     */
    public function badge(Closure $badge): static
    {
        $this->badge = $badge;

        return $this;
    }

    /**
     * @param  array<int, NavItem>  $children
     */
    public function children(array $children): static
    {
        $this->children = $children;

        return $this;
    }

    public function resolveUrl(): ?string
    {
        if ($this->url !== null) {
            return $this->url;
        }

        if ($this->route === null || ! Route::has($this->route)) {
            return null;
        }

        return route($this->route, $this->routeParameters);
    }

    public function resolveBadge(): string|int|null
    {
        return $this->badge === null ? null : ($this->badge)();
    }

    /**
     * Whether the request is this item's page or a page beneath it: an
     * item on a resource's `*.index` route stays active on the resource's
     * other routes (`*.show`, `*.edit`), and an item with a URL on the paths
     * beneath it - except the dashboard root, which every page is beneath.
     */
    public function isActive(Request $request): bool
    {
        if ($this->route !== null && $request->route() !== null) {
            $current = $request->route()->getName();

            if ($current !== null && ($current === $this->route || Str::is($this->route.'.*', $current))) {
                return true;
            }

            if ($current !== null && str_ends_with($this->route, '.index') && str_starts_with($current, Str::beforeLast($this->route, '.index').'.')) {
                return true;
            }
        }

        $url = $this->resolveUrl();

        if ($url === null) {
            return false;
        }

        // Compare paths rather than full URLs, so relative URLs match and a
        // scheme or host rewritten by a proxy does not hide the active item.
        $host = parse_url($url, PHP_URL_HOST);
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || ($host !== null && $host !== $request->getHost())) {
            return false;
        }

        $path = trim($path, '/');
        $current = trim($request->getPathInfo(), '/');

        if ($path === $current) {
            return true;
        }

        $root = trim((string) config('atrium.path', 'atrium'), '/');

        return $path !== '' && $path !== $root && str_starts_with($current, $path.'/');
    }
}
