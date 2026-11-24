<?php

declare(strict_types=1);

/*
 * The documentation promises of Atrium 2 (AC 23 and 25, D-079 to D-087): the
 * README covers installing, host-chosen auth (the session by default) and
 * the front end Atrium serves with its modules; the README and the Boost
 * skill explain screen extensions as JSON plus components a module
 * registers; the agent docs describe the API + page + modules model; none of
 * them still teaches the removed Blade UI, the replaced Nuxt layer or the
 * history screen that moved to Keen. The suite integrations (AC 76) follow
 * further down.
 */

/**
 * A level-two section of a Markdown file: from its heading up to the next one.
 */
function docsSection(string $path, string $heading): string
{
    $markdown = (string) file_get_contents($path);

    if (preg_match('/^## '.preg_quote($heading, '/').'\R(.*?)(?=^## |\z)/ms', $markdown, $matches) !== 1) {
        return '';
    }

    return $matches[1];
}

function docsPath(string $path): string
{
    return dirname(__DIR__, 2).'/'.$path;
}

it('documents installing Atrium', function (): void {
    expect(docsSection(docsPath('README.md'), 'Installation'))->not->toBe('')
        ->toContain('composer require refactor-circus/atrium')
        ->toContain('php artisan atrium:install')
        ->toContain('php artisan migrate')
        ->toContain('viewAtrium')
        ->toContain('AtriumUser')
        ->toContain('/atrium')
        ->toContain('atrium/api');
});

it('documents host-chosen auth', function (): void {
    expect(docsSection(docsPath('README.md'), 'Authentication'))->not->toBe('')
        // Atrium ships none: the page and its API share the session by
        // default, and the host's guard goes before Authorize.
        ->toContain("'web', 'auth', Authorize::class")
        ->toContain('X-XSRF-TOKEN')
        ->toContain('401')
        ->toContain('auth:sanctum')
        ->toContain('auth:api')
        ->toContain('Authorize::class')
        // Cookie auth needs CORS and CSRF.
        ->toContain('CORS')
        ->toContain('CSRF')
        ->toContain('supports_credentials')
        ->toContain('/sanctum/csrf-cookie')
        ->toContain("credentials: 'include'")
        // Token auth sends the Authorization header; the host stores the token.
        ->toContain('`Authorization` header')
        ->toContain('Bearer')
        ->toContain('Atrium never reads or writes it')
        // The auth adapter and its 401 hook.
        ->toContain('useAtrium().auth(')
        ->toContain('onUnauthorized');
});

it('warns about the local gate fallback', function (): void {
    expect(docsSection(docsPath('README.md'), 'Authentication'))
        ->toContain('APP_ENV=local')
        ->toContain('any authenticated user')
        ->toContain('staging');
});

it('documents the front end and its modules', function (): void {
    expect(docsSection(docsPath('README.md'), 'The front end'))->not->toBe('')
        // The page and its files (D-079, D-081).
        ->toContain('atrium::app')
        ->toContain('client_path')
        ->toContain('/vendor/atrium/{owner}/{version}/{path}')
        ->toContain('atrium.client.enabled')
        // The module contract (D-082 to D-084).
        ->toContain('defineAtriumModule(')
        ->toContain('extra.atrium')
        ->toContain('atrium:discover')
        ->toContain('Atrium::module(')
        ->toContain('Atrium::script(')
        ->toContain('Atrium::style(')
        ->toContain('atrium.scripts')
        ->toContain('MODULES.md')
        // The shared modules and the SDK.
        ->toContain('ATRIUM_SHARED_API')
        ->toContain('@refactor-circus/atrium/ui')
        ->toContain('github:refactor-circus/atrium#v2.0.0&path:ui/sdk')
        ->toContain('atriumModule(')
        // Icons (D-010) and locales (D-003, D-011).
        ->toContain('i-lucide-')
        ->toContain('addAtriumIcons(')
        ->toContain('atrium.icons.remote')
        ->toContain('locale')
        // Version skew (D-004).
        ->toContain('api_version');
});

/**
 * The "Screen extensions" section of the README and the Boost skill.
 */
dataset('screen extension docs', [
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
]);

it('documents screen extensions', function (string $path): void {
    $section = docsSection($path, 'Screen extensions');

    expect($section)->not->toBe('')
        ->and($section)->toContain('boot()')
        ->and($section)->toContain('403')
        ->and($section)->toContain('vendor.key')
        ->and($section)->toContain('Keystone')
        ->and($section)->toContain('config');
})->with('screen extension docs');

