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
        Schema::create(Tables::name('dashboard_widgets'), function (Blueprint $table): void {
            $table->id();

            $table->foreignId('dashboard_id')
                ->constrained(Tables::name('dashboards'))
                ->cascadeOnDelete();

            // References a WidgetDefinition key from the widget registry. The
            // definition may disappear when a plugin is removed, so rendering
            // must tolerate a key with no matching definition.
            $table->string('widget_key');

            $table->unsignedInteger('grid_row')->default(0);
            $table->unsignedInteger('grid_column')->default(0);
            $table->unsignedInteger('grid_width')->default(4);
            $table->unsignedInteger('grid_height')->default(2);
            $table->unsignedInteger('sort')->default(0);

            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index(['dashboard_id', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(Tables::name('dashboard_widgets'));
    }
};
