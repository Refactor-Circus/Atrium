<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

use InvalidArgumentException;

/**
 * Icons are Iconify names, `i-{collection}-{name}` (`i-lucide-home`), which
 * the front end renders. Definitions check theirs when they are set, so a
 * bad icon fails where it is written rather than as a blank in the browser.
 */
final class Iconify
{
    public const string PATTERN = '/^i-[a-z0-9]+(-[a-z0-9]+)+$/D';

    /**
     * The name, when it is an Iconify name.
     *
     * @throws InvalidArgumentException for anything else, such as `lucide:home`, inline SVG or `i-home`
     */
    public static function assert(string $name): string
    {
        if (preg_match(self::PATTERN, $name) !== 1) {
            $shown = mb_strlen($name) > 40 ? mb_substr($name, 0, 40).'...' : $name;

            throw new InvalidArgumentException("Icon [{$shown}] is not an Iconify name; use i-{collection}-{name}, such as i-lucide-home.");
        }

        return $name;
    }
}