it('documents every part of the registry', function (string $path): void {
    $section = docsSection($path, 'Screen extensions');

    expect($section)
        // Registration examples: a tab, a section, a row section, a wildcard,
        // and the host's declaration.
        ->toContain('->tab(')
        ->toContain('->section(')
        ->toContain("'row.actions'")
        ->toContain("->section('*'")
        ->toContain('Screen::standard(')
        // Closures receive the screen last; wildcard closures return early.
        ->toContain('Screen $screen')
        ->toContain('$screen->key')
        // What renders around an open registered tab.
        ->toContain('header.actions')
        // Rendered on the client: the component key, the module that
        // registers it, and the JSON payload.
        ->toContain('->component(')
        ->toContain('defineAtriumModule(')
        ->toContain('ResolvedScreenResource')
        // Duplicates per environment and across targets.
        ->toContain('production')
        ->toContain('{package}.*')
        // The suite rule and the config-defaults pattern.
        ->toContain('suggest');
})->with('screen extension docs');

it('teaches nothing of the removed Blade UI', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('x-atrium::')
        ->not->toContain('->view(')
        ->not->toContain('Icons::svg')
        ->not->toContain('AtriumStyles')
        ->not->toContain('Atrium::css(')
        ->not->toContain('Atrium::stylesheet(')
        ->not->toContain('build:css')
        ->not->toContain('test:browser')
        ->not->toContain('atrium.path')
        ->not->toContain('loadDashboardRoutesFrom')
        ->not->toContain('resources/css/atrium.css');
})->with([
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'components standard' => docsPath('docs/agent/standards/atrium/components.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('teaches nothing of the replaced Nuxt layer', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('nuxt/layer')
        ->not->toContain('nuxt/playground')
        ->not->toContain('defineNuxtPlugin')
        ->not->toContain('definePageMeta')
        ->not->toContain('runtimeConfig')
        ->not->toContain('pnpm -C nuxt')
        ->not->toContain('composer test:nuxt')
        ->not->toContain('$atrium.')
        ->not->toContain('AuthenticateWorkbenchToken');
})->with([
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'components standard' => docsPath('docs/agent/standards/atrium/components.md'),
    'integrations standard' => docsPath('docs/agent/standards/atrium/integrations.md'),
]);

it('describes the API, page and modules model in the agent docs', function (string $path, array $phrases): void {
    expect((string) file_get_contents($path))->toContain(...$phrases);
})->with([
    'CLAUDE.md' => [docsPath('CLAUDE.md'), ['ui/sdk', 'composer test:ui', 'atrium::app', 'defineAtriumModule(', 'extra.atrium', 'Iconify', 'JsonData']],
    'components standard' => [docsPath('docs/agent/standards/atrium/components.md'), ['ui/sdk', 'defineAtriumModule(', 'widgets', 'extensions', 'settingsPanels', 'component', 'Nuxt UI', 'Iconify']],
    'domains standard' => [docsPath('docs/agent/standards/atrium/domains.md'), ['loadApiRoutesFrom()', 'atrium.routes.prefix', 'atrium.plugins.{key}.', 'Resources/', 'Http/Resources/']],
    'Boost skill' => [docsPath('resources/boost/skills/atrium-development/SKILL.md'), ['atrium.routes.middleware', 'defineAtriumModule(', 'extra.atrium', 'client_path', 'i-lucide-']],
]);

it('mentions no history screen or audit component', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('atrium.history')
        ->not->toContain('x-atrium::audit')
        ->not->toContain('audit-trail')
        ->not->toContain('historyNavItem')
        ->not->toContain('history/{package}');
})->with([
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('lists the Screens domain and drops History', function (string $path): void {
    expect((string) file_get_contents($path))
        ->toContain('`Screens`')
        ->not->toContain('`History`');
})->with([
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('has an upgrade note for the history removal pointing to Keen', function (): void {
    $changelog = (string) file_get_contents(docsPath('CHANGELOG.md'));

    expect($changelog)
        ->toContain('atrium.history.show')
        ->toContain('HistoryController')
        ->toContain('HistoryServiceProvider')
        ->toContain('Plugin::historyNavItem()')
        ->toContain('x-atrium::audit-trail')
        ->toContain('x-atrium::audit.entries')
        ->toContain('refactor-circus/keen')
        ->toContain('ScreenExtensions');
});

/*
 * The suite integrations (AC 76): the README's "Suite integrations" section
 * covers detection, the API base, Pennant flags, the hook keys, the module
 * routes, each package's client, Atrium's own OpenAPI and client, and the
 * parity departures; the agent docs and the local standard describe them.
 */

it('documents detecting and enabling an integration', function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))->not->toBe('')
        ->toContain('Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom')
        ->toContain('integration.json')
        ->toContain('extra.atrium.integration')
        ->toContain('atrium:discover')
        ->toContain('`atrium.integrations.{pkg}.enabled`')
        ->toContain('"false"')
        // Atrium's PHP never loads a package's classes.
        ->toContain('never loads');
});

it('documents the API base and turning on the Polycart and Roster APIs behind auth', function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('`atrium.integrations.{pkg}.api_base`')
        ->toContain('`{pkg}.routes.prefix`')
        ->toContain('`{pkg}.routes.enabled`')
        ->toContain('`polycart.routes.enabled`')
        ->toContain('`roster.routes.enabled`')
        ->toContain('auth:sanctum')
        ->toContain('warning')
        ->toContain('atriumClientOptions(');
});

