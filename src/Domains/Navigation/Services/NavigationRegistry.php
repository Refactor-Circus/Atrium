<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavSection;
use RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;

class NavigationRegistry
{
    /** @var array<int, NavItem> */
    protected array $items = [];

    /** @var array<string, NavGroup> */
    protected array $groups = [];

    public function __construct(protected PluginRegistry $plugins) {}

    /**
     * Add a navigation item outside of any plugin, e.g. from the host app.
     */
    public function add(NavItem $item): static
    {
        $this->items[] = $item;

        return $this;
    }

    /**
     * Describe a sidebar group outside of any plugin. Describing a group
     * twice keeps the later description.
     */
    public function group(NavGroup $group): static
    {
        $this->groups[$group->name] = $group;

        return $this;
    }

    /**
     * Navigation items visible to the given request, grouped and sorted.
     * A group whose own rules fail is left out with all of its items.
     *
     * @return array<string, array<int, NavItem>>
     */
    public function grouped(Request $request): array
    {
        return $this->groupItems($this->groups($request), $request);
    }

    /**
     * @param  array<string, NavGroup>  $described
     * @return array<string, array<int, NavItem>>
     */
    protected function groupItems(array $described, Request $request): array
    {
        $groups = [];

        foreach ($this->items($request) as $item) {
            $name = $item->group ?? '';

            if (isset($described[$name]) && ! $described[$name]->isAuthorized($request)) {
                continue;
            }

            $groups[$name][] = $item;
        }

        return $groups;
    }

    /**
     * The sidebar's rail: each page outside a group as its own entry, first,
     * then each group, by the group's sort or else its first page's. A page
     * outside a group that has sub-pages opens in the panel, as a group does.
     *
     * @return array<int, NavSection>
     */
    public function sections(Request $request): array
    {
        $described = $this->groups($request);
        $single = [];
        $groups = [];

        // Groups are worked out once and shared with the grouping below.
        foreach ($this->groupItems($described, $request) as $name => $items) {
            if ($name === '') {
                foreach ($items as $index => $item) {
                    // A page with sub-pages opens in the panel like a group,
                    // so its sub-pages stay reachable.
                    $single[] = new NavSection('page-'.$index.'-'.Str::slug($item->label), $item->label, $item->icon, [$item], $item->children !== []);
                }

                continue;
            }

            $group = $described[$name] ?? null;

            $groups[] = [
                'sort' => $group->sort ?? $items[0]->sort,
                'section' => new NavSection('group-'.Str::slug($name), $name, $group->icon ?? $this->firstIcon($items), $items, true),
            ];
        }

        // Stable: groups that tie keep the order their pages gave them.
        usort($groups, fn (array $a, array $b): int => $a['sort'] <=> $b['sort']);

        return [...$single, ...array_column($groups, 'section')];
    }

    /**
     * @param  array<int, NavItem>  $items
     */
    protected function firstIcon(array $items): ?string
    {
        foreach ($items as $item) {
            if ($item->icon !== null) {
                return $item->icon;
            }
        }

        return null;
    }

    /**
     * Flat list of visible navigation items, sorted. Children the request may
     * not see are removed, and a parent left with no children and no link of
     * its own goes with them.
     *
     * @return array<int, NavItem>
     */
    public function items(Request $request): array
    {
        $items = $this->items;

        foreach ($this->plugins->authorized($request) as $plugin) {
            foreach ($this->itemsFor($plugin) as $item) {
                $items[] = $item;
            }
        }

        $items = $this->visible($items, $request);

        usort($items, fn (NavItem $a, NavItem $b): int => $a->sort <=> $b->sort
            ?: strcmp($a->label, $b->label));

        return $items;
    }

    /**
     * Every described group, including those plugins describe, keyed by name.
     *
     * @return array<string, NavGroup>
     */
    public function groups(Request $request): array
    {
        $groups = [];

        foreach ($this->plugins->authorized($request) as $plugin) {
            foreach ($plugin->navigationGroups() as $group) {
                $groups[$group->name] = $group;
            }
        }

        // Groups described directly, typically by the host application,
        // win over a plugin's description of the same group.
        return [...$groups, ...$this->groups];
    }

    /**
     * @param  array<int, NavItem>  $items
     * @return array<int, NavItem>
     */
    protected function visible(array $items, Request $request): array
    {
        $visible = [];

        foreach ($items as $item) {
            if (! $item->isAuthorized($request)) {
                continue;
            }

            if ($item->children !== []) {
                $children = $this->visible($item->children, $request);

                if ($children === [] && $item->resolveUrl() === null) {
                    continue;
                }

                // Registered items are shared across requests, so filter a copy.
                $item = (clone $item)->children($children);
            }

            $visible[] = $item;
        }

        return $visible;
    }

    /**
     * @return array<int, NavItem>
     */
    protected function itemsFor(Plugin $plugin): array
    {
        return $plugin->navigation();
    }
}
