<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Access\Contracts;

/**
 * A user model that says itself who may open Atrium (D-086): the default
 * of the `viewAtrium` gate while the app defines none. A package that owns
 * users or permissions (Guardian's roles, say) can implement it on its
 * user trait, so no host has to define the gate for the common case.
 *
 *   class User extends Authenticatable implements AtriumUser
 *   {
 *       public function canAccessAtrium(): bool
 *       {
 *           return $this->is_admin;
 *       }
 *   }
 */
interface AtriumUser
{
    public function canAccessAtrium(): bool;
}
