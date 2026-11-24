<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleDiscovery;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Integrations\Services\ComposerInstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationHooks;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationManifests;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Integrations\Support\ManifestSchema;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * Integration manifests (D-090): a package declares its integration in
 * `integration.json`, which Atrium checks against the schema the SDK
 * publishes (`ui/sdk/schema/integration.schema.json`) and the manifest rules,
 * and registers exactly as it registered the PHP declarations before. The
 * cases in `ui/sdk/test/fixtures/manifests/cases.json` are checked here and by
 * the SDK's `validateIntegrationManifest()`, so both agree.
 */

/**
 * @return array{valid: array<string, mixed>, invalid: list<array{name: string, pointer: string, manifest: array<string, mixed>}>}
 */
function manifestCases(): array
{
    /** @var array{valid: array<string, mixed>, invalid: list<array{name: string, pointer: string, manifest: array<string, mixed>}>} */
    return json_decode((string) file_get_contents(__DIR__.'/../../../ui/sdk/test/fixtures/manifests/cases.json'), true, 512, JSON_THROW_ON_ERROR);
}

function manifestJson(mixed $value): mixed
{
    return json_decode((string) json_encode($value, JSON_THROW_ON_ERROR), false, 512, JSON_THROW_ON_ERROR);
}

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

describe('the schema and the rules', function (): void {
    it('accepts each suite manifest', function (string $key): void {
        $json = json_decode((string) file_get_contents(IntegrationFixture::manifest($key)), false, 512, JSON_THROW_ON_ERROR);

        expect(IntegrationManifests::error($json))->toBeNull()
            ->and($json->key)->toBe($key);
    })->with(['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']);

    it('accepts the shared valid case and the fixture manifest', function (): void {
        expect(IntegrationManifests::error(manifestJson(manifestCases()['valid'])))->toBeNull()
            ->and(IntegrationManifests::error(manifestJson(IntegrationFixture::fixtureManifest('acme'))))->toBeNull();
    });

    it('refuses each shared invalid case at its JSON pointer', function (): void {
        foreach (manifestCases()['invalid'] as $case) {
            $error = IntegrationManifests::error(manifestJson($case['manifest']));

            expect($error)->not->toBeNull($case['name'])
                ->and($error[0] ?? null)->toBe($case['pointer'], $case['name'].': '.($error[1] ?? ''));
        }
    });

    it('is the schema the SDK publishes', function (): void {
        expect(realpath(ManifestSchema::PATH))->toBe(realpath(__DIR__.'/../../../ui/sdk/schema/integration.schema.json'))
            ->and(ManifestSchema::schema()['title'])->toBe('Atrium integration manifest');
    });

    it('says which manifest is invalid, and where', function (): void {
        $file = IntegrationFixture::fakeManifest('cortex', [...IntegrationFixture::fixtureManifest('cortex'), 'label' => '']);
        IntegrationFixture::installed('cortex');
        IntegrationFixture::serveApi('cortex');

        expect(fn () => IntegrationFixture::register())->toThrow(
            InvalidIntegrationException::class,
            "The Atrium integration manifest [{$file}] is invalid at [/label]: must not be empty.",
        );
    });

    it('refuses a manifest that is not JSON, or is missing', function (): void {
        $file = IntegrationFixture::fakeManifest('cortex', '{"version": 1,');

        expect(fn () => app(IntegrationManifests::class)->read($file))->toThrow(InvalidIntegrationException::class, 'it is not valid JSON')
            ->and(fn () => app(IntegrationManifests::class)->read($file.'.missing'))->toThrow(InvalidIntegrationException::class, 'the file does not exist');
    });

    it('refuses a manifest whose key is not its module\'s', function (): void {
        $file = IntegrationFixture::fakeManifest('cortex', IntegrationFixture::fixtureManifest('billing'));
        IntegrationFixture::installed('cortex');
        IntegrationFixture::serveApi('cortex');

        expect(fn () => IntegrationFixture::register())->toThrow(InvalidIntegrationException::class, "[{$file}] is invalid at [/key]: it is [billing], but its module's key is [cortex]");
    });
});

