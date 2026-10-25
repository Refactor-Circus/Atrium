<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use JsonException;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Runs one search source in a child process and writes its results as JSON.
 *
 * The framework's invoke-serialized-closure command revives and calls the
 * closure the parent sent, in this process. That closure hands its rows back
 * through the container under RESULTS, so the framework's serialized return
 * value is never read: only JSON leaves this process.
 */
class InvokeSearchSourceCommand extends Command
{
    /** The container key the closure binds its rows under. */
    public const string RESULTS = SearchRegistry::class.'@results';

    protected $signature = 'atrium:search-source';

    protected $description = 'Run a search source sent by Atrium and write its results as JSON.';

    protected $hidden = true;

    public function handle(): int
    {
        $this->laravel->forgetInstance(self::RESULTS);

        $buffer = new BufferedOutput;

        // Whatever the source prints would land on stdout beside the envelope.
        ob_start();

        try {
            Artisan::call('invoke-serialized-closure', [], $buffer);
        } finally {
            ob_end_clean();
        }

        $this->output->write($this->encode($this->envelope($buffer->fetch())), false, OutputInterface::OUTPUT_RAW);

        return self::SUCCESS;
    }

    /**
     * @return array{successful: true, results: array<array-key, mixed>}|array{successful: false, message: string}
     */
    private function envelope(string $output): array
    {
        $framework = json_decode($output, true);

        if (! is_array($framework)) {
            return ['successful' => false, 'message' => 'The search source wrote no readable result.'];
        }

        if (($framework['successful'] ?? false) !== true) {
            return [
                'successful' => false,
                'message' => is_string($framework['message'] ?? null) ? $framework['message'] : 'The search source failed.',
            ];
        }

        $results = $this->laravel->bound(self::RESULTS) ? $this->laravel->make(self::RESULTS) : null;

        if (! is_array($results)) {
            return ['successful' => false, 'message' => 'The search source did not hand back its results.'];
        }

        return ['successful' => true, 'results' => $results];
    }

    /**
     * Encode in one call, so stdout is the whole envelope or a failure, never
     * empty. Strings that are not UTF-8 are substituted rather than lost.
     *
     * @param  array<string, mixed>  $envelope
     */
    private function encode(array $envelope): string
    {
        try {
            return json_encode($envelope, JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            return json_encode([
                'successful' => false,
                'message' => 'The search results could not be encoded: '.$e->getMessage(),
            ], JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
        }
    }
}
