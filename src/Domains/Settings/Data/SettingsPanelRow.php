<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings\Data;

use Illuminate\Database\Eloquent\Model;

/**
 * One settings panel as a row of the `atrium.settings` screen.
 *
 * A row slot's row is a model, and a settings panel is not one, so each panel
 * is wrapped in this unsaved stand-in: keyed by the panel's key, so screen
 * extensions remember their answers per panel, and carrying the panel for
 * registrants to read as `$record->panel`. It has no table and is never
 * saved, so it lives here rather than in `Models/` and needs no policy or
 * lifecycle events.
 */
final class SettingsPanelRow extends Model
{
    /** @var string */
    protected $primaryKey = 'key';

    /** @var string */
    protected $keyType = 'string';

    /** @var bool */
    public $incrementing = false;

    /** @var bool */
    public $timestamps = false;

    public private(set) SettingsPanel $panel;

    public static function for(SettingsPanel $panel): self
    {
        $row = new self;
        $row->forceFill(['key' => $panel->key]);
        $row->panel = $panel;

        return $row;
    }
}