describe('where manifests come from', function (): void {
    it('reads each installed package\'s manifest through atrium:discover\'s modules', function (): void {
        $vendor = sys_get_temp_dir().'/atrium-manifest-vendor-'.getmypid();
        File::deleteDirectory($vendor);
        File::ensureDirectoryExists($vendor.'/composer');
        File::ensureDirectoryExists($vendor.'/acme/billing/dist/atrium');
        File::ensureDirectoryExists($vendor.'/acme/ledger/dist/atrium');
        File::ensureDirectoryExists($vendor.'/acme/plain/dist/atrium');
        file_put_contents($vendor.'/acme/billing/dist/atrium/integration.json', json_encode(IntegrationFixture::fixtureManifest('billing')));
        file_put_contents($vendor.'/acme/ledger/dist/atrium/ledger.json', json_encode(IntegrationFixture::fixtureManifest('ledger')));
        file_put_contents($vendor.'/composer/installed.json', json_encode(['packages' => [
            ['name' => 'acme/billing', 'install-path' => '../acme/billing', 'extra' => ['atrium' => ['scripts' => ['dist/atrium/atrium.js']]]],
            ['name' => 'acme/ledger', 'install-path' => '../acme/ledger', 'extra' => ['atrium' => ['scripts' => ['dist/atrium/atrium.js'], 'integration' => 'dist/atrium/ledger.json']]],
            ['name' => 'acme/plain', 'install-path' => '../acme/plain', 'extra' => ['atrium' => ['scripts' => ['dist/atrium/atrium.js']]]],
        ]]));

        $packages = new ComposerInstalledPackages(new ModuleDiscovery(new Filesystem, $vendor));

        expect($packages->integrations())->toBe([
            'billing' => $vendor.'/acme/billing/dist/atrium/integration.json',
            'ledger' => $vendor.'/acme/ledger/dist/atrium/ledger.json',
        ]);

        File::deleteDirectory($vendor);
    });

    it('registers the manifest a module folder added with Atrium::module() ships', function (): void {
        Atrium::module(__DIR__.'/../../Fixtures/Frontend/roster');
        IntegrationFixture::serveApi('roster');

        expect(IntegrationFixture::register()->get('roster')?->screens)->toHaveKeys(['roster.records', 'roster.record']);
    });

    it('registers a manifest-only integration with Atrium::integration(), from an array or a path', function (): void {
        config()->set('atrium.integrations.vault.api_base', '/vault/api');
        Atrium::integration(IntegrationFixture::fixtureManifest('vault'));
        Atrium::integration(IntegrationFixture::fakeManifest('safe', IntegrationFixture::fixtureManifest('safe')));
        config()->set('atrium.integrations.safe.api_base', '/safe/api');

        $registry = IntegrationFixture::register();

        expect(array_keys($registry->all()))->toBe(['safe', 'vault'])
            ->and($registry->get('vault')?->label)->toBe('Vault')
            ->and($registry->known())->toBe(['safe', 'vault']);
    });

    it('lets Atrium::integration() win over an installed package\'s manifest', function (): void {
        Atrium::integration([...IntegrationFixture::fixtureManifest('cortex'), 'label' => 'Our Cortex']);
        IntegrationFixture::installed('cortex');
        IntegrationFixture::serveApi('cortex');

        expect(IntegrationFixture::register()->get('cortex')?->label)->toBe('Our Cortex');
    });

    it('refuses an invalid manifest given to Atrium::integration() at once', function (): void {
        Atrium::integration(['version' => 1, 'key' => 'vault']);
    })->throws(InvalidIntegrationException::class, '[Atrium::integration()] is invalid at [/]: must have the property [label]');

    it('reads no installed package while atrium.discover is off', function (): void {
        config()->set('atrium.discover', false);
        IntegrationFixture::registerFakes('cortex');

        expect(app(IntegrationRegistry::class)->all())->toBe([]);
    });
});

