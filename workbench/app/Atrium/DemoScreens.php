<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

/**
 * Screen extensions on the demo settings panel's screen
 * (`atrium.settings-panel`), as a package adds them to another package's
 * screen: a registered tab, a header action and an aside section. Each is
 * a Vue component the playground registers under its key with
 * `$atrium.extension()`.
 */
final class DemoScreens
{
    public static function register(ScreenExtensions $screens): void
    {
        $screens
            ->tab('atrium.settings-panel', TabDefinition::make('demo.storefront')
                ->label('Storefront')
                ->icon('i-lucide-store')
                ->authorize(self::onDemoPanel(...))
                ->resolve(fn (): array => DemoData::storefront()))
            ->section('atrium.settings-panel', 'header.actions', SectionDefinition::make('demo.visit-store')
                ->label('Visit store')
                ->authorize(self::onDemoPanel(...))
                ->resolve(fn (): array => ['url' => DemoData::storefront()['url']]))
            ->section('atrium.settings-panel', 'aside', SectionDefinition::make('demo.help')
                ->label('About these settings')
                ->authorize(self::onDemoPanel(...))
                ->resolve(fn (): array => [
                    'text' => 'Feature flags come from the workbench\'s feature resolver. A real shop reads them from its feature-flag package.',
                ]));
    }

    /**
     * The extensions belong to the demo panel only, not every panel's screen.
     */
    private static function onDemoPanel(Request $request): bool
    {
        return $request->route('panel') === 'demo';
    }
}
