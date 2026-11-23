<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Data;

use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;

/**
 * A screen an integration declares: its key (`roster.user`, the v1 key), its
 * kind (`detail` or `list`), the layer page's path (`/roster/users/:user`)
 * and, on a detail screen, the morph alias of its record (`subject_type`).
 *
 * The layer renders the screen; `atrium.screens.show` serves the tabs and
 * sections other packages register for it, with no model loaded.
 */
final class ScreenDeclaration
{
    /**
     * A layer path: `/` and a package, then literal segments or `:param`s.
     */
    public const string PATH_PATTERN = '#^/[a-z0-9-]+(/([a-z0-9._-]+|:[a-z][A-Za-z0-9_]*))*$#D';

    public private(set) string $key;

    /**
     * `detail` or `list`.
     */
    public private(set) string $kind;

    /**
     * The layer page's path, with `:param` placeholders.
     */
    public private(set) string $path;

    /**
     * The morph alias of the screen's record, on a detail screen.
     */
    public private(set) ?string $subjectType = null;

    /**
     * @throws InvalidArgumentException for a key, kind or path out of pattern
     */
    public function __construct(string $key, string $kind, string $path)
    {
        if (preg_match(Screen::KEY_PATTERN, $key) !== 1) {
            throw new InvalidArgumentException("Screen key [{$key}] must be {package}.{screen} and match ".Screen::KEY_PATTERN.'.');
        }

        if (! in_array($kind, [Screen::DETAIL, Screen::LIST], true)) {
            throw new InvalidArgumentException("Screen [{$key}] has the kind [{$kind}]; it must be [detail] or [list].");
        }

        if (preg_match(self::PATH_PATTERN, $path) !== 1) {
            throw new InvalidArgumentException("Screen [{$key}] has the path [{$path}]; it must match ".self::PATH_PATTERN.', such as /roster/users/:user.');
        }

        $this->key = $key;
        $this->kind = $kind;
        $this->path = $path;
    }

    public static function make(string $key, string $kind, string $path): self
    {
        return new self($key, $kind, $path);
    }

    /**
     * @throws InvalidArgumentException for an empty alias
     */
    public function subjectType(string $subjectType): self
    {
        if (trim($subjectType) === '') {
            throw new InvalidArgumentException("Screen [{$this->key}] needs a non-empty subject type.");
        }

        $this->subjectType = $subjectType;

        return $this;
    }
}
