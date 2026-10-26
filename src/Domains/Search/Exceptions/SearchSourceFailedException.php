<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Exceptions;

use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Exceptions\AtriumException;
use Throwable;

/**
 * A search source that could not return its results. Reported, never thrown
 * out of a search: the source contributes nothing and the others still run.
 * Not final, so a timeout is caught as a failure too.
 */
class SearchSourceFailedException extends AtriumException
{
    final public function __construct(
        public readonly string $sourceKey,
        string $message,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, previous: $previous);
    }

    public static function forSource(SearchSource $source, string|Throwable $reason): self
    {
        return new self(
            $source->key,
            "Search source [{$source->key}] failed: ".($reason instanceof Throwable ? $reason->getMessage() : $reason),
            $reason instanceof Throwable ? $reason : null,
        );
    }
}
