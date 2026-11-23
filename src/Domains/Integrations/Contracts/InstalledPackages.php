<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Contracts;

/**
 * Which Composer packages the application has installed. Bound to
 * `ComposerInstalledPackages`; tests bind a fake, since Composer's own answer
 * reflects the real vendor directory and cannot be changed in place.
 */
interface InstalledPackages
{
    /**
     * Whether the Composer package (`refactor-circus/cortex`) is installed.
     */
    public function isInstalled(string $package): bool;
}
