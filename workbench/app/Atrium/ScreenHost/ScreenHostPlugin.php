<?php

declare(strict_types=1);

namespace Workbench\App\Atrium\ScreenHost;

use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Support\Icons;

/**
 * Puts the screen-extensions test host in the navigation: a `Screen host`
 * group whose pages are the detail (`test.host`) and list (`test.list`)
 * screens. A group with pages is what the top layout draws as a row of
 * `top-tabs` beneath its section bar, so the browser matrix can check that a
 * screen's tab bar never overlaps that row.
 *
 * The workbench registers it for `composer serve`; a browser test, whose app
 * has not discovered the workbench, registers it itself after
 * `ScreenHostController::register()`.
 */
final class ScreenHostPlugin extends Plugin
{
    public function key(): string
    {
        return 'screen-host';
    }

    public function label(): string
    {
        return 'Screen host';
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Detail screen')
                ->route('test.host')
                ->icon(Icons::svg('document-text'))
                ->group('Screen host')
                ->sort(10),

            NavItem::make('List screen')
                ->route('test.list')
                ->icon(Icons::svg('table-cells'))
                ->group('Screen host')
                ->sort(20),
        ];
    }

    public function navigationGroups(): array
    {
        return [
            NavGroup::make('Screen host')->icon(Icons::svg('squares-2x2'))->sort(90),
        ];
    }
}
