<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Hooks;

use Illuminate\Contracts\Container\Container;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

/**
 * Registers the cross-package hooks (AC 65 to 68) on Atrium's screen
 * registry, once the integrations have registered: Cortex's redirect domains,
 * Impex's run link, Keen's history and Guardian's tabs and sections.
 *
 * Registration may run again (a later integration registered); each
 * extension is added once per screen, so a second run adds only the hooks of
 * what has become available.
 */
final class Hooks
{
    /**
     * @var list<class-string<Hook>>
     */
    public const array HOOKS = [
        CortexRedirectDomains::class,
        ImpexRunLink::class,
        KeenHistory::class,
        GuardianScreens::class,
    ];

    /**
     * What has been added, by kind, screen, slot and extension key.
     *
     * @var array<string, true>
     */
    private array $added = [];

    public function __construct(private readonly Container $app) {}

    /**
     * Run every hook against the registered integrations.
     */
    public function register(): void
    {
        foreach (self::HOOKS as $hook) {
            $this->app->make($hook)->register($this);
        }
    }

    /**
     * Add a tab to one screen, unless it already has it.
     */
    public function tab(string $screen, TabDefinition $tab): void
    {
        if ($this->first("tab\0{$screen}\0{$tab->key}")) {
            $this->app->make(ScreenExtensions::class)->tab($screen, $tab);
        }
    }

    /**
     * Add a section to one screen's slot, unless it already has it.
     */
    public function section(string $screen, string $slot, SectionDefinition $section): void
    {
        if ($this->first("section\0{$screen}\0{$slot}\0{$section->key}")) {
            $this->app->make(ScreenExtensions::class)->section($screen, $slot, $section);
        }
    }

    private function first(string $key): bool
    {
        if (isset($this->added[$key])) {
            return false;
        }

        $this->added[$key] = true;

        return true;
    }
}
