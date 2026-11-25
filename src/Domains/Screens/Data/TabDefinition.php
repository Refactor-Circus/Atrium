<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Concerns\DefinesExtension;
use RefactorCircus\Atrium\Support\Iconify;

/**
 * A tab a package adds to one screen, a package's screens or every screen,
 * registered with `Atrium::screens()->tab()` from a provider's `boot()`.
 * Opened through `?tab={key}`, its panel replaces the host's page content.
 *
 * A screen's built-in tabs are TabDefinitions too: the host renders them.
 */
final class TabDefinition
{
    use DefinesExtension;

    public const string DEFAULT_ICON = 'i-lucide-layout-grid';

    /**
     * An Iconify name, such as `i-lucide-home`.
     */
    public private(set) string $icon = self::DEFAULT_ICON;

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-home`
     */
    public function icon(string $icon): self
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }
}
