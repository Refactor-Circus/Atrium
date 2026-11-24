<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleDiscovery;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;

/**
 * The integration manifests of the packages Composer installed, from the
 * modules `atrium:discover` found (and cached) in `vendor/composer/installed.json`.
 */
final class ComposerInstalledPackages implements InstalledPackages
{
    public function __construct(private readonly ModuleDiscovery $discovery) {}

    public function integrations(): array
    {
        $integrations = [];

        foreach ($this->discovery->discover() as $module) {
            if ($module->integration !== null) {
                $integrations[$module->key] = $module->integration;
            }
        }

        return $integrations;
    }
}
