<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Http\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavSection;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Support\ClientPath;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * Everything the layer's chrome needs, in one request on boot: the app, the
 * signed-in user, the locale and API version, the navigation this user may
 * see, the themes, the settings panel summaries and the search box's minimum
 * query length.
 *
 * Which navigation item is active is the layer's to work out from its own
 * route, so it is not sent. Every link goes out as ClientPath's
 * `{path, external}`, or null for a URL ClientPath refuses. An item the
 * layer completes from a package API carries its `live` resolver key.
 *
 * `integrations` lists every registered suite integration, in key order,
 * with whether it is active for this user and each of its feature flags;
 * `search.sources` the search sources of the active ones, which the layer
 * runs beside `atrium.search`, each capped at `search.per_source` results.
 *
 * @phpstan-type IntegrationState array{
 *     integration: RegisteredIntegration,
 *     active: bool,
 *     features: array<string, bool>,
 * }
 * @phpstan-type ShellData array{
 *     app_name: string,
 *     user: Authenticatable|null,
 *     locale: string,
 *     api_version: string,
 *     sections: list<NavSection>,
 *     themes: list<Theme>,
 *     default_theme: Theme|null,
 *     switchable: bool,
 *     panels: list<SettingsPanel>,
 *     min_length: int,
 *     per_source: int|null,
 *     integrations: list<IntegrationState>,
 * }
 *
 * @property ShellData $resource
 */
final class ShellResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $shell = $this->resource;

        return [
            'app' => [
                'name' => $shell['app_name'],
            ],
            'user' => $this->user($shell['user']),
            'locale' => $shell['locale'],
            'api_version' => $shell['api_version'],
            'navigation' => array_map($this->section(...), $shell['sections']),
            'themes' => [
                'default' => $shell['default_theme']?->key,
                'switchable' => $shell['switchable'],
                'all' => array_map($this->theme(...), $shell['themes']),
            ],
            'settings' => array_map($this->panel(...), $shell['panels']),
            'search' => [
                'min_length' => $shell['min_length'],
                'sources' => $this->sources($shell['integrations']),
                'per_source' => $shell['per_source'],
            ],
            'integrations' => array_map($this->integration(...), $shell['integrations']),
        ];
    }

    /**
     * @param  IntegrationState  $state
     * @return array{key: string, label: string, active: bool, api_base: string, features: object}
     */
    private function integration(array $state): array
    {
        $integration = $state['integration'];

        return [
            'key' => $integration->key,
            'label' => $integration->label,
            'active' => $state['active'],
            'api_base' => $integration->apiBase,
            'features' => (object) $state['features'],
        ];
    }

    /**
     * The search sources of the active integrations, in key order.
     *
     * @param  list<IntegrationState>  $integrations
     * @return list<array{key: string, integration: string, label: string, icon: string|null}>
     */
    private function sources(array $integrations): array
    {
        $sources = [];

        foreach ($integrations as $state) {
            if (! $state['active']) {
                continue;
            }

            foreach ($state['integration']->searchSources as $source) {
                $sources[] = [
                    'key' => $source->key,
                    'integration' => $state['integration']->key,
                    'label' => $source->label,
                    'icon' => $source->icon,
                ];
            }
        }

        return $sources;
    }

    /**
     * @return array{name: string|null, email: string|null}|null
     */
    private function user(?Authenticatable $user): ?array
    {
        if ($user === null) {
            return null;
        }

        $name = data_get($user, 'name');
        $email = data_get($user, 'email');

        return [
            'name' => is_string($name) ? $name : null,
            'email' => is_string($email) ? $email : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function section(NavSection $section): array
    {
        return [
            'key' => $section->key,
            'label' => $section->label,
            'icon' => $section->icon,
            'grouped' => $section->grouped,
            'link' => ClientPath::for($section->url()),
            'items' => array_map($this->item(...), $section->items),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function item(NavItem $item): array
    {
        return [
            'label' => $item->label,
            'icon' => $item->icon,
            'link' => ClientPath::for($item->resolveUrl()),
            'badge' => $item->resolveBadge(),
            'live' => $item->live === null ? null : ['key' => $item->live['key'], 'options' => (object) $item->live['options']],
            'children' => array_map($this->item(...), array_values($item->children)),
        ];
    }

    /**
     * A settings panel's summary, as the settings list sends it: what the
     * layer needs to link to the panel, without resolving its data.
     *
     * @return array{key: string, label: string, icon: string|null, component: string}
     */
    private function panel(SettingsPanel $panel): array
    {
        return [
            'key' => $panel->key,
            'label' => $panel->label,
            'icon' => $panel->icon,
            'component' => $panel->component,
        ];
    }

    /**
     * Every field the theme definition exposes, its colours and radius as
     * the CSS custom properties they set (only the values safe to apply).
     *
     * @return array<string, mixed>
     */
    private function theme(Theme $theme): array
    {
        return [
            'key' => $theme->key,
            'label' => $theme->label,
            'layout' => $theme->layout,
            'swatch' => $theme->swatchColor(),
            'icon' => $theme->icon,
            'properties' => (object) $theme->properties(),
        ];
    }
}
