<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Facades\Atrium;

/*
 * The asset route (D-081): Atrium's prebuilt files and each module's, served
 * from the packages, cached for good under the build's version, and nothing
 * else.
 */

function atriumBuild(): array
{
    /** @var array{hash: string, entry: array{script: string, styles: list<string>}, imports: array<string, string>} */
    return json_decode((string) file_get_contents(dirname(__DIR__, 3).'/dist/build.json'), true);
}

it('serves Atrium\'s entry, a shared chunk and its stylesheet, with their types, cached for a year', function (string $file, string $type): void {
    $version = substr(atriumBuild()['hash'], 0, 12);

    $this->get("/vendor/atrium/atrium/{$version}/{$file}")
        ->assertOk()
        ->assertHeader('Content-Type', $type)
        ->assertHeader('Cache-Control', 'immutable, max-age=31536000, public')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
})->with(fn (): array => [
    'the entry' => [atriumBuild()['entry']['script'], 'text/javascript; charset=utf-8'],
    'vue' => [atriumBuild()['imports']['vue'], 'text/javascript; charset=utf-8'],
    'the stylesheet' => [atriumBuild()['entry']['styles'][0], 'text/css; charset=utf-8'],
]);

it('serves an older version\'s URL with the current file, uncached', function (): void {
    $this->get('/vendor/atrium/atrium/000000000000/'.atriumBuild()['entry']['script'])
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-cache, public');
});

it('needs no session or sign-in', function (): void {
    $response = $this->get('/vendor/atrium/atrium/x/'.atriumBuild()['entry']['script'])->assertOk();

    expect($response->headers->getCookies())->toBe([]);
});

it('serves a module\'s files from the folders its composer.json names, chunks included', function (string $file): void {
    Atrium::module(__DIR__.'/../../Fixtures/Frontend/billing');

    $this->get('/vendor/atrium/billing/abcdef012345/'.$file)->assertOk();
})->with(['dist/atrium/atrium.js', 'dist/atrium/atrium.css', 'dist/atrium/chunks/page-abc.js']);

it('serves nothing outside them, no dotfile, no other extension, and no unknown owner', function (string $owner, string $file): void {
    Atrium::module(__DIR__.'/../../Fixtures/Frontend/billing');

    $this->get("/vendor/atrium/{$owner}/v/{$file}")->assertNotFound();
})->with([
    'a file beside the build' => ['billing', 'secret.js'],
    'composer.json' => ['billing', 'composer.json'],
    'a dotfile' => ['billing', 'dist/atrium/.hidden.json'],
    'a way out' => ['billing', 'dist/atrium/../../secret.js'],
    'an encoded way out' => ['billing', 'dist/atrium/%2e%2e/%2e%2e/secret.js'],
    'Atrium\'s manifest folder' => ['atrium', '.vite/manifest.json'],
    'a PHP file' => ['atrium', '../src/Atrium.php'],
    'an owner nobody registered' => ['nobody', 'dist/atrium/atrium.js'],
]);
