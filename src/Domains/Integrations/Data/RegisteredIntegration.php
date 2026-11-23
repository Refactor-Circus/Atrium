<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Data;

use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * An integration as registered: its package key, label, API base and
 * feature flags, and everything it declared. Whether it is active is asked
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
    ) {}

    /**
     * The screen this integration declares under the key, if any.
     */
    public function screen(string $key): ?ScreenDeclaration
    {
        return $this->screens[$key] ?? null;
    }
}
