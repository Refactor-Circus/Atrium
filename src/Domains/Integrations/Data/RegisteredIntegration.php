<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Data;

use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use stdClass;

/**
 * An integration as registered from its manifest (D-090): its package key,
 * label, API base and feature flags, and everything it declared. Whether it is active is asked
 * per request, of `IntegrationFeatures`.
 */
final class RegisteredIntegration
{
    /**
     * @internal Built by IntegrationRegistry::register().
     *
     * @param  list<string>  $features  Every one must be on for the integration to be active.
     * @param  list<NavItem>  $navigation
     * @param  list<WidgetDefinition>  $widgets
     * @param  list<SearchSourceDeclaration>  $searchSources
     * @param  array<string, ScreenDeclaration>  $screens  By screen key.
     * @param  list<stdClass>  $hooks  Its manifest's `hooks`, run by IntegrationHooks.
     * @param  list<string>  $defaultFeatures  Its manifest's `features`, which Atrium defines as on in Pennant until the host defines them.
     */
    public function __construct(
        public private(set) string $key,
        public private(set) string $label,
        public private(set) string $apiBase,
        public private(set) array $features,
        public private(set) array $navigation,
        public private(set) array $widgets,
        public private(set) ?SettingsPanel $settings,
        public private(set) array $searchSources,
        public private(set) array $screens,
        public private(set) array $hooks = [],
        public private(set) array $defaultFeatures = [],
    ) {}

    /**
     * The screen this integration declares under the key, if any.
     */
    public function screen(string $key): ?ScreenDeclaration
    {
        return $this->screens[$key] ?? null;
    }
}
