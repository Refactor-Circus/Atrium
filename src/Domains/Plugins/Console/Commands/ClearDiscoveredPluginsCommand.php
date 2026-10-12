<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Console\Commands;

use Illuminate\Console\Command;
use RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery;

class ClearDiscoveredPluginsCommand extends Command
{
    protected $signature = 'atrium:clear-discovered';

    protected $description = 'Remove the cached list of discovered Atrium plugins.';

    public function handle(ComposerPluginDiscovery $discovery): int
    {
        $discovery->clear();

        $this->components->info('Cached Atrium plugins cleared.');

        return self::SUCCESS;
    }
}
