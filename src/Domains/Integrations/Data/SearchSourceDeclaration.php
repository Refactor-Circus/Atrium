<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Support\Iconify;

/**
 * A search source the front end runs in the browser against a package's API,
 * registered there under the same key with `$atrium.searchSource()`. The
 * shell lists the sources of every active integration under
 * `search.sources`; Atrium's own search never calls them.
 */
final class SearchSourceDeclaration
{
    public private(set) string $key;

    public private(set) string $label;

    /** An Iconify name, such as `i-lucide-home`. */
    public private(set) ?string $icon = null;

    /**
     * @throws InvalidArgumentException for a key out of pattern
     */
    public function __construct(string $key)
    {
        if (preg_match(Screen::NAME_PATTERN, $key) !== 1) {
            throw new InvalidArgumentException("Search source key [{$key}] must match ".Screen::NAME_PATTERN.'.');
        }

        $this->key = $key;
        $this->label = $key;
    }

    public static function make(string $key): self
    {
        return new self($key);
    }

    public function label(string $label): self
    {
        $this->label = $label;

        return $this;
    }

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-home`
     */
    public function icon(string $icon): self
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }
}
