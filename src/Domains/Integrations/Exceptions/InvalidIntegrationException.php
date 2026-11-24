<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Exceptions;

use RefactorCircus\Atrium\Exceptions\AtriumException;

/**
 * An integration manifest that breaks the manifest's schema or rules (D-090),
 * found when the integrations register at boot. It names the manifest and the
 * JSON pointer of the problem; it is a bug of the package (or app) that ships
 * the manifest, so it is a 500.
 */
final class InvalidIntegrationException extends AtriumException
{
    protected int $status = 500;

    /**
     * @param  string  $source  The manifest's path, or what registered it.
     * @param  string  $pointer  The JSON pointer of the problem, `''` for the whole manifest.
     */
    public static function invalidManifest(string $source, string $pointer, string $message): self
    {
        return new self(sprintf(
            'The Atrium integration manifest [%s] is invalid at [%s]: %s. See ui/sdk/schema/integration.schema.json and MODULES.md.',
            $source,
            $pointer === '' ? '/' : $pointer,
            $message,
        ));
    }
}
