<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Support\Tables;

/**
 * Atrium 2: every widget placement gets a `uuid`, its public identity in the
 * API (lazy widget URLs, layout payloads), and every dashboard a `version`,
 * which each layout or meta update moves on so a stale client is refused.
 *
 * Placements from v1 have no uuid: the column is added nullable, backfilled
 * in chunks, and only then made unique and not null.
 */
return new class extends Migration
{
    /**
     * How many placements the backfill reads at a time.
     */
    public const int CHUNK = 500;

    public function up(): void
    {
        $widgets = Tables::name('dashboard_widgets');

        Schema::table($widgets, function (Blueprint $table): void {
            $table->uuid('uuid')->nullable()->after('id');
        });

        Schema::table(Tables::name('dashboards'), function (Blueprint $table): void {
            $table->unsignedInteger('version')->default(1);
        });

        DB::table($widgets)->whereNull('uuid')->orderBy('id')->chunkById(self::CHUNK, function (Collection $placements) use ($widgets): void {
            foreach ($placements as $placement) {
                DB::table($widgets)->where('id', $placement->id)->update(['uuid' => (string) Str::uuid7()]);
            }
        });

        Schema::table($widgets, function (Blueprint $table): void {
            $table->uuid('uuid')->nullable(false)->change();
            $table->unique('uuid');
        });
    }

    public function down(): void
    {
        $widgets = Tables::name('dashboard_widgets');

        Schema::table($widgets, function (Blueprint $table): void {
            $table->dropUnique(['uuid']);
        });

        Schema::table($widgets, function (Blueprint $table): void {
            $table->dropColumn('uuid');
        });

        Schema::table(Tables::name('dashboards'), function (Blueprint $table): void {
            $table->dropColumn('version');
        });
    }
};
