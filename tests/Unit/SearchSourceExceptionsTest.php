<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceFailedException;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceTimedOutException;
use RefactorCircus\Atrium\Exceptions\AtriumException;

it('names the source when it fails', function (): void {
    $source = SearchSource::make('people');

    $reason = SearchSourceFailedException::forSource($source, 'exit code 1');
    $thrown = SearchSourceFailedException::forSource($source, $previous = new RuntimeException('Connection refused.'));

    expect($reason)->toBeInstanceOf(AtriumException::class)
        ->and($reason->getMessage())->toBe('Search source [people] failed: exit code 1')
        ->and($reason->sourceKey)->toBe('people')
        ->and($reason->getPrevious())->toBeNull()
        ->and($thrown->getMessage())->toBe('Search source [people] failed: Connection refused.')
        ->and($thrown->getPrevious())->toBe($previous);
});

it('names the source when it times out, as a failure', function (): void {
    $exception = SearchSourceTimedOutException::timedOut(SearchSource::make('orders'), $previous = new RuntimeException('Too slow.'));

    expect($exception)->toBeInstanceOf(SearchSourceFailedException::class)
        ->toBeInstanceOf(AtriumException::class)
        ->and($exception->getMessage())->toBe('Search source [orders] timed out.')
        ->and($exception->sourceKey)->toBe('orders')
        ->and($exception->getPrevious())->toBe($previous)
        ->and((new ReflectionClass(AtriumException::class))->isAbstract())->toBeTrue()
        ->and((new ReflectionClass(SearchSourceFailedException::class))->isFinal())->toBeFalse()
        ->and((new ReflectionClass(SearchSourceTimedOutException::class))->isFinal())->toBeTrue();
});
