<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;

/**
 * Cortex's redirect domains on other packages' screens (AC 65), as
 * `atrium.integrations.cortex.redirect_domains.screens` maps them: the
 * `cortex.mcp` tab for an entry of `tab`, else the `cortex.redirect-domains`
 * section in the named slot.
 *
 * The screen's record owns the domains, so only a detail screen whose
 * declaration names its record's morph alias gets them. The data is that
 * alias, `{owner_type}`; the layer adds `owner_id` from the record key and
 * calls Cortex's `redirect-domains` routes itself.
 */
final class CortexRedirectDomains extends Hook
{
    public const string TAB = 'cortex.mcp';

    public const string SECTION = 'cortex.redirect-domains';

    /**
     * The entry value that adds the tab rather than a section.
     */
    private const string AS_TAB = 'tab';

    private const string KEY = 'atrium.integrations.cortex.redirect_domains.screens';

    /**
     * The v1 default, for a config without the key.
     */
    private const array DEFAULT = ['roster.organization' => 'tab', 'roster.user' => 'aside'];

    public function register(Hooks $hooks): void
    {
        $cortex = $this->integrations->get('cortex');

        if ($cortex === null) {
            return;
        }

        $screens = $this->config->get(self::KEY, self::DEFAULT);

        if (! is_array($screens)) {
            self::invalid('['.self::KEY.'] must map screen keys to `tab` or a slot name, such as [\'roster.user\' => \'aside\'].');

            return;
        }

        foreach ($screens as $target => $placement) {
            if (! self::validTarget($target)) {
                self::invalid('['.self::KEY.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            if ($placement !== self::AS_TAB && ! self::validSlot($placement)) {
                self::invalid('['.self::KEY.'] places ['.$target.'] in the invalid slot ['.self::describe($placement).']: use `tab` or a slot name matching '.Screen::NAME_PATTERN.'.');

                continue;
            }

            foreach ($this->screens($target) as [$integration, $screen]) {
                $this->add($hooks, $cortex, $integration, $screen, $placement);
            }
        }
    }

    private function add(Hooks $hooks, RegisteredIntegration $cortex, RegisteredIntegration $integration, ScreenDeclaration $screen, string $placement): void
    {
        $owner = $screen->subjectType;

        if ($screen->kind !== Screen::DETAIL || $owner === null) {
            return;
        }

        $data = ['owner_type' => $owner];

        if ($placement === self::AS_TAB) {
            $hooks->tab($screen->key, TabDefinition::make(self::TAB)
                ->label(self::trans('atrium::integrations/hooks.cortex_mcp'))
                ->icon('i-lucide-globe')
                ->authorize($this->whileActive($cortex, $integration))
                ->resolve(fn (): array => $data));

            return;
        }

        $hooks->section($screen->key, $placement, SectionDefinition::make(self::SECTION)
            ->label(self::trans('atrium::integrations/hooks.redirect_domains'))
            ->authorize($this->whileActive($cortex, $integration))
            ->resolve(fn (): array => $data));
    }
}
