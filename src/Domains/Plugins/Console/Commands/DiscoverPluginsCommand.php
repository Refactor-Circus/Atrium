<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Console\Commands;

use Illuminate\Console\Command;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleDiscovery;
use RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery;

class DiscoverPluginsCommand extends Command
{
    protected $signature = 'atrium:discover';

    protected $description = 'Cache the Atrium plugins and front-end modules installed packages declare.';

    public function handle(ComposerPluginDiscovery $discovery, ModuleDiscovery $modules): int
    {
        $plugins = $discovery->build();

        foreach ($plugins as $plugin) {
            $this->components->task($plugin);
        }

        $this->components->info(sprintf('%d Atrium plugin(s) cached.', count($plugins)));

        $discovered = $modules->build();

        foreach ($discovered as $module) {
            $this->components->task($module->key.' module');
        }

        $this->components->info(sprintf('%d Atrium front-end module(s) cached.', count($discovered)));

        return self::SUCCESS;
    }
}
