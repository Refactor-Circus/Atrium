<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Http\Requests\Request;

it('every atrium request declares how it persists', function (): void {
    $requests = glob(__DIR__.'/../../src/Domains/*/Http/Requests/*.php') ?: [];

    expect($requests)->not->toBeEmpty();

    foreach ($requests as $file) {
        $class = 'RefactorCircus\\Atrium\\Domains\\'.basename(dirname($file, 3)).'\\Http\\Requests\\'.basename($file, '.php');

        expect(is_subclass_of($class, Request::class))->toBeTrue();

        $method = new ReflectionMethod($class, 'persist');

        expect($method->isPublic())->toBeTrue()
            ->and($method->getDeclaringClass()->getName())->toBe($class);
    }
});

it('makes every dashboard and widget request final, on the base, with its own persist()', function (): void {
    $requests = glob(__DIR__.'/../../src/Domains/{Dashboard,Widgets}/Http/Requests/*.php', GLOB_BRACE) ?: [];

    expect($requests)->not->toBeEmpty();

    foreach ($requests as $file) {
        $class = 'RefactorCircus\\Atrium\\Domains\\'.basename(dirname($file, 3)).'\\Http\\Requests\\'.basename($file, '.php');

        expect(is_subclass_of($class, Request::class))->toBeTrue($class.' extends the base request')
            ->and(new ReflectionClass($class)->isFinal())->toBeTrue($class.' is final');

        $method = new ReflectionMethod($class, 'persist');

        expect($method->isPublic())->toBeTrue()
            ->and($method->getDeclaringClass()->getName())->toBe($class);
    }
});

it('keeps every dashboard and widget controller method to a single return $request->persist()', function (): void {
    $controllers = glob(__DIR__.'/../../src/Domains/{Dashboard,Widgets}/Http/Controllers/*.php', GLOB_BRACE) ?: [];

    expect($controllers)->not->toBeEmpty();

    foreach ($controllers as $file) {
        $class = 'RefactorCircus\\Atrium\\Domains\\'.basename(dirname($file, 3)).'\\Http\\Controllers\\'.basename($file, '.php');
        $lines = file($file) ?: [];

        foreach (new ReflectionClass($class)->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->getDeclaringClass()->getName() !== $class) {
                continue;
            }

            $parameters = $method->getParameters();

            expect($parameters)->toHaveCount(1, $class.'::'.$method->getName().' takes only its request');

            $type = $parameters[0]->getType();

            expect($type instanceof ReflectionNamedType && is_subclass_of($type->getName(), Request::class))->toBeTrue();

            $body = implode('', array_slice($lines, (int) $method->getStartLine(), (int) $method->getEndLine() - (int) $method->getStartLine()));

            expect(preg_replace('/\s+/', '', $body))->toBe('{return$request->persist();}', $class.'::'.$method->getName());
        }
    }
});

it('keeps controllers free of business logic', function (): void {
    $controllers = glob(__DIR__.'/../../src/Domains/*/Http/Controllers/*.php') ?: [];

    expect($controllers)->not->toBeEmpty();

    foreach ($controllers as $file) {
        $body = (string) file_get_contents($file);

        expect($body)->not->toContain('DB::')
            ->and($body)->not->toContain('->create(')
            ->and($body)->not->toContain('->delete(');
    }
});
