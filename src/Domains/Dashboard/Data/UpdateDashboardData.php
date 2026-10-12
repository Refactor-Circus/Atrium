<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use RefactorCircus\Keystone\Data\Data;
use RefactorCircus\Keystone\Data\Missing;

/**
 * Input for UpdateDashboardAction: a new name, whether it is the default
 * dashboard, or both. Fields left out are left as they are.
 */
final readonly class UpdateDashboardData extends Data
{
    public function __construct(
        public string|Missing $name = new Missing,
        public bool|Missing $isDefault = new Missing,
    ) {}

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
