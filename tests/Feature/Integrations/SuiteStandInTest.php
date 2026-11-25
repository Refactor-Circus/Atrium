<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Atrium\SuiteStandIn;
use Workbench\App\Models\User;

/*
 * The workbench's stand-in for the suite's APIs checks a hook's record
 * references as a host does (D-092): it once answered Cortex's redirect
 * domains for `owner_type=roster.organization`, which no host resolves, so the
 * tab rendered on the bench and failed on every real host.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
    IntegrationFixture::installed('cortex', 'roster', 'showroom');
    IntegrationFixture::serveApi('cortex', 'roster', 'showroom');
    IntegrationFixture::register();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * @param  array<string, string>  $input
 */
function standInStatus(string $method, string $path, array $input): int
{
    $standIn = new SuiteStandIn;

    return $standIn(Request::create('/_suite/'.$path, $method, $input), $path)->getStatusCode();
}

it('refuses the suite\'s name for a record where a morph type belongs, as the packages\' APIs do', function (string $method, string $field): void {
    $request = Request::create('/_suite/cortex/redirect-domains', $method, [$field => 'roster.organization', 'owner_id' => 'acme']);

    expect(SuiteStandIn::unresolvedReference($request))->toBe([$field, "[roster.organization] is the suite's name for a record, not a morph type: no host can resolve it."])
        ->and(standInStatus($method, 'cortex/redirect-domains', [$field => 'roster.organization']))->toBe(422);
})->with([
    'a listed owner' => ['GET', 'owner_type'],
    'a stored owner' => ['POST', 'owner_type'],
    'a scope' => ['GET', 'scope_type'],
    'a subject' => ['GET', 'subject_type'],
]);

it('refuses a type no model has', function (): void {
    expect(SuiteStandIn::unresolvedReference(Request::create('/', 'GET', ['scope_type' => 'nowhere'])))->toBe(['scope_type', 'No model has the morph type [nowhere].']);
});

it('accepts the morph types a host stores: a screen\'s subject model, an alias, a model class, an aliased subject type', function (string $type): void {
    $morphMap = Relation::morphMap();
    Relation::morphMap(['member' => User::class]);

    try {
        expect(SuiteStandIn::unresolvedReference(Request::create('/', 'GET', ['owner_type' => $type, 'owner_id' => 'acme'])))->toBeNull();
    } finally {
        Relation::morphMap($morphMap, false);
    }
})->with([
    'Roster\'s organization model' => ['RefactorCircus\\Roster\\Domains\\Organization\\Models\\OrganizationModel'],
    'Roster\'s default user model' => ['App\\Models\\User'],
    'a morph alias' => ['member'],
    'a model class' => [User::class],
    'Showroom\'s product alias' => ['showroom_product'],
]);

it('leaves a request without a typed reference alone', function (): void {
    expect(SuiteStandIn::unresolvedReference(Request::create('/', 'GET', ['owner_type' => '', 'page' => '2'])))->toBeNull();
});
