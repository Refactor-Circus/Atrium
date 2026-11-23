<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Themes\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Support\Iconify;

/**
 * One look for the dashboard: values for the design tokens in
 * resources/css/atrium.css, applied at runtime without rebuilding any CSS.
 *
 * A theme sets light and dark tokens together (`primary` and `primary-dark`),
 * so the light/dark toggle keeps working inside every theme. Tokens it leaves
 * out keep the compiled defaults.
 *
 *     Theme::make('harbor')
 *         ->label('Harbor')
 *         ->colors(['primary' => '#0d9488', 'primary-dark' => '#2dd4bf'])
 *         ->radius('0.75rem')
 *         ->layout('top');
 */
class Theme
{
    public private(set) string $label;

    /**
     * Token values by name, without the `--color-` prefix.
     *
     * @var array<string, string>
     */
    public private(set) array $colors = [];

    /** The corner radius every rounded component shares. */
    public private(set) ?string $radius = null;

    /** A colour that stands for the theme in the switcher. */
    public private(set) ?string $swatch = null;

    /** An Iconify name shown with the swatch in the switcher, such as `i-lucide-sun`. */
    public private(set) ?string $icon = null;

    /**
     * How the shell is laid out from the `lg` breakpoint up: `sidebar` (a
     * rail of sections beside a docked panel) or `top` (sections across a
     * bar under the topbar, the current section's pages as tabs beneath).
     */
    public private(set) string $layout = self::SIDEBAR;

    public const string SIDEBAR = 'sidebar';

    public const string TOP = 'top';

    final public function __construct(public readonly string $key)
    {
        $this->label = ucfirst($key);
    }

    public static function make(string $key): static
    {
        return new static($key);
    }

    public function label(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    /**
     * @param  array<string, string>  $colors
     */
    public function colors(array $colors): static
    {
        $this->colors = [...$this->colors, ...$colors];

        return $this;
    }

    public function radius(?string $radius): static
    {
        $this->radius = $radius;

        return $this;
    }

    public function swatch(?string $swatch): static
    {
        $this->swatch = $swatch;

        return $this;
    }

    /**
     * @throws InvalidArgumentException for a value that is not an Iconify name, such as `i-lucide-sun`
     */
    public function icon(string $icon): static
    {
        $this->icon = Iconify::assert($icon);

        return $this;
    }

    /**
     * @throws InvalidArgumentException for a layout other than `sidebar` or `top`
     */
    public function layout(string $layout): static
    {
        if (! in_array($layout, [self::SIDEBAR, self::TOP], true)) {
            throw new InvalidArgumentException("Theme [{$this->key}] has an unknown layout [{$layout}]; use 'sidebar' or 'top'.");
        }

        $this->layout = $layout;

        return $this;
    }

    /**
     * The swatch as a CSS colour, falling back to the primary token.
     */
    public function swatchColor(): string
    {
        return $this->swatch !== null && $this->safe($this->swatch) ? $this->swatch : 'var(--color-primary)';
    }

    /**
     * The theme's CSS custom properties, ready for a declaration block.
     *
     * @return array<string, string>
     */
    public function properties(): array
    {
        $properties = [];

        foreach ($this->colors as $token => $value) {
            if ($this->safe($token) && $this->safe($value)) {
                $properties['--color-'.$token] = $value;
            }
        }

        if ($this->radius !== null && $this->safe($this->radius)) {
            $properties['--radius-radius'] = $this->radius;
        }

        return $properties;
    }

    /**
     * Values end up inside a <style> block, so nothing that could close the
     * declaration or the element gets through.
     */
    private function safe(string $value): bool
    {
        return $value !== '' && preg_match('/[;{}<>"\'\\\\]/', $value) !== 1;
    }
}
