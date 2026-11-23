<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Exceptions;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Exceptions\AtriumException;

/**
 * An integration class that breaks the integration contract. It is Atrium's
 * own bug, found at boot, so it is a 500.
 */
final class InvalidIntegrationException extends AtriumException
{
    protected int $status = 500;

    public static function notAnIntegration(string $key, string $class): self
    {
        return new self(sprintf(
            'The [%s] integration class [%s] must implement [%s].',
            $key,
            $class,
            Integration::class,
        ));
    }

    public static function screenOutsidePackage(string $key, ScreenDeclaration $screen): self
    {
        return new self(sprintf(
            'The [%s] integration declares the screen [%s] at [%s]; its key must start with [%s.] and its path with [/%s/].',
            $key,
            $screen->key,
            $screen->path,
            $key,
            $key,
        ));
    }
}
