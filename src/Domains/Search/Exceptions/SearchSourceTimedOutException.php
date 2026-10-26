<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Exceptions;

use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use Throwable;

/**
 * A search source that ran past its timeout, and was abandoned.
 */
final class SearchSourceTimedOutException extends SearchSourceFailedException
{
    public static function timedOut(SearchSource $source, Throwable $previous): self
    {
        return new self($source->key, "Search source [{$source->key}] timed out.", $previous);
    }
}
