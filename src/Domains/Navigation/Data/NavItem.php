<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Data;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Access\Concerns\Gated;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use RefactorCircus\Atrium\Support\ClientPath;
use RefactorCircus\Atrium\Support\Iconify;
use RefactorCircus\Atrium\Support\JsonData;

class NavItem
{
    use Gated;

    public private(set) ?string $url = null;

    /**
     * The SPA path this item links to (`/showroom/products`), when it was
     * declared with `path()`: a page of the layer, below `atrium.client_path`.
     */
    public private(set) ?string $path = null;

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

    /**
     * The layer resolver that computes this item's badge or children from a
     * package API, and the static options it is handed.
     *
     * @var array{key: string, options: array<array-key, mixed>}|null
     */
    public private(set) ?array $live = null;

    /**
     * A live key: the package, a dot, then the resolver (`impex.active-runs`).
     */
    public const string LIVE_KEY_PATTERN = '/^[a-z0-9-]+\.[a-z0-9.-]+$/D';

    final public function __construct(public readonly string $label) {}

    public static function make(string $label): static
    {
        return new static($label);
    }

    /**
     * Link to a URL the host app serves: absolute, or a path from the host's
     * root, which the SPA follows only under `atrium.client_path`.
     */
    public function url(string $url): static
    {
        $this->url = $url;
        $this->route = null;
        $this->path = null;

        return $this;
    }

    /**
     * Link to a page of the SPA (`/showroom/products`), wherever the host
     * serves it: the path is sent as it is, never external, and its host URL
     * is the path under `atrium.client_path` at the time it is resolved.
     *
     * @throws InvalidArgumentException for a path that does not start with one `/`, or holds a backslash, whitespace or control character
     */
    public function path(string $path): static
    {
        $this->path = ClientPath::assertSpaPath($path, "Nav item [{$this->label}]");
        $this->url = null;
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
        $this->path = null;

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

    /**
     * Let the layer compute the badge or children with the resolver it
     * registered under the key (`$atrium.live(key, ...)`), handing it the
     * options. Atrium sends the key and options as they are, so they must
     * be static, JSON-serializable data.
     *
     * @param  array<array-key, mixed>  $options
     *
     * @throws InvalidArgumentException for a key that is not `{package}.{resolver}`
     * @throws UnserializableDataException for options JSON cannot carry
     */
    public function live(string $key, array $options = []): static
    {
        if (preg_match(self::LIVE_KEY_PATTERN, $key) !== 1) {
            throw new InvalidArgumentException("Nav item [{$this->label}] has the live key [{$key}]; it must be {package}.{resolver} and match ^[a-z0-9-]+\\.[a-z0-9.-]+$.");
        }

        $this->live = [
            'key' => $key,
            'options' => JsonData::check($options, "Nav item [{$this->label}] live options"),
        ];

        return $this;
    }

    public function resolveUrl(): ?string
    {
        if ($this->path !== null) {
            return ClientPath::url($this->path);
        }

        if ($this->url !== null) {
            return $this->url;
        }

        if ($this->route === null || ! Route::has($this->route)) {
            return null;
        }

        return route($this->route, $this->routeParameters);
    }

    /**
     * The link the SPA follows: an SPA path as it is, otherwise the resolved
     * URL through ClientPath, or null for none or one ClientPath refuses.
     *
     * @return array{path: string, external: bool}|null
     */
    public function link(): ?array
    {
        if ($this->path !== null) {
            return ['path' => $this->path, 'external' => false];
        }

        return ClientPath::for($this->resolveUrl());
    }

    public function resolveBadge(): string|int|null
    {
        return $this->badge === null ? null : ($this->badge)();
    }

    /**
     * Whether the request is this item's page or a page beneath it: an
     * item on a resource's `*.index` route stays active on the resource's
     * other routes (`*.show`, `*.edit`), and an item with a URL on the paths
     * beneath it - except the site root, which every page is beneath.
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

        return $path !== '' && str_starts_with($current, $path.'/');
    }
}
