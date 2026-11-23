<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use Closure;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Laravel\Pennant\Feature;
use Laravel\Pennant\FeatureManager;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;

/**
 * Whether a registered integration is active for a request: every feature
 * in its `atrium.integrations.{pkg}.features` list must be on.
 *
 * With Laravel Pennant available, each feature resolves through
 * `Feature::for($request->user())->active($name)`, so a host turns an
 * integration off globally or per user with Pennant. Without Pennant every
 * flag is on. Atrium never requires Pennant: this is the one class that
 * names it, behind the availability check.
 *
 * This is separate from the plugin feature gate (`Gatekeeper`), which keeps
 * its host-supplied resolver.
 */
final class IntegrationFeatures
{
    /** @var (Closure(): bool)|null */
    private ?Closure $availability = null;

    public function __construct(private readonly Container $app) {}

    /**
     * Decide whether Pennant is available with the callback instead of
     * looking for it; null looks again.
     *
     * @param  (Closure(): bool)|null  $callback
     */
    public function detectPennantUsing(?Closure $callback): static
    {
        $this->availability = $callback;

        return $this;
    }

    /**
     * Whether Laravel Pennant is installed and its provider registered.
     */
    public function pennantAvailable(): bool
    {
        if ($this->availability !== null) {
            return ($this->availability)() === true;
        }

        return class_exists(FeatureManager::class) && $this->app->bound(FeatureManager::class);
    }

    /**
     * Each of the integration's features, on or off for the request.
     *
     * @return array<string, bool>
     */
    public function states(RegisteredIntegration $integration, Request $request): array
    {
        $pennant = $this->pennantAvailable();
        $states = [];

        foreach ($integration->features as $feature) {
            $states[$feature] = ! $pennant || Feature::for($request->user())->active($feature);
        }

        return $states;
    }

    public function active(RegisteredIntegration $integration, Request $request): bool
    {
        return ! in_array(false, $this->states($integration, $request), true);
    }
}
