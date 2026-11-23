<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Facades\Atrium as AtriumFacade;

/*
 * The facade proxies through getFacadeAccessor(), so its `@method static`
 * lines are the only static API IDEs and PHPStan see: one per public method
 * of Atrium, with the same parameters (architecture/public-api).
 */

/**
 * The facade's `@method static` tags: method name to parameter names.
 *
 * @return array<string, list<string>>
 */
function facadeMethodTags(): array
{
    $docblock = (string) new ReflectionClass(AtriumFacade::class)->getDocComment();

    preg_match_all('/@method\s+static\s+.+?\s(\w+)\((.*)\)\s*$/m', $docblock, $matches, PREG_SET_ORDER);

    $tags = [];

    foreach ($matches as [, $name, $parameters]) {
        preg_match_all('/\$(\w+)/', $parameters, $names);

        $tags[$name] = $names[1];
    }

    ksort($tags);

    return $tags;
}

/**
 * Atrium's public instance methods: method name to parameter names.
 *
 * @return array<string, list<string>>
 */
function atriumPublicMethods(): array
{
    $methods = [];

    foreach (new ReflectionClass(Atrium::class)->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
        if ($method->isConstructor() || $method->isStatic() || str_starts_with($method->getName(), '__')) {
            continue;
        }

        $methods[$method->getName()] = array_map(
            fn (ReflectionParameter $parameter): string => $parameter->getName(),
            $method->getParameters(),
        );
    }

    ksort($methods);

    return $methods;
}

it('has one @method tag per public Atrium method, with the same parameters', function (): void {
    expect(facadeMethodTags())->not->toBeEmpty()
        ->and(facadeMethodTags())->toBe(atriumPublicMethods());
});

it('documents no removed method', function (string $method): void {
    expect(facadeMethodTags())->not->toHaveKey($method);
})->with(['css', 'stylesheet']);

it('points the facade at Atrium', function (): void {
    expect((string) new ReflectionClass(AtriumFacade::class)->getDocComment())->toContain('@see \\'.Atrium::class);
});
