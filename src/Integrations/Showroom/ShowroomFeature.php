<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Showroom;

/**
 * The feature flag the Showroom integration shows behind, by default, in
 * `atrium.integrations.showroom.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class ShowroomFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