it('documents the Pennant flags and turning an integration off per user', function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('Pennant')
        ->toContain('`atrium.integrations.{pkg}.features`')
        ->toContain('`{pkg}.atrium`')
        ->not->toContain('{Pkg}Feature')
        ->toContain('Feature::for($user)->deactivate(')
        ->toContain('active: false')
        ->toContain('Without Pennant');
});

it('documents each hook key with its default', function (string $phrase): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))->toContain($phrase);
})->with([
    'atrium.integrations.cortex.redirect_domains.screens',
    "'roster.organization' => 'tab'",
    "'roster.user' => 'aside'",
    'atrium.integrations.impex.run_link.screens',
    "'showroom.transfers' => 'row.actions'",
    'atrium.integrations.keen.history',
    "'exclude' => ['keen.*', 'atrium.*']",
    "'tabs' => ['roster.organization' => ['scope' => true]]",
    "'sort' => 90",
    'atrium.integrations.showroom.transfers.flow_prefix',
    "'showroom:'",
]);

it('documents the module routes of every integration', function (string $pkg): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))->toContain('`/'.$pkg.'/');
})->with(['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']);

it('documents the screen route, the unavailable page and page overrides', function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('`atrium.screens.show`')
        ->toContain('AtriumIntegrationUnavailable')
        ->toContain('/roster/invitations/:token')
        ->toContain('public: true')
        ->toContain('same path');
});

it("documents each package's own module and client (D-089)", function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('extra.atrium')
        ->toContain('atrium/src/routes.ts')
        ->toContain('schema.d.ts')
        ->toContain('useAtriumIntegration(')
        ->toContain('atriumClientOptions(')
        ->toContain('D-089')
        ->not->toContain('sync:clients')
        ->not->toContain('ui/modules');
});

it('stages no suite module and vendors no package client (D-089)', function (string $path): void {
    expect((string) file_get_contents(docsPath($path)))
        ->not->toContain('ui/modules')
        ->not->toContain('sync:clients')
        ->not->toContain('VendoredClientsTest');
})->with(['README.md', 'MODULES.md', 'resources/boost/skills/atrium-development/SKILL.md', 'docs/agent/standards/atrium/domains.md', 'ui/package.json', 'ui/pnpm-workspace.yaml', '.github/workflows/ui.yml']);

it('turns MODULES.md into the guide to writing a module, with the eight packages as examples (D-089)', function (): void {
    $modules = (string) file_get_contents(docsPath('MODULES.md'));

    expect(docsSection(docsPath('MODULES.md'), 'Writing a module'))->not->toBe('')
        ->toContain('ATRIUM_SUITE_PATH')
        ->toContain('extra.atrium')
        ->toContain('atriumModule(')
        ->and($modules)->not->toContain('Phase 2')
        ->not->toContain('staged');

    foreach (['Cortex', 'Guardian', 'Impex', 'Keen', 'PennantPlus', 'Polycart', 'Roster', 'Showroom'] as $package) {
        expect(docsSection(docsPath('MODULES.md'), 'Writing a module'))->toContain('| '.$package.' |');
    }
});

