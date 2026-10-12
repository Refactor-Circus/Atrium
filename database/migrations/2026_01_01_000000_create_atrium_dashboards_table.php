<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use RefactorCircus\Atrium\Support\Tables;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(Tables::name('dashboards'), function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->index();

            // Nullable owner: a dashboard with no owner is shared with everyone.
            $table->nullableMorphs('owner');

            $table->boolean('is_default')->default(false);
            $table->boolean('is_shared')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(Tables::name('dashboards'));
    }
};
