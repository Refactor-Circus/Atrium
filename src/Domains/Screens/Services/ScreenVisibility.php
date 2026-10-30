<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Services;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use SplObjectStorage;
use Throwable;

/**
 * This request's answers about screen extensions: who may see each one, the
 * data each resolved, and which failures have been reported.
 *
 * Bound with `scoped()`, so it is rebuilt for every request (and every
 * Octane request or queued job): an answer for one viewer never reaches
 * another. Nothing is cached on the registry or the definitions, which last
 * as long as the application.
 *
 * Answers are keyed by screen, slot, extension key and record. A record is
 * identified by its morph class and key, or, while it has no key, by the
 * model itself, held for the rest of the request so a freed row's object id
 * can never be mistaken for a new row's.
 */
final class ScreenVisibility
{
    /**
     * The slot name tabs are remembered under; no real slot can match it.
     */
    public const string TABS = '@tabs';

    /**
     * Remembered values by record identity, then by what was asked.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $memo = [];

    /**
     * Remembered values for records without a key, by what was asked.
     *
     * @var SplObjectStorage<Model, array<string, mixed>>
     */
    private SplObjectStorage $unsaved;

    /**
     * Failures already reported this request.
     *
     * @var array<string, true>
     */
    private array $reported = [];

    public function __construct()
    {
        $this->unsaved = new SplObjectStorage;
    }

    /**
     * Whether the viewer may see the extension on this record, asked once
     * per request. A closure that throws counts as a denial and is reported
     * once per request per screen and key.
     */
    public function allows(Screen $screen, string $slot, TabDefinition|SectionDefinition $extension, Request $request, ?Model $record): bool
    {
        return $this->remember('allows', $screen, $slot, $extension, $record, function () use ($screen, $extension, $request, $record): bool {
            try {
                return $extension->allows($request, $record, $screen, $screen->permits(...));
            } catch (Throwable $exception) {
                $this->report("authorize\0{$screen->key}\0{$extension->key}", $exception);

                return false;
            }
        }) === true;
    }

    /**
     * The extension's data for this record, resolved once per request. A
     * resolver that throws is not remembered.
     *
     * @return array<string, mixed>
     */
    public function data(Screen $screen, string $slot, TabDefinition|SectionDefinition $extension, ?Model $record): array
    {
        /** @var array<string, mixed> */
        return $this->remember('data', $screen, $slot, $extension, $record, fn (): array => $extension->resolveData($record, $screen));
    }

    /**
     * Report the exception unless one under the same key already was this
     * request.
     */
    public function report(string $key, Throwable $exception): void
    {
        if (isset($this->reported[$key])) {
            return;
        }

        $this->reported[$key] = true;

        report($exception);
    }

    /**
     * @param  Closure(): mixed  $compute
     */
    private function remember(string $store, Screen $screen, string $slot, TabDefinition|SectionDefinition $extension, ?Model $record, Closure $compute): mixed
    {
        $key = "{$store}\0{$screen->key}\0{$slot}\0{$extension->key}";
        $identity = $this->identity($record);

        if (is_string($identity)) {
            if (! array_key_exists($key, $this->memo[$identity] ?? [])) {
                $this->memo[$identity][$key] = $compute();
            }

            return $this->memo[$identity][$key];
        }

        $values = isset($this->unsaved[$identity]) ? $this->unsaved[$identity] : [];

        if (! array_key_exists($key, $values)) {
            $values[$key] = $compute();
            $this->unsaved[$identity] = $values;
        }

        return $values[$key];
    }

    /**
     * The record's morph class and key, `-` for no record, or the model
     * itself while it has no key.
     */
    private function identity(?Model $record): string|Model
    {
        if ($record === null) {
            return '-';
        }

        $key = $record->getKey();

        return is_int($key) || is_string($key) ? $record->getMorphClass()."\0".$key : $record;
    }
}
