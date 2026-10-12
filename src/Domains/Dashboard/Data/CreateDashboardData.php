<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Data;

use RefactorCircus\Keystone\Data\Data;

/**
 * Input for CreateDashboardAction: the dashboard's name, and whether it is
 * shared with everyone rather than owned by its creator.
 *
 * Only code shares a dashboard (`new CreateDashboardData('Overview', isShared:
 * true)`): the rules accept no `is_shared`, so a request cannot.
 */
final readonly class CreateDashboardData extends Data
{
    public function __construct(
        public string $name,
        public bool $isShared = false,
    ) {}

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
