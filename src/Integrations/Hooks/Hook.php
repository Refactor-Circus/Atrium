<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use Closure;
use Illuminate\Container\Container;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * A cross-package hook: one integration's tab or section on the screens of
 * the others, from its `atrium.integrations.*` configuration alone.
 *
 * A hook places its extensions on the screens registered integrations
 * declare, one exact screen key at a time, so each carries that screen's
 * static data (its package, its record's morph alias). A screen no registered
 * integration declares gets nothing, so a hook is absent while its other
 * integration is not registered. Each extension shows, per request, only
 * while every integration it joins is active for the user (D-027).
 *
 * A target is `*`, `{package}.*` or a screen key, and a slot must match
 * `Screen::NAME_PATTERN`. An invalid one throws InvalidArgumentException in
 * `local` and `testing`; anywhere else it is reported and skipped, and the
 * rest still register (D-034).
 */
abstract class Hook
{
    /**
     * Every screen of one package.
     */
    private const string PACKAGE_TARGET = '/^[a-z0-9-]+\.\*$/D';

    public function __construct(
        protected readonly Repository $config,
        protected readonly IntegrationRegistry $integrations,
        private readonly IntegrationFeatures $features,
    ) {}

    /**
     * Add the hook's extensions through the registrar, while its own
     * integration is registered.
     */
    abstract public function register(Hooks $hooks): void;

    /**
     * Every screen a registered integration declares that the target
     * matches, with its integration, in key order.
     *
     * @return list<array{RegisteredIntegration, ScreenDeclaration}>
     */
    protected function screens(string $target): array
    {
        $matches = [];

        foreach ($this->integrations->all() as $integration) {
            foreach ($integration->screens as $key => $screen) {
                if (Str::is($target, $key)) {
                    $matches[] = [$integration, $screen];
                }
            }
        }

        return $matches;
    }

    /**
     * Whether a value is a target Atrium's screen registry accepts.
     *
     * @phpstan-assert-if-true non-empty-string $target
     */
    protected static function validTarget(mixed $target): bool
    {
        return is_string($target)
            && ($target === '*' || preg_match(self::PACKAGE_TARGET, $target) === 1 || preg_match(Screen::KEY_PATTERN, $target) === 1);
    }

    /**
     * Whether a value is a slot name.
     *
     * @phpstan-assert-if-true non-empty-string $slot
     */
    protected static function validSlot(mixed $slot): bool
    {
        return is_string($slot) && preg_match(Screen::NAME_PATTERN, $slot) === 1;
    }

    /**
     * Throw where a developer will see it (local, testing and outside an
     * application); elsewhere report it, so boot carries on.
     *
     * @throws InvalidArgumentException in local and testing
     */
    protected static function invalid(string $message): void
    {
        $exception = new InvalidArgumentException($message);
        $app = Container::getInstance();

        if (! $app instanceof Application || $app->environment('local', 'testing') === true) {
            throw $exception;
        }

        report($exception);
    }

    /**
     * Shows the extension only while every integration is active for the
     * request.
     *
     * @return Closure(Request): bool
     */
    protected function whileActive(RegisteredIntegration ...$integrations): Closure
    {
        return function (Request $request) use ($integrations): bool {
            foreach ($integrations as $integration) {
                if (! $this->features->active($integration, $request)) {
                    return false;
                }
            }

            return true;
        };
    }

    /**
     * A hook label, from `lang/{locale}/integrations/hooks.php`.
     */
    protected static function trans(string $key): string
    {
        $label = __($key);

        return is_string($label) ? $label : $key;
    }

    /**
     * A config value as it reads in an error message: JSON, or its type when
     * it has none.
     */
    protected static function describe(mixed $value): string
    {
        if (is_string($value)) {
            return $value;
        }

        $json = json_encode($value);

        return $json === false ? get_debug_type($value) : $json;
    }
}
