<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Http\Requests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Http\Resources\ShellResource;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry;
use RefactorCircus\Atrium\Http\Requests\Request;

/**
 * The shell the layer boots with. It reads registries only, so it has no
 * model to authorize: the route group's `viewAtrium` gate decides, and the
 * navigation and panels are filtered for this user.
 */
final class ShowShellRequest extends Request
{
    public function persist(): JsonResponse
    {
        $themes = app(ThemeRegistry::class);
        $name = config('app.name');
        $user = $this->user();
        $perSource = config('atrium.search.results.per_source');

        return new ShellResource([
            'app_name' => is_string($name) ? $name : '',
            'user' => $user instanceof Authenticatable ? $user : null,
            'locale' => app()->getLocale(),
            'api_version' => Atrium::API_VERSION,
            'sections' => array_values(app(NavigationRegistry::class)->sections($this)),
            'themes' => array_values($themes->all()),
            'default_theme' => $themes->default(),
            'switchable' => $themes->switchable($this),
            'panels' => array_values(app(SettingsRegistry::class)->panels($this)),
            'min_length' => app(SearchRegistry::class)->minLength(),
            'per_source' => is_int($perSource) ? $perSource : null,
            'integrations' => $this->integrations(),
        ])->response();
    }

    /**
     * Each registered integration, with its feature flags for this user.
     *
     * @return list<array{integration: RegisteredIntegration, active: bool, features: array<string, bool>}>
     */
    private function integrations(): array
    {
        $features = app(IntegrationFeatures::class);

        return array_values(array_map(function (RegisteredIntegration $integration) use ($features): array {
            $states = $features->states($integration, $this);

            return [
                'integration' => $integration,
                'active' => ! in_array(false, $states, true),
                'features' => $states,
            ];
        }, app(IntegrationRegistry::class)->all()));
    }
}
