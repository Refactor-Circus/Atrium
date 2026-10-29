<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data;

use RefactorCircus\Atrium\Domains\Screens\Data\Concerns\DefinesExtension;

/**
 * A tab a package adds to one screen, a package's screens or every screen,
 * registered with `Atrium::screens()->tab()` from a provider's `boot()`.
 * Opened through `?tab={key}`, its panel replaces the host's page content.
 *
 * A screen's built-in tabs are TabDefinitions too, with neither a view nor a
 * component: the host renders them.
 */
final class TabDefinition
{
    use DefinesExtension;

    public const string DEFAULT_ICON = 'squares-2x2';

    /**
     * An Atrium icon name.
     */
    public private(set) string $icon = self::DEFAULT_ICON;

    public function icon(string $icon): self
    {
        $this->icon = $icon;

        return $this;
    }
}
