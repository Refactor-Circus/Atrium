<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Support;

use RuntimeException;

/**
 * A `$subject_scope` whose scope does not resolve on a screen: the hook
 * extension is skipped there, with one warning per process.
 *
 * @internal Thrown by ManifestValues, caught by IntegrationHooks.
 */
final class SubjectScopeUnresolved extends RuntimeException
{
    public function __construct(
        public readonly string $scope,
        public readonly string $configKey,
        public readonly ?string $fallback,
    ) {
        parent::__construct("The [{$scope}] scope does not resolve.");
    }
}
