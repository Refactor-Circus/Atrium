<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Http\Resources;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Http\Request;
use Illuminate\JsonSchema\Types\Type;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * A widget the user may place, as the picker lists it. `component` is the
 * key the client renders it with.
 *
 * @mixin WidgetDefinition
 */
final class WidgetDefinitionResource extends JsonResource
{
    /**
     * A widget definition as `toArray()` sends it.
     *
     * @return array<string, Type>
     */
    public static function schema(JsonSchema $schema): array
    {
        $size = fn (): Type => $schema->object([
            'width' => $schema->integer()->required(),
            'height' => $schema->integer()->required(),
        ])->required();

        return [
            'key' => $schema->string()->required(),
            'label' => $schema->string()->required(),
            'description' => $schema->string()->nullable()->required(),
            'icon' => $schema->string()->nullable()->description('An Iconify name.')->required(),
            'component' => $schema->string()->required(),
            'lazy' => $schema->boolean()->required(),
            'default_size' => $size(),
            'min_size' => $size(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'component' => $this->component,
            'lazy' => $this->lazy,
            'default_size' => ['width' => $this->defaultWidth, 'height' => $this->defaultHeight],
            'min_size' => ['width' => $this->minWidth, 'height' => $this->minHeight],
        ];
    }
}
