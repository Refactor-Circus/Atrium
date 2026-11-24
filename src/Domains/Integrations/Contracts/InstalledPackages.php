<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Contracts;

/**
 * The integration manifests of the installed packages (D-090): each package
 * whose `extra.atrium` names an `integration` (or ships
 * `dist/atrium/integration.json`). Bound to `ComposerInstalledPackages`,
 * which reads `atrium:discover`'s cache; tests and the workbench bind their
 * own, since Composer's answer reflects the real vendor directory.
 */
interface InstalledPackages
{
    /**
     * The absolute path of each installed package's integration manifest, by
     * its module key (`extra.atrium.key`, `cortex`).
     *
     * @return array<string, string>
     */
    public function integrations(): array;
}
