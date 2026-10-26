<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Exceptions;

use RefactorCircus\Keystone\Exceptions\PackageException;

/**
 * Base of every exception Atrium throws, so callers can catch Atrium failures
 * broadly or by their concrete class. Renders as JSON with its message; the
 * status is 409 unless a subclass sets another.
 */
abstract class AtriumException extends PackageException {}
