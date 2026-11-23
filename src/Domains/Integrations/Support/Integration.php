<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Support;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration as IntegrationContract;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;

/**
 * Base for the suite integrations, declaring nothing but a label: an
 * integration overrides what its package shows.
 */
abstract class Integration implements IntegrationContract
{
    public function navigation(): array
    {
        return [];
    }

    public function widgets(): array
    {
        return [];
    }

    public function settings(): ?SettingsPanel
    {
        return null;
    }

    public function searchSources(): array
    {
        return [];
    }

    public function screens(): array
    {
        return [];
    }
}
