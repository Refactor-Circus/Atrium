<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Data;

use Illuminate\Http\Request;

/**
 * One entry in the sidebar's rail: a group of pages shown in the docked panel
 * beside it, or a single page the rail links to directly.
 */
final class NavSection
{
    /**
     * @param  array<int, NavItem>  $items
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly ?string $icon,
        public readonly array $items,
        public readonly bool $grouped,
    ) {}

    /**
     * Whether the current page is one of the section's pages, or a page
     * beneath one of them.
     */
    public function isActive(Request $request): bool
    {
        foreach ($this->items as $item) {
            if ($item->isActive($request)) {
                return true;
            }

            foreach ($item->children as $child) {
                if ($child->isActive($request)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Where the rail entry leads when the section is a single page.
     */
    public function url(): ?string
    {
        return ($this->items[0] ?? null)?->resolveUrl();
    }

    /**
     * The link the rail entry follows: the first item's.
     *
     * @return array{path: string, external: bool}|null
     */
    public function link(): ?array
    {
        return ($this->items[0] ?? null)?->link();
    }
}
