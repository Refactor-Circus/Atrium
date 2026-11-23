<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use Composer\InstalledVersions;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;

/**
 * The installed packages as Composer recorded them for the vendor directory.
 */
final class ComposerInstalledPackages implements InstalledPackages
{
    public function isInstalled(string $package): bool
    {
        return InstalledVersions::isInstalled($package);
    }
}
