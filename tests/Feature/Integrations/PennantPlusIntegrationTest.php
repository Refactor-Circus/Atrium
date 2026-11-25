<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The PennantPlus integration (AC 39, 40, 45, 53, 58): Atrium declares
 * PennantPlus's one v1 nav item and its one screen, `pennantplus.features`,
 * as data only, once the package is installed, enabled and serving its API.
 * The layer's Vue page calls PennantPlus's API itself.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * PennantPlus installed, with its API on under its shipped prefix, then
 * registered.
 */
function registerPennantPlus(): IntegrationRegistry
{
    IntegrationFixture::installed('pennantplus');
    config()->set('pennantplus.routes', ['enabled' => true, 'prefix' => 'pennantplus', 'middleware' => ['api']]);

    return IntegrationFixture::register();
}

describe('gating', function (): void {
    it('registers the PennantPlus integration while PennantPlus is installed and enabled', function (): void {
        $integration = registerPennantPlus()->get('pennantplus');

        expect($integration)->not->toBeNull()
            ->and($integration?->label)->toBe('PennantPlus')
            ->and($integration?->features)->toBe(['pennantplus.atrium']);
    });

    it('registers nothing while PennantPlus is not installed', function (): void {
        $before = app(NavigationRegistry::class)->items(Request::create('/'));

        IntegrationFixture::installed();
        IntegrationFixture::serveApi('pennantplus');

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(NavigationRegistry::class)->items(Request::create('/')))->toBe($before);
    });

    it('registers nothing while the integration is disabled', function (mixed $enabled): void {
        config()->set('atrium.integrations.pennantplus.enabled', $enabled);

        expect(registerPennantPlus()->all())->toBe([]);
    })->with([
        'false' => [false],
        'the string "false"' => ['false'],
    ]);
});

describe('the API base', function (): void {
    it('is PennantPlus\'s own route prefix, trimmed', function (string $prefix, string $base): void {
        IntegrationFixture::installed('pennantplus');
        config()->set('pennantplus.routes', ['enabled' => true, 'prefix' => $prefix]);

        expect(IntegrationFixture::register()->get('pennantplus')?->apiBase)->toBe($base);
    })->with([
        'the shipped prefix' => ['pennantplus', '/pennantplus'],
        'with slashes' => ['/api/flags/', '/api/flags'],
    ]);

    it('is atrium.integrations.pennantplus.api_base when set', function (): void {
        IntegrationFixture::installed('pennantplus');
        config()->set('pennantplus.routes', ['enabled' => true, 'prefix' => 'pennantplus']);
        config()->set('atrium.integrations.pennantplus.api_base', 'https://flags.example.com/api');

        expect(IntegrationFixture::register()->get('pennantplus')?->apiBase)->toBe('https://flags.example.com/api');
    });

    it('is missing while PennantPlus\'s routes are off, so the integration does not register and Atrium warns once', function (): void {
        Log::spy();

        IntegrationFixture::installed('pennantplus');
        config()->set('pennantplus.routes', ['enabled' => false, 'prefix' => 'pennantplus']);

        expect(IntegrationFixture::register()->all())->toBe([]);

        app()->forgetInstance(IntegrationRegistry::class);
        IntegrationFixture::register();

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message): bool => str_contains($message, 'pennantplus.routes.enabled') && str_contains($message, 'atrium.integrations.pennantplus.api_base'))
            ->once();
    });

    it('is missing with no PennantPlus config at all', function (): void {
        Log::spy();

        IntegrationFixture::installed('pennantplus');

        expect(config('pennantplus'))->toBeNull()
            ->and(IntegrationFixture::register()->all())->toBe([]);

        Log::shouldHaveReceived('warning')->withArgs(fn (string $message): bool => str_contains($message, 'pennantplus.routes.enabled'))->once();
    });
});

describe('declarations', function (): void {
    it('declares the one v1 nav item, with its label, Iconify icon and layer path', function (): void {
        $navigation = registerPennantPlus()->get('pennantplus')?->navigation ?? [];

        expect(array_map(fn (NavItem $item): array => [
            'label' => $item->label,
            'icon' => $item->icon,
            'url' => $item->resolveUrl(),
            'group' => $item->group,
            'sort' => $item->sort,
            'badge' => $item->resolveBadge(),
            'live' => $item->live,
            'children' => $item->children,
        ], $navigation))->toBe([
            ['label' => 'Feature flags', 'icon' => 'i-lucide-flag', 'url' => '/pennantplus/features', 'group' => 'System', 'sort' => 90, 'badge' => null, 'live' => null, 'children' => []],
        ]);
    });

    it('shows its nav item in the shell navigation while registered', function (): void {
        registerPennantPlus();

        $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

        expect($labels)->toContain('Feature flags');
    });

    it('declares no widgets, settings panel or search sources, so it sends no data at all', function (): void {
        $integration = registerPennantPlus()->get('pennantplus');

        expect($integration?->widgets)->toBe([])
            ->and($integration?->settings)->toBeNull()
            ->and($integration?->searchSources)->toBe([]);
    });

    it('declares the pennantplus.features list screen at /pennantplus/features', function (): void {
        $screens = registerPennantPlus()->get('pennantplus')?->screens ?? [];

        expect(array_values(array_map(fn (ScreenDeclaration $screen): array => [
            $screen->key, $screen->kind, $screen->path, $screen->subjectType,
        ], $screens)))->toBe([
            ['pennantplus.features', 'list', '/pennantplus/features', null],
        ]);
    });

    it('writes its declarations to the layer fixture', function (): void {
        registerPennantPlus();

        IntegrationFixture::assertMatchesFixture('pennantplus');
    });
});
