<?php

namespace Workbench\Database\Seeders;

use Illuminate\Database\Seeder;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\CreateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use Workbench\App\Models\User;
use Workbench\Database\Factories\UserFactory;

/**
 * Demo data for `composer serve`, built through Atrium's own Actions. The
 * admin is the user testbench.yaml signs in.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = $this->user('Admin', 'admin@example.com', joined: 400);
        $grace = $this->user('Grace Hopper', 'grace@acme.test', joined: 320);
        $this->user('Ada Lovelace', 'ada@acme.test', joined: 290);
        $this->user('Alan Turing', 'alan@acme.test', joined: 120);
        $this->user('Margaret Hamilton', 'margaret@acme.test', joined: 45);
        $this->user('Katherine Johnson', 'katherine@acme.test', joined: 2, verified: false);

        // The admin's own dashboards: a default overview and a second one,
        // so the switcher and edit mode have something to show.
        $overview = $this->dashboard(new CreateDashboardData('Overview'), $admin, [
            ['demo.revenue', 3, 1],
            ['demo.orders', 3, 1],
            ['demo.conversion', 3, 1],
            ['demo.users', 3, 1],
            ['demo.recent-orders', 8, 2],
            ['demo.services', 4, 2],
            ['demo.welcome', 6, 2],
            ['demo.goals', 6, 2],
        ]);
        app(UpdateDashboardAction::class)->execute($overview, new UpdateDashboardData(isDefault: true));

        $this->dashboard(new CreateDashboardData('Operations'), $admin, [
            ['demo.services', 4, 2],
            ['demo.recent-orders', 8, 2],
            ['demo.orders', 6, 1],
            ['demo.users', 6, 1],
        ]);

        // Grace shares a dashboard with everyone. Shared dashboards have no
        // owner, so the admin can view it but not edit it.
        $this->dashboard(new CreateDashboardData('Company KPIs', isShared: true), $grace, [
            ['demo.revenue', 4, 1],
            ['demo.orders', 4, 1],
            ['demo.conversion', 4, 1],
            ['demo.goals', 12, 2],
        ]);

        // Grace's private dashboard, which the admin never sees.
        $this->dashboard(new CreateDashboardData('Grace\'s board'), $grace, [
            ['demo.recent-orders', 12, 2],
        ]);
    }

    private function user(string $name, string $email, int $joined, bool $verified = true): User
    {
        $factory = $verified ? UserFactory::new() : UserFactory::new()->unverified();

        return $factory->create([
            'name' => $name,
            'email' => $email,
            'created_at' => now()->subDays($joined),
        ]);
    }

    /**
     * Create a dashboard and lay its widgets out left to right, wrapping at
     * the grid's twelve columns.
     *
     * @param  array<int, array{0: string, 1: int, 2: int}>  $widgets  Widget key, width and height.
     */
    private function dashboard(CreateDashboardData $data, User $owner, array $widgets): DashboardModel
    {
        $dashboard = app(CreateDashboardAction::class)->execute($data, $owner);

        $row = 0;
        $column = 0;
        $layout = [];

        foreach ($widgets as [$key, $width, $height]) {
            if ($column + $width > 12) {
                $row++;
                $column = 0;
            }

            $layout[] = new WidgetPlacementData($key, $row, $column, $width, $height);

            $column += $width;
        }

        return app(SaveDashboardLayoutAction::class)->execute($dashboard, new SaveDashboardLayoutData($layout));
    }
}
