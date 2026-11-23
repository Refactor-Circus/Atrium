<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Widgets\Http\Resources;

use Illuminate\Http\Request;
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
