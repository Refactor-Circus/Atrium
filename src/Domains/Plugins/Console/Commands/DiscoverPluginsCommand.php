<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Console\Commands;

use Illuminate\Console\Command;
use RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery;

class DiscoverPluginsCommand extends Command
{
    protected $signature = 'atrium:discover';

    protected $description = 'Cache the Atrium plugins installed packages declare.';

    public function handle(ComposerPluginDiscovery $discovery): int
    {
        $plugins = $discovery->build();

        foreach ($plugins as $plugin) {
            $this->components->task($plugin);
        }

        $this->components->info(sprintf('%d Atrium plugin(s) cached.', count($plugins)));

        return self::SUCCESS;
    }
}