it('documents the integration manifest: the contract, the writing step and the schema (D-090)', function (): void {
    $modules = (string) file_get_contents(docsPath('MODULES.md'));

    expect(docsSection(docsPath('MODULES.md'), 'The contract'))->not->toBe('')
        ->toContain('### 8. The integration manifest')
        ->toContain('@refactor-circus/atrium/schema/integration.schema.json')
        ->toContain('$config')
        ->toContain('$screen')
        ->toContain('$subject_scope')
        ->toContain('`map`')
        ->toContain('`lists`')
        ->toContain('`targets`')
        ->toContain('`options`')
        ->and(docsSection(docsPath('MODULES.md'), 'Writing a module'))
        ->toContain('src/integration.json')
        ->toContain('expectIntegrationManifest(')
        ->toContain('"integration": "dist/atrium/integration.json"')
        ->and($modules)->not->toContain('src/Integrations/{Pkg}')
        ->and(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('### Integration manifests')
        ->toContain('Atrium::integration(')
        ->toContain('InvalidIntegrationException')
        ->toContain('lang/{locale}.json');
});

it('documents the workbench loading the sibling checkouts\' modules', function (): void {
    expect((string) file_get_contents(docsPath('README.md')))
        ->toContain('ATRIUM_SUITE_PATH=/path/to/checkouts composer serve')
        ->toContain('fallback cards');
});

it("documents Atrium's own OpenAPI document and client", function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('openapi.json')
        ->toContain('composer openapi:export')
        ->toContain('pnpm -C ui generate:client')
        ->toContain('useAtriumClient()')
        ->toContain('OpenApiTest');
});

it('documents the parity departures', function (): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))
        ->toContain('D-031')
        ->toContain('D-032')
        ->toContain('permission')
        ->toContain('Operator mode')
        ->toContain('CHANGELOG');
});

/*
 * The Guardian integration (AC 100): turning on Guardian's API behind auth,
 * `scope_types`, the two-factor and session middleware with the challenge
 * and setup pages, the deadline header through CORS, token drivers and the
 * 501 state, passkeys, the hook keys with their defaults, and the modules'
 * `responseHandlers`; the agent docs, the local standard and the pull
 * request template follow.
 */

it('documents the Guardian integration', function (string $phrase): void {
    expect(docsSection(docsPath('README.md'), 'Suite integrations'))->toContain($phrase);
})->with([
    '`guardian.routes.enabled`',
    '`atrium.integrations.guardian.scope_types`',
    'guardian.adopt.scope_types',
    '`guardian.two-factor`',
    '`guardian.session`',
    '/guardian/two-factor/challenge',
    '/guardian/two-factor/setup',
    'Guardian-Two-Factor-Deadline',
    'exposed_headers',
    '`guardian.tokens.driver`',
    '501',
    'web-auth/webauthn-lib',
    'HTTPS',
    '`guardian.two_factor.passkeys.rp_id`',
    '`atrium.integrations.guardian.screens`',
    "'roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim']",
    "'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities']",
    'responseHandlers',
    '`guardian.scim.prefix`',
]);

it('describes Guardian in the agent docs and the integrations standard', function (string $path, array $phrases): void {
    expect((string) file_get_contents($path))->toContain(...$phrases);
})->with([
    'CLAUDE.md' => [docsPath('CLAUDE.md'), ['Guardian', 'RefactorCircus\\{Cortex,Guardian,', 'responseHandler(', 'public: true']],
    'integrations standard' => [docsPath('docs/agent/standards/atrium/integrations.md'), ['Guardian', 'responseHandler(', 'public: true', 'roles and permissions']],
    'Boost skill' => [docsPath('resources/boost/skills/atrium-development/SKILL.md'), ['guardian.routes.enabled', 'atrium.integrations.guardian.screens', 'responseHandler(']],
]);

it('has Guardian in the pull request template\'s D-089 release items', function (): void {
    $template = (string) file_get_contents(docsPath('.github/pull_request_template.md'));

    preg_match('/^### [^\n]*D-089[^\n]*\n(.*?)(?=^#)/ms', $template, $section);

    expect($section[1] ?? '')->toContain('Guardian');
});

it('lists the screen route in the API table', function (): void {
    expect(docsSection(docsPath('README.md'), 'The API'))
        ->toContain('`atrium.screens.show`')
        ->toContain('`GET screens/{screen}`');
});

