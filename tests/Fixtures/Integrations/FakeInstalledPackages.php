<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures\Integrations;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;

/**
 * Reports exactly the given Composer packages installed, in place of
 * `Composer\InstalledVersions`, which reflects the real vendor directory.
 */
final class FakeInstalledPackages implements InstalledPackages
{
    /**
     * @param  list<string>  $installed  Composer package names, such as `refactor-circus/cortex`.
     */
    public function __construct(private readonly array $installed = []) {}

    public function isInstalled(string $package): bool
    {
        return in_array($package, $this->installed, true);
    }
}
