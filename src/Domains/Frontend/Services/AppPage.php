<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Services;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Domains\Frontend\Data\ModuleManifest;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Support\ClientPath;

/**
 * What the Blade page (`atrium::app`, D-079) renders for a request: the
 * boot data the front end reads, the import map of the shared modules, and
 * the scripts and stylesheets, Atrium's and every module's the user gets.
 */
final class AppPage
{
    public function __construct(
        private readonly Repository $config,
        private readonly FrontendAssets $assets,
        private readonly ModuleRegistry $modules,
        private readonly IntegrationRegistry $integrations,
        private readonly IntegrationFeatures $features,
    ) {}

    /**
     * @return array{
     *     title: string,
     *     boot: array<string, mixed>,
     *     imports: array<string, string>,
     *     styles: list<string>,
     *     scripts: list<string>,
     *     entry: string,
     *     theme: string,
     * }
     */
    public function data(Request $request): array
    {
        $build = $this->assets->atrium();
        $modules = $this->modules->forRequest($request, $build->sharedApi());
        $urls = array_map($this->assets->moduleUrls(...), $modules);

        return [
            'title' => $this->appName(),
            'boot' => $this->boot($request, $modules, $urls),
            'imports' => array_map($this->assets->atriumUrl(...), $build->imports()),
            'styles' => [
                ...array_map($this->assets->atriumUrl(...), $build->entryStyles()),
                ...array_merge(...array_column($urls, 'styles') ?: [[]]),
            ],
            'scripts' => array_merge(...array_column($urls, 'scripts') ?: [[]]),
            'entry' => $this->assets->atriumUrl($build->entryScript()),
            'theme' => $this->defaultTheme(),
        ];
    }

    /**
     * The JSON the front end boots from (`useAtriumBoot()`).
     *
     * @param  list<ModuleManifest>  $modules
     * @param  list<array{scripts: list<string>, styles: list<string>}>  $urls
     * @return array<string, mixed>
     */
    private function boot(Request $request, array $modules, array $urls): array
    {
        $user = $request->user();
        $prefix = $this->config->get('atrium.routes.prefix', 'atrium/api');
        $known = $this->config->get('atrium.integrations', []);
        $integrations = [];

        foreach ($this->integrations->all() as $key => $integration) {
            $integrations[$key] = [
                'api_base' => str_starts_with($integration->apiBase, 'http') ? $integration->apiBase : url($integration->apiBase),
                'active' => $this->features->active($integration, $request),
            ];
        }

        return [
            'version' => Atrium::API_VERSION,
            'api_base' => url(is_string($prefix) ? trim($prefix, '/') : 'atrium/api'),
            'client_path' => ClientPath::url('/') === '/' ? '/' : rtrim(ClientPath::url('/'), '/'),
            'locale' => app()->getLocale(),
            'csrf_token' => $request->hasSession() ? $request->session()->token() : null,
            'user' => $user === null ? null : [
                'id' => $user->getAuthIdentifier(),
                'name' => $this->attribute($user, 'name'),
                'email' => $this->attribute($user, 'email'),
            ],
            'theme' => $this->defaultTheme(),
            'integrations' => (object) $integrations,
            'known_integrations' => is_array($known) ? array_values(array_filter(array_keys($known), is_string(...))) : [],
            'modules' => array_map(fn (ModuleManifest $module, array $url): array => [
                'key' => $module->key,
                'integration' => is_array($known) && array_key_exists($module->key, $known) ? $module->key : null,
                'scripts' => $url['scripts'],
                'styles' => $url['styles'],
            ], $modules, $urls),
            'icons' => ['remote' => (bool) $this->config->get('atrium.icons.remote', false)],
        ];
    }

    private function attribute(object $user, string $name): ?string
    {
        $value = method_exists($user, 'getAttribute') ? $user->getAttribute($name) : ($user->{$name} ?? null);

        return is_scalar($value) ? (string) $value : null;
    }

    private function appName(): string
    {
        $name = $this->config->get('app.name');

        return is_string($name) && $name !== '' ? $name : 'Atrium';
    }

    private function defaultTheme(): string
    {
        $theme = $this->config->get('atrium.themes.default', 'atrium');

        return is_string($theme) && $theme !== '' ? $theme : 'atrium';
    }
}
