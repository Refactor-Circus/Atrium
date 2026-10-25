<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Exceptions;
use Laravel\SerializableClosure\SerializableClosure;
use RefactorCircus\Atrium\Domains\Search\Console\InvokeSearchSourceCommand;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceFailedException;
use RefactorCircus\Atrium\Domains\Search\Exceptions\SearchSourceTimedOutException;
use RefactorCircus\Atrium\Exceptions\AtriumException;
use Symfony\Component\Console\Output\BufferedOutput;

afterEach(function (): void {
    unset($_SERVER['LARAVEL_INVOKABLE_CLOSURE']);
});

/**
 * Hand the child command a closure the way the parent does, through the
 * environment the framework's invoke-serialized-closure command reads.
 */
function invokableClosure(Closure $closure): void
{
    $_SERVER['LARAVEL_INVOKABLE_CLOSURE'] = base64_encode(serialize(new SerializableClosure($closure)));
}

/**
 * Run the child command and return exactly what it wrote.
 */
function runSearchSourceCommand(): string
{
    $output = new BufferedOutput;

    expect(Artisan::call('atrium:search-source', [], $output))->toBe(0);

    return $output->fetch();
}

it('registers the child command hidden from the command list', function (): void {
    $commands = Artisan::all();

    expect($commands)->toHaveKey('atrium:search-source')
        ->and($commands['atrium:search-source'])->toBeInstanceOf(InvokeSearchSourceCommand::class)
        ->and($commands['atrium:search-source']->isHidden())->toBeTrue();
});

it('writes exactly the results envelope when the closure hands back its rows', function (): void {
    $rows = [
        ['title' => 'Ada <comment>Lovelace</comment>', 'url' => '/people/1', 'subtitle' => 'Analyst', 'icon' => 'user', 'group' => 'People'],
        ['title' => 'Grace Hopper', 'url' => '/people/2', 'subtitle' => null, 'icon' => null, 'group' => null],
    ];

    invokableClosure(static function () use ($rows): null {
        app()->instance(InvokeSearchSourceCommand::RESULTS, $rows);

        return null;
    });

    expect(runSearchSourceCommand())->toBe(json_encode(['successful' => true, 'results' => $rows]));
});

it('discards anything the closure prints', function (): void {
    invokableClosure(static function (): null {
        echo 'noise';

        app()->instance(InvokeSearchSourceCommand::RESULTS, []);

        return null;
    });

    // In the child, the closure's output would land on stdout beside the envelope.
    $this->expectOutputString('');

    expect(runSearchSourceCommand())->toBe('{"successful":true,"results":[]}');
});

it('reports a failure when the closure never hands back its rows', function (): void {
    invokableClosure(static fn (): null => null);

    $envelope = json_decode(runSearchSourceCommand(), true);

    expect($envelope)->toHaveKeys(['successful', 'message'])
        ->and($envelope['successful'])->toBeFalse()
        ->and($envelope['message'])->toBeString()->not->toBe('')
        ->and($envelope)->not->toHaveKey('results');
});

it('reports a failure with the message when the closure throws', function (): void {
    Exceptions::fake();

    invokableClosure(static function (): never {
        throw new RuntimeException('The index is offline.');
    });

    expect(json_decode(runSearchSourceCommand(), true))->toBe([
        'successful' => false,
        'message' => 'The index is offline.',
    ]);
});

it('still writes a readable envelope for a title that is not UTF-8', function (): void {
    invokableClosure(static function (): null {
        app()->instance(InvokeSearchSourceCommand::RESULTS, [
            ['title' => "Caf\xE9", 'url' => '/cafe', 'subtitle' => "\xB1\x31", 'icon' => null, 'group' => null],
        ]);

        return null;
    });

    $output = runSearchSourceCommand();
    $envelope = json_decode($output, true);

    expect($output)->not->toBe('')
        ->and($envelope['successful'])->toBeTrue()
        ->and($envelope['results'][0]['title'])->toBe("Caf\u{FFFD}")
        ->and($envelope['results'][0]['url'])->toBe('/cafe');
});

it('writes a failure envelope when the results cannot be encoded', function (): void {
    invokableClosure(static function (): null {
        app()->instance(InvokeSearchSourceCommand::RESULTS, [['title' => INF]]);

        return null;
    });

    $output = runSearchSourceCommand();
    $envelope = json_decode($output, true);

    expect($output)->not->toBe('')
        ->and($envelope['successful'])->toBeFalse()
        ->and($envelope['message'])->toBeString()->not->toBe('');
});

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
