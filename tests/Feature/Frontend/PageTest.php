<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * Atrium's page (D-079): one Blade view at every path under client_path,
 * booting the prebuilt front end with the import map of the shared modules
 * (D-082), then every module the user gets, gated by its integration.
 */

const PAGE_FIXTURES = __DIR__.'/../../Fixtures/Frontend';

function pageUser(): User
{
    return User::query()->where('email', 'ann@example.com')->first()
        ?? User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
}

/**
 * The page's boot data, decoded.
 *
 * @return array<string, mixed>
 */
function bootData(string $html): array
{
    preg_match('#<script type="application/json" id="atrium-boot">(.*?)</script>#s', $html, $matches);

    /** @var array<string, mixed> */
    return json_decode($matches[1] ?? 'null', true, flags: JSON_THROW_ON_ERROR);
}

/**
 * The page's import map, decoded.
 *
 * @return array<string, string>
 */
function importMap(string $html): array
{
    preg_match('#<script type="importmap"\s*>(.*?)</script>#s', $html, $matches);

    /** @var array{imports: array<string, string>} $map */
    $map = json_decode($matches[1] ?? 'null', true, flags: JSON_THROW_ON_ERROR);

    return $map['imports'];
}

beforeEach(function (): void {
    Gate::define('viewAtrium', fn (): bool => true);
    Route::get('login', fn () => 'login')->name('login');
});

it('serves the page at client_path and every path under it, for the front end to route', function (string $path): void {
    config(['atrium.client_path' => '/atrium']);

    $this->actingAs(pageUser())->get($path)
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-store, private')
        ->assertSee('<div id="atrium"></div>', false);
})->with(['/atrium', '/atrium/', '/atrium/showroom/products/VEC-1', '/atrium/settings?tab=x']);

it('keeps the API\'s own paths out of the page', function (): void {
    $this->actingAs(pageUser())->get('/atrium/api/nothing-here')
        ->assertNotFound()
        ->assertDontSee('<div id="atrium"></div>', false);
});

it('sends a guest to the app\'s login and refuses a user the gate refuses', function (): void {
    $this->get('/')->assertRedirect('/login');

    Gate::define('viewAtrium', fn (): bool => false);

    $this->actingAs(pageUser())->get('/')->assertForbidden();
});

it('boots the front end from JSON: the API, the client path, the user, the CSRF token, the theme and the icons', function (): void {
    $html = $this->actingAs(pageUser())->get('/')->assertOk()->getContent();
    $boot = bootData((string) $html);

    expect($boot)->toMatchArray([
        'version' => '2.0',
        'api_base' => url('atrium/api'),
        'client_path' => '/',
        'locale' => 'en',
        'theme' => 'atrium',
        'icons' => ['remote' => false],
        'modules' => [],
    ])
        ->and($boot['user'])->toMatchArray(['name' => 'Ann', 'email' => 'ann@example.com'])
        ->and($boot['csrf_token'])->toBeString()->not->toBe('')
        ->and($boot['known_integrations'])->toBe([])
        ->and((string) $html)->toContain('<meta name="csrf-token" content="'.$boot['csrf_token'].'">');
});

it('maps every shared module to the build\'s own chunk, and loads the app\'s entry and stylesheets', function (): void {
    $html = (string) $this->actingAs(pageUser())->get('/')->getContent();
    $build = json_decode((string) file_get_contents(dirname(__DIR__, 3).'/dist/build.json'), true);
    $version = substr($build['hash'], 0, 12);
    $base = url('vendor/atrium/atrium/'.$version);

    expect(importMap($html))->toBe(array_map(fn (string $file): string => $base.'/'.$file, $build['imports']))
        ->and(array_keys(importMap($html)))->toBe(['vue', 'vue-router', 'pinia', 'vue-i18n', '@vueuse/core', 'openapi-fetch', '@refactor-circus/atrium', '@refactor-circus/atrium/ui'])
        ->and($html)->toContain('<script type="module" src="'.$base.'/'.$build['entry']['script'].'"')
        ->and($html)->toContain('<link rel="stylesheet" href="'.$base.'/'.$build['entry']['styles'][0].'">');
});

it('loads a module registered with Atrium::module(), its script before Atrium\'s own entry', function (): void {
    Atrium::module(PAGE_FIXTURES.'/billing');

    $html = (string) $this->actingAs(pageUser())->get('/')->getContent();
    $script = url('vendor/atrium/billing/abcdef012345/dist/atrium/atrium.js');

    expect($html)->toContain('<script type="module" src="'.$script.'"')
        ->and($html)->toContain('<link rel="stylesheet" href="'.url('vendor/atrium/billing/abcdef012345/dist/atrium/atrium.css').'">')
        ->and(strpos($html, $script))->toBeLessThan(strrpos($html, '<script type="module"'))
        ->and(bootData($html)['modules'])->toBe([[
            'key' => 'billing',
            'integration' => null,
            'scripts' => [$script],
            'styles' => [url('vendor/atrium/billing/abcdef012345/dist/atrium/atrium.css')],
        ]]);
});

it('loads an integration\'s module only while that integration is registered and active', function (): void {
    // The fixture module ships dist/atrium/integration.json (D-090).
    Atrium::module(PAGE_FIXTURES.'/roster');

    $before = bootData((string) $this->actingAs(pageUser())->get('/')->getContent());

    expect($before['modules'])->toBe([])
        ->and($before['known_integrations'])->toBe(['roster']);

    IntegrationFixture::registerFakes('roster');

    $boot = bootData((string) $this->actingAs(pageUser())->get('/')->getContent());

    expect(array_column($boot['modules'], 'integration', 'key'))->toBe(['roster' => 'roster'])
        ->and($boot['integrations']['roster'])->toBe(['api_base' => url('roster/api'), 'active' => true]);
});

it('leaves out a module listed in atrium.disabled, and one built for another major of the shared API', function (): void {
    Atrium::module(PAGE_FIXTURES.'/billing');
    Atrium::module(PAGE_FIXTURES.'/legacy');

    expect(array_column(bootData((string) $this->actingAs(pageUser())->get('/')->getContent())['modules'], 'key'))->toBe(['billing']);

    config(['atrium.disabled' => ['billing']]);

    expect(bootData((string) $this->actingAs(pageUser())->get('/')->getContent())['modules'])->toBe([]);
});

it('loads the app\'s own scripts and stylesheets last: URLs from Atrium::script() and atrium.scripts', function (): void {
    config(['atrium.scripts' => ['https://cdn.example.test/one.js'], 'atrium.styles' => ['/css/atrium-extra.css']]);
    Atrium::script('/js/two.js')->style('https://cdn.example.test/two.css');

    $html = (string) $this->actingAs(pageUser())->get('/')->getContent();
    $app = collect(bootData($html)['modules'])->firstWhere('key', 'app');

    expect($app)->toBe([
        'key' => 'app',
        'integration' => null,
        'scripts' => ['https://cdn.example.test/one.js', '/js/two.js'],
        'styles' => ['/css/atrium-extra.css', 'https://cdn.example.test/two.css'],
    ])->and($html)->toContain('<script type="module" src="/js/two.js"');
});

it('refuses a module folder with no extra.atrium.scripts, and a reserved key', function (string $path): void {
    Atrium::module($path);
})->with([
    'no composer.json' => [__DIR__],
    'the reserved app key' => [PAGE_FIXTURES.'/../Frontend-reserved'],
])->throws(InvalidArgumentException::class);
