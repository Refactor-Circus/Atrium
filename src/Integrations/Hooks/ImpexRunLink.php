<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;

/**
 * Impex's run link on other packages' rows (AC 66): one `impex.run-link`
 * section per entry of `atrium.integrations.impex.run_link.screens` (screen
 * target => slot), by default in `showroom.transfers`' `row.actions`. Impex's
 * module renders it as a link to `/impex/runs/:id` for the row's run id, so
 * it sends no data.
 */
final class ImpexRunLink extends Hook
{
    public const string SECTION = 'impex.run-link';

    private const string KEY = 'atrium.integrations.impex.run_link.screens';

    /**
     * The v1 default, for a config without the key.
     */
    private const array DEFAULT = ['showroom.transfers' => 'row.actions'];

    public function register(Hooks $hooks): void
    {
        $impex = $this->integrations->get('impex');

        if ($impex === null) {
            return;
        }

        $screens = $this->config->get(self::KEY, self::DEFAULT);

        if (! is_array($screens)) {
            self::invalid('['.self::KEY.'] must map screen keys to slot names, such as [\'showroom.transfers\' => \'row.actions\'].');

            return;
        }

        foreach ($screens as $target => $slot) {
            if (! self::validTarget($target)) {
                self::invalid('['.self::KEY.'] holds the invalid screen target ['.self::describe($target).']: use *, {package}.* or a screen key ({package}.{screen}).');

                continue;
            }

            if (! self::validSlot($slot)) {
                self::invalid('['.self::KEY.'] places ['.$target.'] in the invalid slot ['.self::describe($slot).']: it must match '.Screen::NAME_PATTERN.'.');

                continue;
            }

            foreach ($this->screens($target) as [$integration, $screen]) {
                $hooks->section($screen->key, $slot, SectionDefinition::make(self::SECTION)
                    ->label(self::trans('atrium::integrations/hooks.run'))
                    ->authorize($this->whileActive($impex, $integration)));
            }
        }
    }
}
