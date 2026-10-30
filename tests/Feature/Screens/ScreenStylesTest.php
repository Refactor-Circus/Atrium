<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Testing\AtriumStyles;

it('styles the screen components with compiled utilities only', function (): void {
    $views = sys_get_temp_dir().'/atrium-screen-components-'.uniqid();
    mkdir($views);

    foreach (['screen-tabs', 'screen-tab-panel', 'screen-sections'] as $component) {
        $path = dirname(__DIR__, 3).'/resources/views/components/'.$component.'.blade.php';

        expect($path)->toBeFile();

        $contents = (string) file_get_contents($path);

        // Classes given through $attributes->class('...') are checked too.
        $contents = (string) preg_replace("/->class\\('([^']*)'\\)/", ' class="$1" ', $contents);

        file_put_contents($views.'/'.$component.'.blade.php', $contents);
    }

    expect(AtriumStyles::missingClasses($views))->toBe([])
        ->and(AtriumStyles::inlineStyles($views))->toBe([]);
});