it('describes the integrations in the agent docs', function (string $path, array $phrases): void {
    expect((string) file_get_contents($path))->toContain(...$phrases)
        ->not->toContain('src/Integrations/{Pkg}')
        ->not->toContain('{Pkg}Feature');
})->with([
    'CLAUDE.md' => [docsPath('CLAUDE.md'), ['src/Domains/Integrations', 'integration.json', 'D-090', 'ui/sdk/schema/integration.schema.json', 'expectIntegrationManifest()', 'atrium/integrations', 'useAtriumIntegration(', 'D-089', 'MODULES.md']],
    'components standard' => [docsPath('docs/agent/standards/atrium/components.md'), ['D-089', 'MODULES.md', 'useAtriumIntegration(', '[[integrations]]']],
    'domains standard' => [docsPath('docs/agent/standards/atrium/domains.md'), ['`Integrations`', 'D-090', 'atrium.screens.show']],
    'Boost skill' => [docsPath('resources/boost/skills/atrium-development/SKILL.md'), ['atrium.integrations.{pkg}.enabled', 'integration.json', 'Atrium::integration(', 'polycart.atrium', 'polycart.routes.enabled', 'roster.routes.enabled', 'Pennant', 'useAtriumIntegration(']],
]);

it('has the local integrations standard', function (): void {
    $standard = (string) file_get_contents(docsPath('docs/agent/standards/atrium/integrations.md'));

    expect($standard)
        ->toStartWith("---\n")
        ->toContain('description:')
        ->toContain('kind: architectural')
        // Layout.
        ->toContain('src/Domains/Integrations')
        ->toContain('atrium/src/integration.json')
        ->toContain('D-090')
        ->toContain('ui/sdk/schema/integration.schema.json')
        ->toContain('cases.json')
        ->toContain('atrium/')
        ->toContain('D-089')
        ->toContain('src/routes.ts')
        ->toContain('src/atrium.ts')
        // Data-only PHP, Vue through clients.
        ->toContain('static')
        ->toContain('RefactorCircus\\Cortex')
        ->toContain('useAtriumIntegration(')
        // Gating and hooks.
        ->toContain('InstalledPackages')
        ->toContain('Pennant')
        ->toContain('IntegrationHooks')
        ->toContain('$config')
        // No vendored clients (D-089 supersedes D-020).
        ->not->toContain('sync:clients')
        ->toContain('D-020')
        ->toContain('D-032');
});

it('lists the integrations standard in the standards index', function (): void {
    // The index is generated by ringside and git-ignored; a fresh checkout
    // has none until `vendor/bin/ringside sync` (or `composer install`) runs.
    if (! is_file(docsPath('docs/agent/standards.index.yml'))) {
        $this->markTestSkipped('No standards index: run vendor/bin/ringside sync.');
    }

    expect((string) file_get_contents(docsPath('docs/agent/standards.index.yml')))
        ->toContain('atrium/integrations:')
        ->toContain('path: docs/agent/standards/atrium/integrations.md');
});

it('has the integration release items in the pull request template', function (): void {
    $template = (string) file_get_contents(docsPath('.github/pull_request_template.md'));

    expect($template)
        // D-089: each package ships its own module, pinned to the SDK's tag.
        ->toContain('MODULES.md')
        ->toContain('D-089')
        ->toContain('github:refactor-circus/atrium#v2.0.0&path:ui/sdk')
        ->not->toContain('ui/modules')
        // D-037: the Keystone constraint.
        ->toContain('refactor-circus/keystone')
        ->toContain('D-037');

    // Every release item names its owner.
    $releaseChecks = (string) strstr($template, '## Release checks');

    preg_match_all('/^- \[ \] .*$(?:\n(?!- \[ \]|#).*)*/m', $releaseChecks, $items);

    expect($items[0])->not->toBeEmpty();

    foreach ($items[0] as $item) {
        expect($item)->toContain('Owner:');
    }
});

it('has the release checks in the pull request template', function (): void {
    expect((string) file_get_contents(docsPath('.github/pull_request_template.md')))
        // The placement uuid migration on the databases CI does not run.
        ->toContain('MySQL')
        ->toContain('Postgres')
        // Sibling packages stay on a tag range until they move to ^2.
        ->toContain('^1')
        ->toContain('dev-main')
        ->toContain('Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom')
        // The release tags giget and Composer resolve.
        ->toContain('v*')
        // The manual doc items, each with its owner.
        ->toContain('Owner: PR author')
        ->toContain('README')
        ->toContain('Boost skill')
        ->toContain('CLAUDE.md')
        ->toContain('atrium/components')
        ->toContain('atrium/domains');
});
