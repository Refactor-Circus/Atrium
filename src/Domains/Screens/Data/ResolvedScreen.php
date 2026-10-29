<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Data;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenVisibility;
use SplObjectStorage;

/**
 * A screen with its extensions for this request, from
 * `ScreenExtensions::resolve()`: the visible tabs, the open tab, and each
 * slot's sections. Sections are checked only when their slot is asked for,
 * and data is resolved only through `data()`, so nothing runs for what never
 * renders. Answers and data are remembered for the request by
 * ScreenVisibility.
 */
final class ResolvedScreen
{
    /**
     * The registered tabs and sections of this screen, by the slot they
     * render in (ScreenVisibility::TABS for tabs).
     *
     * @var SplObjectStorage<TabDefinition|SectionDefinition, string>
     */
    private SplObjectStorage $slotOf;

    /**
     * @internal Built by ScreenExtensions::resolve().
     *
     * @param  list<TabDefinition>  $tabs  The built-in tabs, then the visible registered ones.
     * @param  list<TabDefinition>  $registeredTabs  Every registered tab on the screen, visible or not.
     * @param  array<string, list<SectionDefinition>>  $sections  Every section by declared slot, visible or not.
     */
    public function __construct(
        public private(set) Screen $screen,
        public private(set) array $tabs,
        public private(set) string $openTab,
        public private(set) ?TabDefinition $openRegisteredTab,
        array $registeredTabs,
        private array $sections,
        private Request $request,
        private ScreenVisibility $visibility,
    ) {
        $this->slotOf = new SplObjectStorage;

        foreach ($registeredTabs as $tab) {
            $this->slotOf[$tab] = ScreenVisibility::TABS;
        }

        foreach ($sections as $slot => $definitions) {
            foreach ($definitions as $section) {
                // An all-digit slot name came back from the array key as an int.
                $this->slotOf[$section] = (string) $slot;
            }
        }
    }

    /**
     * The visible sections of a slot, in order; none for a slot the screen
     * did not declare.
     *
     * @return list<SectionDefinition>
     *
     * @throws InvalidArgumentException for a row slot, which needs its row
     */
    public function sections(string $slot): array
    {
        if (in_array($slot, $this->screen->rowSlots, true)) {
            throw new InvalidArgumentException("Slot [{$slot}] of screen [{$this->screen->key}] is a row slot; render it per row with rowSections().");
        }

        return $this->visible($slot, $this->screen->record);
    }

    /**
     * The sections of a row slot visible for this row, in order; none for a
     * slot the screen did not declare.
     *
     * @return list<SectionDefinition>
     *
     * @throws InvalidArgumentException for a slot that is not a row slot
     */
    public function rowSections(string $slot, Model $row): array
    {
        if (in_array($slot, $this->screen->slots, true)) {
            throw new InvalidArgumentException("Slot [{$slot}] of screen [{$this->screen->key}] is not a row slot; render it once with sections().");
        }

        return $this->visible($slot, $row);
    }

    /**
     * The data of one of this screen's registered tabs or sections, resolved
     * on the first call and remembered for the request. A row section needs
     * its row. A hidden extension has none, and its resolver never runs.
     *
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException for a built-in tab, another screen's extension, or a missing or stray row
     */
    public function data(TabDefinition|SectionDefinition $extension, ?Model $row = null): array
    {
        if (! isset($this->slotOf[$extension])) {
            throw new InvalidArgumentException("[{$extension->key}] is not a registered extension of screen [{$this->screen->key}] as resolved for this request.");
        }

        $slot = $this->slotOf[$extension];
        $inRow = in_array($slot, $this->screen->rowSlots, true);

        if ($inRow && $row === null) {
            throw new InvalidArgumentException("Section [{$extension->key}] is in the row slot [{$slot}] of screen [{$this->screen->key}]; pass its row.");
        }

        if (! $inRow && $row !== null) {
            throw new InvalidArgumentException("[{$extension->key}] on screen [{$this->screen->key}] is not in a row slot; pass no row.");
        }

        $record = $row ?? $this->screen->record;

        if (! $this->visibility->allows($this->screen, $slot, $extension, $this->request, $record)) {
            return [];
        }

        return $this->visibility->data($this->screen, $slot, $extension, $record);
    }

    /**
     * @return list<SectionDefinition>
     */
    private function visible(string $slot, ?Model $record): array
    {
        return array_values(array_filter(
            $this->sections[$slot] ?? [],
            fn (SectionDefinition $section): bool => $this->visibility->allows($this->screen, $slot, $section, $this->request, $record),
        ));
    }
}
