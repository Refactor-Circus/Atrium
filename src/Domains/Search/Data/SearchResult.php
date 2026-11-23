<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Search\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Support\Iconify;

class SearchResult
{
    public private(set) ?string $subtitle = null;

    /** An Iconify name, such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    public private(set) ?string $group = null;

    final public function __construct(
        public readonly string $title,
        public readonly string $url,
    ) {}

    public static function make(string $title, string $url): static
    {
        return new static($title, $url);
    }

    public function subtitle(string $subtitle): static
    {
        $this->subtitle = $subtitle;

        return $this;
    }

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-home`
     */
    public function icon(string $icon): static
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }

    public function group(string $group): static
    {
        $this->group = $group;

        return $this;
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'url' => $this->url,
            'subtitle' => $this->subtitle,
            'icon' => $this->icon,
            'group' => $this->group,
        ];
    }
}
