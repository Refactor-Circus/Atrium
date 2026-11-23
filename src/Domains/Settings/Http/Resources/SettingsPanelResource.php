<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Http\Resources;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\JsonSchema\Types\Type;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Support\JsonData;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * A settings panel. As built, its summary - `key`, `label`, `icon` and
 * `component` - which the shell and the settings list send. `withData()`
 * adds what opening the panel needs: its `description` and its resolver's
 * `data`, through `JsonData::resolve()`, so outside `local` and `testing` a
 * failing panel gets `data: null` and an `error` instead of failing the
 * response.
 *
 * A panel's writes go to its own package's API: Atrium only lists panels and
 * hands each its data.
 *
 * @mixin SettingsPanel
 *
 * @property SettingsPanel $resource
 */
final class SettingsPanelResource extends JsonResource
{
    private bool $withData = false;

    /**
     * Send the panel's description and data too.
     */
    public function withData(): self
    {
        $this->withData = true;

        return $this;
    }

    /**
     * A panel as `toArray()` sends it: the summary is always there;
     * `description` and `data` (and `error`, for an isolated failure) only
     * when the panel is opened.
     *
     * @return array<string, Type>
     */
    public static function schema(JsonSchema $schema): array
    {
        return [
            'key' => $schema->string()->required(),
            'label' => $schema->string()->required(),
            'icon' => $schema->string()->nullable()->description('An Iconify name.')->required(),
            'component' => $schema->string()->required(),
            'description' => $schema->string()->nullable()->description('Sent with an opened panel.'),
            'data' => $schema->object()->nullable()->description('Sent with an opened panel; null when it failed.'),
            'error' => $schema->object([
                'message' => $schema->string()->required(),
            ])->description('Present only when resolving failed and was isolated.'),
        ];
    }

    /**
     * The panel, always under `data`. Laravel leaves a payload that has its
     * own `data` key unwrapped, and an opened panel's data is that key.
     *
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        return new JsonResponse(['data' => $this->resolve($request)] + $this->with($request) + $this->additional);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $panel = $this->resource;

        if (! $this->withData) {
            return [
                'key' => $panel->key,
                'label' => $panel->label,
                'icon' => $panel->icon,
                'component' => $panel->component,
            ];
        }

        $resolved = JsonData::resolve("Settings panel [{$panel->key}]", $panel->resolveData(...));

        return [
            'key' => $panel->key,
            'label' => $panel->label,
            'description' => $panel->description,
            'icon' => $panel->icon,
            'component' => $panel->component,
            ...$resolved,
            'data' => $resolved['data'] === null ? null : (object) $resolved['data'],
        ];
    }
}
