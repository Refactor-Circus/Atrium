<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Support\ClientPath;

it('maps a URL to the link the client follows, with the SPA at the root', function (?string $url, ?array $link): void {
    expect(new ClientPath('app.test', '/')->link($url))->toBe($link);
})->with([
    'null' => [null, null],
    'an empty string' => ['', null],
    'a relative path' => ['/orders', ['path' => '/orders', 'external' => false]],
    'a relative path with a query string' => ['/orders?status=open', ['path' => '/orders?status=open', 'external' => false]],
    'a relative path with a fragment' => ['/orders#recent', ['path' => '/orders#recent', 'external' => false]],
    'a same-host URL' => ['https://app.test/orders/5', ['path' => '/orders/5', 'external' => false]],
    'a same-host URL with a query and a fragment' => ['https://app.test/orders/5?tab=items#notes', ['path' => '/orders/5?tab=items#notes', 'external' => false]],
    'a same-host URL with no path' => ['https://app.test', ['path' => '/', 'external' => false]],
    'a same-host URL with only a query' => ['http://app.test?q=1', ['path' => '/?q=1', 'external' => false]],
    'a same-host URL on another port' => ['http://app.test:8000/orders', ['path' => '/orders', 'external' => false]],
    'a same-host URL with an upper-case host' => ['https://APP.test/orders', ['path' => '/orders', 'external' => false]],
    'a URL on another host' => ['https://docs.example/guide?x=1#y', ['path' => 'https://docs.example/guide?x=1#y', 'external' => true]],
    'a subdomain of the app host' => ['https://evil.app.test/orders', ['path' => 'https://evil.app.test/orders', 'external' => true]],
]);

it('maps a URL relative to a non-root client path', function (?string $url, ?array $link): void {
    expect(new ClientPath('app.test', '/admin')->link($url))->toBe($link);
})->with([
    'the client path itself' => ['https://app.test/admin', ['path' => '/', 'external' => false]],
    'the client path with a trailing slash' => ['https://app.test/admin/', ['path' => '/', 'external' => false]],
    'the client path with a query string' => ['https://app.test/admin?x=1', ['path' => '/?x=1', 'external' => false]],
    'a same-host URL under the client path' => ['https://app.test/admin/orders/5?tab=items', ['path' => '/orders/5?tab=items', 'external' => false]],
    'a relative path under the client path' => ['/admin/orders#notes', ['path' => '/orders#notes', 'external' => false]],
    'a same-host URL outside the client path' => ['https://app.test/billing', ['path' => 'https://app.test/billing', 'external' => true]],
    'a relative path outside the client path' => ['/billing?x=1', ['path' => '/billing?x=1', 'external' => true]],
    'a path that only starts with the client path' => ['https://app.test/administrator', ['path' => 'https://app.test/administrator', 'external' => true]],
    'a URL on another host' => ['https://docs.example/admin/x', ['path' => 'https://docs.example/admin/x', 'external' => true]],
]);

it('normalizes the client path it is given', function (string $clientPath): void {
    expect(new ClientPath('app.test', $clientPath)->link('https://app.test/admin/orders'))
        ->toBe(['path' => '/orders', 'external' => false]);
})->with(['admin', '/admin/', 'admin/']);

it('treats every absolute URL as external without an app host', function (): void {
    expect(new ClientPath(null, '/')->link('https://app.test/orders'))
        ->toBe(['path' => 'https://app.test/orders', 'external' => true])
        ->and(new ClientPath(null, '/')->link('/orders'))
        ->toBe(['path' => '/orders', 'external' => false]);
});

it('returns null for a link that is not an http(s) URL or a relative path, and never throws', function (string $url): void {
    expect(new ClientPath('app.test', '/')->link($url))->toBeNull()
        ->and(new ClientPath('app.test', '/admin')->link($url))->toBeNull();
})->with([
    'a javascript: URL' => ['javascript:alert(1)'],
    'a mixed-case javascript: URL' => ['JaVaScRiPt:alert(1)'],
    'a data: URL' => ['data:text/html;base64,PHNjcmlwdD4='],
    'a mailto: URL' => ['mailto:ops@app.test'],
    'an ftp URL' => ['ftp://app.test/file'],
    'a mixed-case https scheme' => ['HTTPS://app.test/orders'],
    'a mixed-case http scheme on another host' => ['Http://evil.test/'],
    'a protocol-relative URL' => ['//evil.test/orders'],
    'three leading slashes' => ['///evil.test'],
    'a slash then a backslash' => ['/\\evil.test'],
    'two backslashes' => ['\\\\evil.test'],
    'a backslash inside an absolute URL' => ['https://app.test\\@evil.test'],
    'a leading space' => [' https://app.test/orders'],
    'a leading tab' => ["\t/orders"],
    'a trailing newline' => ["/orders\n"],
    'a newline inside the scheme' => ["java\nscript:alert(1)"],
    'a NUL byte' => ["\0/orders"],
    'a DEL byte' => ["/orders\x7F"],
    'http: with no slashes' => ['http:evil.test'],
    'https: with no slashes' => ['https:evil.test/orders'],
    'a userinfo URL' => ['https://client.example@evil.test'],
    'a same-host userinfo URL' => ['https://user:secret@app.test/orders'],
    'an empty host' => ['https:///evil.test'],
    'a scheme and nothing else' => ['https://'],
    'a same-host URL whose path starts with two slashes' => ['https://app.test//evil.test'],
    'a bare relative path' => ['orders/5'],
    'a bare fragment' => ['#top'],
    'a bare query string' => ['?q=orders'],
]);

it('rejects a path that becomes protocol-relative once the client path is removed', function (): void {
    expect(new ClientPath('app.test', '/admin')->link('/admin//evil.test'))->toBeNull()
        ->and(new ClientPath('app.test', '/admin')->link('https://app.test/admin//evil.test'))->toBeNull();
});
