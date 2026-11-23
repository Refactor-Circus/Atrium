<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens\Http\Resources;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Data\ResolvedScreen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Support\JsonData;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * A resolved screen as the layer renders it: its tabs, the open one, and the
 * visible sections of every slot it declares. Each registered extension is
 * `{key, label, component, data}`; the layer looks `component` up in its
 * `$atrium.extension()` registry. Built-in tabs have no component: the page
 * renders them itself.
 *
 * Only what renders is resolved, as on the v1 pages: the open registered
 * tab's data (another tab's comes with `?tab=`), and, while a registered tab
 * is open, only the `header.actions` sections, since its panel replaces the
 * page. A row slot's sections are sent per row under `rows`, for the rows
 * given to `withRows()`, keyed by each row's key.
 *
 * Data goes through `JsonData::resolve()`: outside `local` and `testing` a
 * failing extension gets `data: null` and an `error`, and the rest of the
 * screen still answers.
 *
 * @mixin ResolvedScreen
 *
 * @property ResolvedScreen $resource
 */
final class ResolvedScreenResource extends JsonResource
{
    /**
     * The one slot that still renders beside an open registered tab.
     */
    private const string HEADER_ACTIONS = 'header.actions';

    /** @var list<Model> */
    private array $rows = [];

    /**
     * The rows a list screen shows, whose row-slot sections are sent per row.
     *
     * @param  list<Model>  $rows
     */
    public function withRows(array $rows): self
    {
        $this->rows = $rows;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $resolved = $this->resource;
        $tabOpen = $resolved->openRegisteredTab !== null;

        $sections = [];

        foreach ($resolved->screen->slots as $slot) {
            $sections[$slot] = $tabOpen && $slot !== self::HEADER_ACTIONS
                ? []
                : array_map(fn (SectionDefinition $section): array => $this->section($section), $resolved->sections($slot));
        }

        return [
            'key' => $resolved->screen->key,
            'kind' => $resolved->screen->kind,
            'open_tab' => $resolved->openTab,
            'tabs' => array_map($this->tab(...), $resolved->tabs),
            'sections' => (object) $sections,
            'rows' => (object) ($tabOpen ? [] : $this->rowSections()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function tab(TabDefinition $tab): array
    {
        $resolved = $this->resource;
        $builtIn = in_array($tab, $resolved->screen->tabs, true);

        $entry = [
            'key' => $tab->key,
            'label' => $tab->label,
            'icon' => $tab->icon,
            'built_in' => $builtIn,
            'component' => $builtIn ? null : $tab->component,
        ];

        if ($builtIn || $resolved->openRegisteredTab !== $tab) {
            return $entry;
        }

        return [...$entry, ...$this->data(
            "Tab [{$tab->key}] on screen [{$resolved->screen->key}]",
            fn (): array => $resolved->data($tab),
        )];
    }

    /**
     * @return array<string, mixed>
     */
    private function section(SectionDefinition $section, ?Model $row = null): array
    {
        $resolved = $this->resource;

        return [
            'key' => $section->key,
            'label' => $section->label,
            'component' => $section->component,
            ...$this->data(
                "Section [{$section->key}] on screen [{$resolved->screen->key}]",
                fn (): array => $resolved->data($section, $row),
            ),
        ];
    }

    /**
     * Each row's row-slot sections, by row key, then slot.
     *
     * @return array<array-key, object>
     */
    private function rowSections(): array
    {
        $resolved = $this->resource;
        $rows = [];

        foreach ($this->rows as $row) {
            $key = $row->getKey();

            if (! is_int($key) && ! is_string($key)) {
                throw new InvalidArgumentException("Every row of screen [{$resolved->screen->key}] needs a key; a ".$row::class.' has none.');
            }

            $slots = [];

            foreach ($resolved->screen->rowSlots as $slot) {
                $slots[$slot] = array_map(
                    fn (SectionDefinition $section): array => $this->section($section, $row),
                    $resolved->rowSections($slot, $row),
                );
            }

            $rows[$key] = (object) $slots;
        }

        return $rows;
    }

    /**
     * The extension's data as an object, or null and an error when it failed
     * outside `local` and `testing`.
     *
     * @param  Closure(): array<array-key, mixed>  $resolver
     * @return array{data: object|null, error?: array{message: string}}
     */
    private function data(string $owner, Closure $resolver): array
    {
        $result = JsonData::resolve($owner, $resolver);

        return [...$result, 'data' => $result['data'] === null ? null : (object) $result['data']];
    }
}