describe('expressions', function (): void {
    /**
     * The acme integration of the shared valid case, registered with Roster.
     */
    function manifestAcme(): IntegrationRegistry
    {
        IntegrationFixture::fakeManifest('acme', manifestCases()['valid']);
        IntegrationFixture::installed('acme', 'roster');
        IntegrationFixture::serveApi('acme', 'roster');

        return IntegrationFixture::registerWithHooks();
    }

    /**
     * @return array<string, mixed>
     */
    function manifestTabData(string $screen, string $tab): ?array
    {
        foreach (app(ScreenExtensions::class)->tabs($screen) as $definition) {
            if ($definition->key === $tab) {
                return $definition->resolveData(null, Screen::make($screen));
            }
        }

        return null;
    }

    it('reads $config with its default, and its cast', function (): void {
        expect(manifestAcme()->get('acme')?->screen('acme.records')?->options)->toBe(['prefix' => 'a:', 'static' => ['nested' => [1, 'two', null]]])
            ->and(app(IntegrationRegistry::class)->get('acme')?->navigation[0]->live['options'])->toBe(['sort' => 10]);
    });

    it('reads $config from the host\'s config', function (): void {
        config()->set('acme.prefix', 'b:');
        config()->set('atrium.integrations.acme.nav.sort', '25');

        $acme = manifestAcme()->get('acme');

        expect($acme?->screen('acme.records')?->options['prefix'])->toBe('b:')
            ->and($acme?->navigation[0]->live['options'])->toBe(['sort' => 25]);
    });

    it('places each hook as its default says, with $screen, $option and $subject_scope data', function (): void {
        config()->set('acme.adopt.scopes', ['organization' => 'org']);

        manifestAcme();

        expect(manifestTabData('roster.user', 'acme.notes'))->toBe(['owner' => 'roster.user'])
            ->and(manifestTabData('roster.user', 'acme.access'))->toBe(['scope' => null])
            ->and(manifestTabData('roster.organization', 'acme.activity'))->toBe(['scope' => true])
            ->and(array_map(fn ($section) => $section->key, app(ScreenExtensions::class)->sections('roster.organization', 'aside')))->toBe(['acme.note-list']);
    });

    it('lets the host move a hook with atrium.integrations.{pkg}.{config}', function (): void {
        config()->set('atrium.integrations.acme.notes.screens', ['roster.organization' => 'tab']);

        manifestAcme();

        expect(manifestTabData('roster.organization', 'acme.notes'))->toBe(['owner' => 'roster.organization'])
            ->and(manifestTabData('roster.user', 'acme.notes'))->toBeNull();
    });

    it('skips a $subject_scope that does not resolve, warning once', function (): void {
        Log::spy();

        IntegrationFixture::fakeManifest('acme', [...manifestCases()['valid'], 'hooks' => [[
            ...manifestCases()['valid']['hooks'][1],
            'default' => ['roster.organization' => ['acme.access']],
        ]]]);
        IntegrationFixture::installed('acme', 'roster');
        IntegrationFixture::serveApi('acme', 'roster');
        IntegrationFixture::registerWithHooks();
        app()->forgetInstance(IntegrationHooks::class);
        app(IntegrationHooks::class)->register();

        expect(manifestTabData('roster.organization', 'acme.access'))->toBeNull();

        Log::shouldHaveReceived('warning')->withArgs(fn (string $message): bool => str_contains($message, '[acme.access] tab on [roster.organization]')
            && str_contains($message, '[atrium.integrations.acme.scopes.organization], or [acme.adopt.scopes.organization]'))->once();
    });
});

it('translates every label through the host\'s lang JSON', function (): void {
    app('translator')->addLines(['*.Carts' => 'Warenkörbe', '*.Carts by type' => 'Warenkörbe nach Art'], 'de');
    app()->setLocale('de');

    IntegrationFixture::installed('polycart');
    IntegrationFixture::serveApi('polycart');
    $polycart = IntegrationFixture::register()->get('polycart');

    expect($polycart?->navigation[0]->label)->toBe('Warenkörbe')
        ->and($polycart?->widgets[0]->label)->toBe('Warenkörbe nach Art');
});

it('ships no PHP declaration, feature class or label file of any package', function (): void {
    expect(is_dir(__DIR__.'/../../../src/Integrations'))->toBeFalse()
        ->and(is_dir(__DIR__.'/../../../lang/en/integrations'))->toBeFalse();
});

it('keeps every suite screen\'s tabs and sections as the PHP declarations made them (D-090)', function (): void {
    $keys = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'];
    config()->set('guardian.adopt.scope_types', ['organization' => 'roster_organization', 'team' => 'roster_team']);
    IntegrationFixture::installed(...$keys);
    IntegrationFixture::serveApi(...$keys);
    IntegrationFixture::registerWithHooks();

    $screens = [];

    foreach (app(IntegrationRegistry::class)->all() as $integration) {
        foreach ($integration->screens as $key => $declaration) {
            $screen = Screen::make($key)->kind($declaration->kind);
            $entry = [];

            foreach (app(ScreenExtensions::class)->tabs($key) as $tab) {
                $entry['tabs'][$tab->key] = $tab->resolveData(null, $screen);
            }

            foreach (['header.actions', 'before', 'after', 'aside', 'row.actions'] as $slot) {
                foreach (app(ScreenExtensions::class)->sections($key, $slot) as $section) {
                    $entry['sections'][$slot][$section->key] = $section->resolveData(null, $screen);
                }
            }

            if ($entry !== []) {
                $screens[$key] = $entry;
            }
        }
    }

    $path = __DIR__.'/../../Fixtures/Integrations/suite-screens.json';
    $actual = json_encode($screens, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n";

    if (getenv('UPDATE_FIXTURES') === '1') {
        file_put_contents($path, $actual);
    }

    expect($actual)->toBe((string) file_get_contents($path));
});
