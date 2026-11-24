<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Cortex;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;

/**
 * What Atrium shows of Cortex (refactor-circus/cortex), as data only: the six
 * nav items, the `cortex` settings panel and search source and the eleven
 * screens of Cortex v1's Atrium plugin, under their v1 keys. The layer's
 * pages (`/cortex/...`) call Cortex's own API for everything they show.
 *
 * The screens carry no subject type: Cortex declares no morph aliases, and
 * its morph classes are class names Atrium never names.
 */
final class CortexIntegration extends Integration
{
    public function label(): string
    {
        return self::trans('label');
    }

    public function navigation(): array
    {
        $group = self::trans('label');

        return [
            NavItem::make(self::trans('virtual_agents'))->path('/cortex/virtual-agents')->icon('i-lucide-sparkles')->group($group)->sort(10),
            NavItem::make(self::trans('concrete_agents'))->path('/cortex/concrete-agents')->icon('i-lucide-cpu')->group($group)->sort(20),
            NavItem::make(self::trans('run_agent'))->path('/cortex/run')->icon('i-lucide-play')->group($group)->sort(30),
            NavItem::make(self::trans('tools'))->path('/cortex/tools')->icon('i-lucide-wrench')->group($group)->sort(40),
            NavItem::make(self::trans('servers'))->path('/cortex/servers')->icon('i-lucide-server')->group($group)->sort(50),
            NavItem::make(self::trans('redirect_domains'))->path('/cortex/redirect-domains')->icon('i-lucide-globe')->group($group)->sort(60),
        ];
    }

    /**
     * The panel's component renders Cortex's `settings-summary` endpoint.
     */
    public function settings(): SettingsPanel
    {
        return SettingsPanel::make('cortex')
            ->label(self::trans('settings_label'))
            ->description(self::trans('settings_description'))
            ->icon('i-lucide-cpu');
    }

    /**
     * Virtual and concrete agents, from Cortex's `search` endpoint.
     */
    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make('cortex')->label(self::trans('search_label'))->icon('i-lucide-sparkles'),
        ];
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make('cortex.virtual-agents', Screen::LIST, '/cortex/virtual-agents'),
            ScreenDeclaration::make('cortex.virtual-agent-create', Screen::DETAIL, '/cortex/virtual-agents/create'),
            ScreenDeclaration::make('cortex.virtual-agent', Screen::DETAIL, '/cortex/virtual-agents/:slug'),
            ScreenDeclaration::make('cortex.concrete-agents', Screen::LIST, '/cortex/concrete-agents'),
            ScreenDeclaration::make('cortex.concrete-agent', Screen::DETAIL, '/cortex/concrete-agents/:agent'),
            ScreenDeclaration::make('cortex.tools', Screen::LIST, '/cortex/tools'),
            ScreenDeclaration::make('cortex.tool-description', Screen::DETAIL, '/cortex/tools/:tool/description'),
            ScreenDeclaration::make('cortex.servers', Screen::LIST, '/cortex/servers'),
            ScreenDeclaration::make('cortex.server-instructions', Screen::DETAIL, '/cortex/servers/:server/instructions'),
            ScreenDeclaration::make('cortex.redirect-domains', Screen::LIST, '/cortex/redirect-domains'),
            ScreenDeclaration::make('cortex.run', Screen::DETAIL, '/cortex/run'),
        ];
    }

    /**
     * A line of `lang/en/integrations/cortex.php`, or its key when missing.
     */
    private static function trans(string $key): string
    {
        $line = __('atrium::integrations/cortex.'.$key);

        return is_string($line) ? $line : $key;
    }
}
