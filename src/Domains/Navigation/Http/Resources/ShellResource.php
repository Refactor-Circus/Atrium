<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Http\Resources;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\Request;
use Illuminate\JsonSchema\Types\Type;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavSection;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * Everything the front end's chrome needs, in one request on boot: the app, the
 * signed-in user, the locale and API version, the navigation this user may
 * see, the themes, the settings panel summaries and the search box's minimum
 * query length.
 *
 * Which navigation item is active is the front end's to work out from its own
 * route, so it is not sent. Every link goes out as `{path, external}`: an
 * item's SPA path (`NavItem::path()`) as it is, any other URL as ClientPath
 * makes it, or null for a URL ClientPath refuses. An item the
 * layer completes from a package API carries its `live` resolver key.
 *
 * `integrations` lists every registered suite integration, in key order,
 * with whether it is active for this user and each of its feature flags;
 * `search.sources` the search sources of the active ones, which the front end
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
     * The shell as `toArray()` sends it. A nav item's `children` are nav
     * items of the same shape; theme `properties`, integration `features` and
     * live `options` are JSON objects keyed by name.
     *
     * @return array<string, Type>
     */
    public static function schema(JsonSchema $schema): array
    {
        $link = fn (): Type => $schema->object([
            'path' => $schema->string()->description('A path inside the SPA, or an absolute http(s) URL when external.')->required(),
            'external' => $schema->boolean()->required(),
        ])->nullable()->description('Null for a URL ClientPath refuses.')->required();

        $item = $schema->object([
            'label' => $schema->string()->required(),
            'icon' => $schema->string()->nullable()->description('An Iconify name.')->required(),
            'link' => $link(),
            'badge' => $schema->union(['string', 'integer'])->nullable()->required(),
            'live' => $schema->object([
                'key' => $schema->string()->description('The live resolver key, `{package}.{name}`.')->required(),
                'options' => $schema->object()->description('The resolver\'s static options.')->required(),
            ])->nullable()->required(),
            'children' => $schema->array()->items($schema->object()->description('A nav item, shaped as its parent.'))->required(),
        ]);

        return [
            'app' => $schema->object([
                'name' => $schema->string()->required(),
            ])->required(),
            'user' => $schema->object([
                'name' => $schema->string()->nullable()->required(),
                'email' => $schema->string()->nullable()->required(),
            ])->nullable()->required(),
            'locale' => $schema->string()->description('The app\'s current locale.')->required(),
            'api_version' => $schema->string()->description('Atrium\'s API major.minor.')->required(),
            'navigation' => $schema->array()->items($schema->object([
                'key' => $schema->string()->required(),
                'label' => $schema->string()->required(),
                'icon' => $schema->string()->nullable()->required(),
                'grouped' => $schema->boolean()->required(),
                'link' => $link(),
                'items' => $schema->array()->items($item)->required(),
            ]))->required(),
            'themes' => $schema->object([
                'default' => $schema->string()->nullable()->required(),
                'switchable' => $schema->boolean()->required(),
                'all' => $schema->array()->items($schema->object([
                    'key' => $schema->string()->required(),
                    'label' => $schema->string()->required(),
                    'layout' => $schema->string()->required(),
                    'swatch' => $schema->string()->required(),
                    'icon' => $schema->string()->nullable()->required(),
                    'properties' => $schema->object()->description('The CSS custom properties the theme sets, by name.')->required(),
                ]))->required(),
            ])->required(),
            'settings' => $schema->array()->items($schema->object([
                'key' => $schema->string()->required(),
                'label' => $schema->string()->required(),
                'icon' => $schema->string()->nullable()->required(),
                'component' => $schema->string()->required(),
            ]))->required(),
            'search' => $schema->object([
                'min_length' => $schema->integer()->required(),
                'sources' => $schema->array()->items($schema->object([
                    'key' => $schema->string()->required(),
                    'integration' => $schema->string()->required(),
                    'label' => $schema->string()->required(),
                    'icon' => $schema->string()->nullable()->required(),
                ]))->required(),
                'per_source' => $schema->integer()->nullable()->required(),
            ])->required(),
            'integrations' => $schema->array()->items($schema->object([
                'key' => $schema->string()->required(),
                'label' => $schema->string()->required(),
                'active' => $schema->boolean()->required(),
                'api_base' => $schema->string()->required(),
                'features' => $schema->object()->description('Each feature flag and whether it is on for the user.')->required(),
            ]))->required(),
        ];
    }

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
            'link' => $section->link(),
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
            'link' => $item->link(),
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
