<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Services;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavSection;
use WeakMap;

/**
 * Answers, once per request, which navigation items are active and where
 * they link. One page asks about the same items many times over - the rail,
 * the docked panel, the top bar and the flyouts all show them - and each
 * answer resolves routes and compares paths.
 *
 * Answers are kept beside the items rather than on them, since registered
 * items are shared across requests, and keyed weakly on the request, so
 * none outlives it. The binding is scoped as well, for Octane and queue
 * workers.
 */
final class NavigationState
{
    /** @var WeakMap<Request, array{active: WeakMap<NavItem, bool>, urls: WeakMap<NavItem, array{0: string|null}>}> */
    private WeakMap $requests;

    public function __construct()
    {
        $this->requests = new WeakMap;
    }

    public function isActive(NavItem $item, Request $request): bool
    {
        $active = $this->for($request)['active'];

        return $active[$item] ??= $item->isActive($request);
    }

    public function url(NavItem $item, Request $request): ?string
    {
        $urls = $this->for($request)['urls'];

        return ($urls[$item] ??= [$item->resolveUrl()])[0];
    }

    /**
     * Whether one of the item's children is active.
     */
    public function hasActiveChild(NavItem $item, Request $request): bool
    {
        return array_any($item->children, fn (NavItem $child): bool => $this->isActive($child, $request));
    }

    /**
     * Whether one of the section's pages, or a page beneath one, is active,
     * as NavSection::isActive() decides.
     */
    public function sectionIsActive(NavSection $section, Request $request): bool
    {
        return array_any(
            $section->items,
            fn (NavItem $item): bool => $this->isActive($item, $request) || $this->hasActiveChild($item, $request),
        );
    }

    /**
     * Where a single-page section's rail entry leads.
     */
    public function sectionUrl(NavSection $section, Request $request): ?string
    {
        $first = $section->items[0] ?? null;

        return $first === null ? null : $this->url($first, $request);
    }

    /**
     * @return array{active: WeakMap<NavItem, bool>, urls: WeakMap<NavItem, array{0: string|null}>}
     */
    private function for(Request $request): array
    {
        /** @var array{active: WeakMap<NavItem, bool>, urls: WeakMap<NavItem, array{0: string|null}>} */
        return $this->requests[$request] ??= ['active' => new WeakMap, 'urls' => new WeakMap];
    }
}
