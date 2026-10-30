<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data;

use RefactorCircus\Atrium\Domains\Screens\Concerns\DefinesExtension;

/**
 * A section a package adds to a slot of one screen, a package's screens or
 * every screen declaring that slot, registered with
 * `Atrium::screens()->section()` from a provider's `boot()`. In a row slot it
 * renders once per row, and its closures receive the row as the record.
 */
final class SectionDefinition
{
    use DefinesExtension;
}
