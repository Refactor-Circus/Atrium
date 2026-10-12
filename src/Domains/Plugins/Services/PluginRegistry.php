<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Services;

use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin as PluginContract;
use RefactorCircus\Atrium\Domains\Plugins\Exceptions\InvalidPluginException;
use WeakMap;

class PluginRegistry
{
    /** @var array<string, PluginContract> */
    protected array $plugins = [];

    /** @var array<int, string> */
    protected array $disabled = [];

    /**
     * authorized() answers per request: navigation, search, settings and
     * widgets all ask during one page. Keyed weakly on the request, so an
     * answer goes when its request does (and never outlives it under Octane),
     * and kept with the user it was decided for, so signing in or out
     * mid-request decides again.
     *
     * @var WeakMap<Request, array{user: mixed, plugins: array<string, PluginContract>}>
     */
    private WeakMap $authorized;

    public function __construct(protected Container $container)
    {
        $this->authorized = new WeakMap;
    }

    /**
     * Keys the host app has disabled in config.
     *
     * @param  array<int, string>  $keys
     */
    public function disable(array $keys): static
    {
        $this->disabled = $keys;
        $this->authorized = new WeakMap;

        return $this;
    }

    /**
     * @param  PluginContract|class-string  $plugin
     */
    public function register(PluginContract|string $plugin): static
    {
        $instance = $this->resolve($plugin);

        $key = $instance->key();

        if (in_array($key, $this->disabled, true)) {
            return $this;
        }

        if (isset($this->plugins[$key]) && $instance::class !== $this->plugins[$key]::class) {
            throw InvalidPluginException::duplicateKey(
                $key,
                $this->plugins[$key]::class,
                $instance::class,
            );
        }

        $this->plugins[$key] = $instance;
        $this->authorized = new WeakMap;

        return $this;
    }

    /**
     * @param  array<int, PluginContract|class-string>  $plugins
     */
    public function registerMany(array $plugins): static
    {
        foreach ($plugins as $plugin) {
            $this->register($plugin);
        }

        return $this;
    }

    public function has(string $key): bool
    {
        return isset($this->plugins[$key]);
    }

    public function get(string $key): ?PluginContract
    {
        return $this->plugins[$key] ?? null;
    }

    /**
     * Every registered plugin, regardless of authorization.
     *
     * @return array<string, PluginContract>
     */
    public function all(): array
    {
        return $this->plugins;
    }

    /**
     * Plugins the given request is authorized to see: every feature the
     * plugin requires is on, and its authorize() passes.
     *
     * @return array<string, PluginContract>
     */
    public function authorized(Request $request): array
    {
        $user = $request->user();

        if (isset($this->authorized[$request]) && $this->authorized[$request]['user'] === $user) {
            return $this->authorized[$request]['plugins'];
        }

        $gatekeeper = $this->container->make(Gatekeeper::class);

        $plugins = array_filter(
            $this->plugins,
            fn (PluginContract $plugin): bool => array_all(
                $plugin->features(),
                fn (string $feature): bool => $gatekeeper->enabled($feature, $request),
            ) && $plugin->authorize($request),
        );

        $this->authorized[$request] = ['user' => $user, 'plugins' => $plugins];

        return $plugins;
    }

    /**
     * @param  PluginContract|class-string  $plugin
     */
    protected function resolve(PluginContract|string $plugin): PluginContract
    {
        if ($plugin instanceof PluginContract) {
            return $plugin;
        }

        if (! class_exists($plugin)) {
            throw InvalidPluginException::missingClass($plugin);
        }

        if (! is_subclass_of($plugin, PluginContract::class)) {
            throw InvalidPluginException::notAPlugin($plugin);
        }

        /** @var PluginContract */
        return $this->container->make($plugin);
    }
}
