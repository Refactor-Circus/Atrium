<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin as PluginContract;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use Throwable;

/**
 * Convenience base class providing no-op defaults for every optional
 * plugin method. A plugin contributing only navigation implements one method.
 */
abstract class Plugin implements PluginContract
{
    public function key(): string
    {
        return Str::of(class_basename($this))
            ->beforeLast('Plugin')
            ->kebab()
            ->toString();
    }

    public function label(): string
    {
        return Str::of($this->key())->replace('-', ' ')->headline()->toString();
    }

    public function authorize(Request $request): bool
    {
        return true;
    }

    public function features(): array
    {
        return [];
    }

    /**
     * The features listed under a config key, such as `showroom.atrium.features`,
     * that can be loaded. A feature class whose package is missing - a
     * PennantPlus feature without refactor-circus/pennantplus - fails to load with an
     * Error rather than class_exists() answering false, so it is skipped.
     *
     * @return array<int, string>
     */
    protected function featuresFromConfig(string $key): array
    {
        $features = config($key, []);

        return array_values(array_filter(
            is_array($features) ? $features : [],
            fn (mixed $feature): bool => is_string($feature) && (! str_contains($feature, '\\') || self::loads($feature)),
        ));
    }

    private static function loads(string $class): bool
    {
        try {
            return class_exists($class);
        } catch (Throwable) {
            return false;
        }
    }

    public function navigation(): array
    {
        return [];
    }

    public function navigationGroups(): array
    {
        return [];
    }

    public function routes(): void
    {
        //
    }

    public function settings(): ?SettingsPanel
    {
        return null;
    }

    public function widgets(): array
    {
        return [];
    }

    /**
     * The plugin's search source, or several - one per kind of thing it
     * finds, so each gets its own `results.per_source` and classification
     * can pick between them.
     *
     * @return SearchSource|array<int, SearchSource>|null
     */
    public function search(): SearchSource|array|null
    {
        return null;
    }
}
