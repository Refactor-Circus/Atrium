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
 *
 * From Laravel 13.40 the framework command frames its JSON in a signed
 * envelope (`@@LARAVEL-CONCURRENCY-V1@@{base64}@@{hmac}@@`), keyed by
 * LARAVEL_CONCURRENCY_HMAC_KEY. This command sets that key for the call and
 * unwraps the envelope; earlier versions write the JSON bare.
 */
class InvokeSearchSourceCommand extends Command
{
    /** The container key the closure binds its rows under. */
    public const string RESULTS = SearchRegistry::class.'@results';

    /** The environment variable the framework signs its result envelope with. */
    private const string ENVELOPE_KEY = 'LARAVEL_CONCURRENCY_HMAC_KEY';

    protected $signature = 'atrium:search-source';

    protected $description = 'Run a search source sent by Atrium and write its results as JSON.';

    protected $hidden = true;

    public function handle(): int
    {
        $this->laravel->forgetInstance(self::RESULTS);

        $buffer = new BufferedOutput;
        $key = bin2hex(random_bytes(32));

        $_SERVER[self::ENVELOPE_KEY] = $_ENV[self::ENVELOPE_KEY] = $key;
        putenv(self::ENVELOPE_KEY.'='.$key);

        // Whatever the source prints would land on stdout beside the envelope.
        ob_start();

        try {
            Artisan::call('invoke-serialized-closure', [], $buffer);
        } finally {
            ob_end_clean();

            unset($_SERVER[self::ENVELOPE_KEY], $_ENV[self::ENVELOPE_KEY]);
            putenv(self::ENVELOPE_KEY);
        }

        $this->output->write($this->encode($this->envelope($this->unframe($buffer->fetch(), $key))), false, OutputInterface::OUTPUT_RAW);

        return self::SUCCESS;
    }

    /**
     * The framework's JSON: the payload of its signed envelope when it framed
     * one, else the output as written (before Laravel 13.40). An envelope
     * whose signature does not match reads as no result.
     */
    private function unframe(string $output, string $key): string
    {
        if (preg_match('/@@LARAVEL-CONCURRENCY-V1@@([A-Za-z0-9+\/=]*)@@([a-f0-9]{64})@@/', $output, $frame) !== 1) {
            return $output;
        }

        if (! hash_equals(hash_hmac('sha256', $frame[1], $key), $frame[2])) {
            return '';
        }

        return (string) base64_decode($frame[1], true);
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
