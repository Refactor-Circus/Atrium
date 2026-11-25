<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Access\Concerns\Gated;
use RefactorCircus\Atrium\Support\Iconify;

/**
 * A sidebar section: its icon in the rail, its place there, and visibility
 * rules for all of its pages. Items join a group by naming it in
 * NavItem::group(); the group hides them all when its rules fail. A group
 * nobody describes is always shown while it has items, with its first
 * page's icon.
 */
class NavGroup
{
    use Gated;

    /** The section's icon in the sidebar rail, as an Iconify name such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    /** Where the section sits in the rail; lower first. */
    public private(set) ?int $sort = null;

    final public function __construct(public readonly string $name) {}

    public static function make(string $name): static
    {
        return new static($name);
    }

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-home`
     */
    public function icon(string $icon): static
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }

    public function sort(int $sort): static
    {
        $this->sort = $sort;

        return $this;
    }
}
