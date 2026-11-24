<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Console\Commands;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'atrium:install {--force : Overwrite any existing published files}';

    protected $description = 'Publish the Atrium config, and print the authorization gate stub.';

    public function handle(): int
    {
        $this->components->info('Installing Atrium.');

        $this->callSilently('vendor:publish', [
            '--tag' => 'atrium-config',
            '--force' => (bool) $this->option('force'),
        ]);
        $this->components->task('Published config/atrium.php');

        $this->newLine();
        $this->components->warn('Atrium denies access outside the local environment until you define its gate, or your user model implements AtriumUser.');
        $this->newLine();

        $this->line('Add this to a service provider:');
        $this->newLine();
        $this->line('    Gate::define(\'viewAtrium\', function ($user) {');
        $this->line('        return $user->is_admin;');
        $this->line('    });');
        $this->newLine();

        $prefix = config('atrium.routes.prefix', 'atrium/api');
        $page = config('atrium.client_path', '/atrium');

        $this->components->info('Atrium installed. Open it at /'.(is_string($page) ? trim($page, '/') : 'atrium').'; its API is served under /'.(is_string($prefix) ? trim($prefix, '/') : 'atrium/api').'.');

        return self::SUCCESS;
    }
}
