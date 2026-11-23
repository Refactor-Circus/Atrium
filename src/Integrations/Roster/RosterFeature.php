<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Roster;

/**
 * The feature flag the Roster integration shows behind, by default, in
 * `atrium.integrations.roster.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class RosterFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
