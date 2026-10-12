<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Support\Tables;
use RefactorCircus\Keystone\Models\Concerns\DispatchesModelEvents;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $owner_type
 * @property int|string|null $owner_id
 * @property bool $is_default
 * @property bool $is_shared
 * @property int $sort
 */
class DashboardModel extends Model
{
    use DispatchesModelEvents;

    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
        'is_shared' => 'boolean',
        'sort' => 'integer',
    ];

    public function getTable(): string
    {
        return Tables::name('dashboards');
    }

    protected static function booted(): void
    {
        static::creating(function (self $dashboard): void {
            if (blank($dashboard->slug)) {
                $dashboard->slug = Str::slug($dashboard->name) ?: Str::random(8);
            }
        });
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return HasMany<DashboardWidgetModel, $this>
     */
    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidgetModel::class, 'dashboard_id')->orderBy('sort');
    }

    /**
     * Dashboards this owner can see: their own, plus shared ones.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeVisibleTo(Builder $query, ?Model $owner): Builder
    {
        return $query->where(function (Builder $query) use ($owner): void {
            $query->where('is_shared', true);

            if ($owner !== null) {
                $query->orWhere(function (Builder $query) use ($owner): void {
                    $query->where('owner_type', $owner->getMorphClass())
                        ->where('owner_id', $owner->getKey());
                });
            }
        });
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeOwnedBy(Builder $query, Model $owner): Builder
    {
        return $query->where('owner_type', $owner->getMorphClass())
            ->where('owner_id', $owner->getKey());
    }

    public function isOwnedBy(?Model $owner): bool
    {
        if ($owner === null || $this->owner_type === null) {
            return false;
        }

        return $this->owner_type === $owner->getMorphClass()
            && (string) $this->owner_id === (string) $owner->getKey();
    }
}
