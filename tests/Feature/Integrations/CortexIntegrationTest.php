<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The Cortex integration (AC 39, 40, 45, 53, 55, 61, 62): Atrium declares
 * Cortex's six v1 nav items, its `cortex` settings panel and search source and
 * its eleven screens as data only, once the package is installed, enabled and
 * serving its API. The layer's Vue pages call Cortex's API themselves.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Cortex installed, with its API on under `cortex/api`, then registered.
 */
function registerCortex(): IntegrationRegistry
{
    IntegrationFixture::installed('cortex');
    IntegrationFixture::serveApi('cortex');

    return IntegrationFixture::register();
}

describe('gating', function (): void {
    it('registers the Cortex integration while Cortex is installed and enabled', function (): void {
        $integration = registerCortex()->get('cortex');

        expect($integration)->not->toBeNull()
            ->and($integration?->label)->toBe('Cortex');
    });

    it('registers nothing while Cortex is not installed', function (): void {
        IntegrationFixture::installed();
        IntegrationFixture::serveApi('cortex');

        expect(IntegrationFixture::register()->all())->toBe([]);
    });

    it('registers nothing while the integration is disabled', function (mixed $enabled): void {
        config()->set('atrium.integrations.cortex.enabled', $enabled);

        expect(registerCortex()->all())->toBe([]);
    })->with([
        'false' => [false],
        'the string "false"' => ['false'],
    ]);
});

describe('the API base', function (): void {
    it('is Cortex\'s own route prefix, trimmed', function (): void {
        IntegrationFixture::installed('cortex');
        config()->set('cortex.routes', ['enabled' => true, 'prefix' => '/api/cortex/']);

        expect(IntegrationFixture::register()->get('cortex')?->apiBase)->toBe('/api/cortex');
    });

    it('is atrium.integrations.cortex.api_base when set', function (): void {
        IntegrationFixture::installed('cortex');
        config()->set('cortex.routes', ['enabled' => true, 'prefix' => 'cortex/api']);
        config()->set('atrium.integrations.cortex.api_base', 'https://agents.example.com/api');

        expect(IntegrationFixture::register()->get('cortex')?->apiBase)->toBe('https://agents.example.com/api');
    });

    it('is missing while Cortex\'s routes are off, so the integration does not register and Atrium warns once', function (): void {
        Log::spy();

        IntegrationFixture::installed('cortex');
        config()->set('cortex.routes', ['enabled' => false, 'prefix' => 'cortex/api']);

        expect(IntegrationFixture::register()->all())->toBe([]);

        app()->forgetInstance(IntegrationRegistry::class);
        IntegrationFixture::register();

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message): bool => str_contains($message, 'cortex.routes.enabled') && str_contains($message, 'atrium.integrations.cortex.api_base'))
            ->once();
    });
});

describe('declarations', function (): void {
    it('declares the six v1 nav items, with their labels, Iconify icons and layer paths', function (): void {
        $navigation = registerCortex()->get('cortex')?->navigation ?? [];

        expect(array_map(fn (NavItem $item): array => [
            'label' => $item->label,
            'icon' => $item->icon,
            'url' => $item->resolveUrl(),
            'group' => $item->group,
            'sort' => $item->sort,
            'badge' => $item->resolveBadge(),
            'live' => $item->live,
        ], $navigation))->toBe([
            ['label' => 'Virtual agents', 'icon' => 'i-lucide-sparkles', 'url' => '/cortex/virtual-agents', 'group' => 'Cortex', 'sort' => 10, 'badge' => null, 'live' => null],
            ['label' => 'Concrete agents', 'icon' => 'i-lucide-cpu', 'url' => '/cortex/concrete-agents', 'group' => 'Cortex', 'sort' => 20, 'badge' => null, 'live' => null],
            ['label' => 'Run agent', 'icon' => 'i-lucide-play', 'url' => '/cortex/run', 'group' => 'Cortex', 'sort' => 30, 'badge' => null, 'live' => null],
            ['label' => 'Tools', 'icon' => 'i-lucide-wrench', 'url' => '/cortex/tools', 'group' => 'Cortex', 'sort' => 40, 'badge' => null, 'live' => null],
            ['label' => 'Servers', 'icon' => 'i-lucide-server', 'url' => '/cortex/servers', 'group' => 'Cortex', 'sort' => 50, 'badge' => null, 'live' => null],
            ['label' => 'Redirect domains', 'icon' => 'i-lucide-globe', 'url' => '/cortex/redirect-domains', 'group' => 'Cortex', 'sort' => 60, 'badge' => null, 'live' => null],
        ]);
    });

    it('declares no widgets', function (): void {
        expect(registerCortex()->get('cortex')?->widgets)->toBe([]);
    });

    it('declares the cortex settings panel with static data only', function (): void {
        $panel = registerCortex()->get('cortex')?->settings;

        expect($panel)->not->toBeNull();

        expect(new SettingsPanelResource($panel)->withData()->resolve())->toMatchArray([
            'key' => 'cortex',
            'label' => 'Cortex',
            'icon' => 'i-lucide-cpu',
            'component' => 'cortex',
            'description' => 'Providers, tools, concrete agents and MCP servers available to your agents.',
        ])->and($panel?->resolveData())->toBe([]);
    });

    it('declares the cortex search source', function (): void {
        $sources = registerCortex()->get('cortex')?->searchSources ?? [];

        expect(array_map(fn (SearchSourceDeclaration $source): array => [$source->key, $source->label, $source->icon], $sources))
            ->toBe([['cortex', 'Cortex', 'i-lucide-sparkles']]);
    });

    it('declares the eleven v1 screens with their kinds and layer paths', function (): void {
        $screens = registerCortex()->get('cortex')?->screens ?? [];

        expect(array_values(array_map(fn (ScreenDeclaration $screen): array => [
            $screen->key, $screen->kind, $screen->path, $screen->subjectType,
        ], $screens)))->toBe([
            ['cortex.virtual-agents', 'list', '/cortex/virtual-agents', null],
            ['cortex.virtual-agent-create', 'detail', '/cortex/virtual-agents/create', null],
            ['cortex.virtual-agent', 'detail', '/cortex/virtual-agents/:slug', null],
            ['cortex.concrete-agents', 'list', '/cortex/concrete-agents', null],
            ['cortex.concrete-agent', 'detail', '/cortex/concrete-agents/:agent', null],
            ['cortex.tools', 'list', '/cortex/tools', null],
            ['cortex.tool-description', 'detail', '/cortex/tools/:tool/description', null],
            ['cortex.servers', 'list', '/cortex/servers', null],
            ['cortex.server-instructions', 'detail', '/cortex/servers/:server/instructions', null],
            ['cortex.redirect-domains', 'list', '/cortex/redirect-domains', null],
            ['cortex.run', 'detail', '/cortex/run', null],
        ]);
    });

    it('writes its declarations to the layer fixture', function (): void {
        registerCortex();

        IntegrationFixture::assertMatchesFixture('cortex');
    });
});
