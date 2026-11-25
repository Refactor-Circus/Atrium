<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Support\ClientPath;
use Workbench\App\Models\User;

/**
 * Demonstrates every plugin surface Atrium offers with a small online shop,
 * so `composer serve` and the Nuxt playground show a working dashboard
 * rather than an empty shell.
 *
 * Atrium renders no HTML: each widget and the settings panel is a Vue
 * component the playground registers under the same key, and the shop's
 * pages read JSON from the plugin's API routes (`atrium.plugins.demo.*`).
 * Navigation and search link to the SPA's paths, which ClientPath sends as
 * `{path, external}`.
 */
class DemoPlugin extends Plugin
{
    public function key(): string
    {
        return 'demo';
    }

    public function label(): string
    {
        return 'Acme Shop';
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Overview')
                ->path('/')
                ->icon('i-lucide-house')
                ->group('Workspace')
                ->sort(10),

            NavItem::make('Orders')
                ->path('/demo/orders')
                ->icon('i-lucide-shopping-cart')
                ->group('Workspace')
                ->sort(20)
                ->badge(fn (): int => DemoData::orders()->where('status', 'pending')->count()),

            NavItem::make('Team')
                ->path('/demo/users')
                ->icon('i-lucide-users')
                ->group('Workspace')
                ->sort(30)
                ->badge(fn (): int => User::query()->count()),

            NavItem::make('Reports')
                ->icon('i-lucide-chart-column')
                ->group('Insights')
                ->sort(40)
                ->children(array_map(
                    fn (string $key): NavItem => NavItem::make(DemoData::reports()[$key]['title'])->path('/demo/reports/'.$key),
                    array_keys(DemoData::reports()),
                )),

            NavItem::make('Billing')
                ->path('/demo/billing')
                ->icon('i-lucide-credit-card')
                ->group('Administration')
                ->sort(50)
                ->feature('billing')
                ->can('manageBilling'),

            // The workbench's feature resolver turns `audit-log` off, so this
            // item is registered but never sent.
            NavItem::make('Audit log')
                ->path('/demo/audit-log')
                ->icon('i-lucide-clipboard-list')
                ->group('Administration')
                ->sort(60)
                ->feature('audit-log'),
        ];
    }

    public function navigationGroups(): array
    {
        return [
            NavGroup::make('Workspace')->icon('i-lucide-briefcase')->sort(10),
            NavGroup::make('Insights')->icon('i-lucide-chart-pie')->sort(20)->feature('reports')->can('viewReports'),
            NavGroup::make('Administration')->icon('i-lucide-settings')->sort(30)->can('administer'),
        ];
    }

    /**
     * The JSON the playground's shop pages read. Atrium loads these inside
     * its API group, under `plugins/demo` and named `atrium.plugins.demo.*`,
     * so they carry its middleware (the host's guard, then the gate).
     */
    public function routes(): void
    {
        Route::get('orders', fn (): array => [
            'data' => DemoData::orders()
                ->map(fn (array $order): array => [...$order, 'status_label' => DemoData::orderStatus($order['status'])['label']])
                ->all(),
        ])->name('orders');

        Route::get('users', fn (): array => [
            'data' => User::query()->orderBy('name')->get(['id', 'name', 'email'])->toArray(),
        ])->name('users');

        Route::get('reports/{report}', fn (string $report): array => [
            'data' => DemoData::reports()[$report],
        ])->whereIn('report', array_keys(DemoData::reports()))->name('reports.show');

        Route::get('billing', fn (): array => [
            'data' => DemoData::invoices(),
        ])->middleware('can:manageBilling')->name('billing');
    }

    public function settings(): ?SettingsPanel
    {
        return SettingsPanel::make('demo')
            ->label('Shop settings')
            ->description('Store details and the feature flags this workbench runs with.')
            ->icon('i-lucide-store')
            ->resolve(fn (): array => ['features' => DemoData::FEATURES]);
    }

    /**
     * Widgets are offered here. The workbench seeder places them on demo
     * dashboards; in a real application users pick them from the picker.
     * The four stat widgets share one Vue component, registered under each
     * of their keys.
     */
    public function widgets(): array
    {
        $kpis = DemoData::kpis();

        return [
            WidgetDefinition::make('demo.revenue')
                ->label('Revenue')
                ->description('Revenue this month against last month.')
                ->icon('i-lucide-banknote')
                ->defaultSize(3, 1)
                ->resolve(fn (): array => ['label' => 'Revenue this month', 'icon' => 'i-lucide-banknote', ...$kpis['revenue']]),

            WidgetDefinition::make('demo.orders')
                ->label('Orders')
                ->description('Orders placed this month.')
                ->icon('i-lucide-shopping-cart')
                ->defaultSize(3, 1)
                ->resolve(fn (): array => ['label' => 'Orders this month', 'icon' => 'i-lucide-shopping-cart', ...$kpis['orders']]),

            WidgetDefinition::make('demo.conversion')
                ->label('Conversion rate')
                ->description('Share of storefront visits that end in an order.')
                ->icon('i-lucide-trending-up')
                ->defaultSize(3, 1)
                ->resolve(fn (): array => ['label' => 'Conversion rate', 'icon' => 'i-lucide-trending-up', ...$kpis['conversion']]),

            WidgetDefinition::make('demo.users')
                ->label('Team members')
                ->description('People with access, read from the users table.')
                ->icon('i-lucide-users')
                ->defaultSize(3, 1)
                ->resolve(function (): array {
                    $pending = User::query()->whereNull('email_verified_at')->count();

                    return [
                        'label' => 'Team members',
                        'icon' => 'i-lucide-users',
                        'value' => User::query()->count(),
                        'change' => $pending.' awaiting invitation',
                        'trend' => null,
                    ];
                }),

            WidgetDefinition::make('demo.recent-orders')
                ->label('Recent orders')
                ->description('The latest orders and their status.')
                ->icon('i-lucide-receipt')
                ->defaultSize(8, 2)
                ->resolve(fn (): array => ['orders' => DemoData::orders()->take(5)->all()]),

            // Lazy: the dashboard arrives without its data, and the layer
            // fetches it from `atrium.dashboards.widgets.show` by uuid.
            WidgetDefinition::make('demo.services')
                ->label('Service status')
                ->description('Health of the services the shop runs on.')
                ->icon('i-lucide-activity')
                ->defaultSize(4, 2)
                ->lazy()
                ->resolve(fn (): array => ['services' => DemoData::services()]),

            WidgetDefinition::make('demo.goals')
                ->label('Quarterly goals')
                ->description('Progress toward this quarter\'s targets.')
                ->icon('i-lucide-target')
                ->defaultSize(6, 2)
                ->resolve(fn (): array => ['goals' => DemoData::goals()]),

            WidgetDefinition::make('demo.welcome')
                ->label('Welcome note')
                ->description('A card explaining what this demo shows.')
                ->icon('i-lucide-sparkles')
                ->defaultSize(6, 2),
        ];
    }

    /**
     * One source per kind of thing, so each is limited and grouped separately.
     *
     * @return array<int, SearchSource>
     */
    public function search(): array
    {
        return [
            SearchSource::make('demo.team')
                ->label('Team')
                ->description('People with access to the shop.')
                ->using(fn (string $query): array => User::query()
                    ->where(fn ($builder) => $builder->where('name', 'like', '%'.$query.'%')->orWhere('email', 'like', '%'.$query.'%'))
                    ->orderBy('name')
                    ->limit(5)
                    ->get()
                    ->map(fn (User $user): SearchResult => SearchResult::make($user->name, ClientPath::url('/demo/users'))
                        ->subtitle($user->email)
                        ->icon('i-lucide-user')
                        ->group('Team'))
                    ->all()),

            SearchSource::make('demo.orders')
                ->label('Orders')
                ->description('Customer orders by number or customer name.')
                ->using(fn (string $query): array => DemoData::orders()
                    ->filter(fn (array $order): bool => str_contains(strtolower($order['number'].' '.$order['customer']), strtolower($query)))
                    ->map(fn (array $order): SearchResult => SearchResult::make($order['number'].' · '.$order['customer'], ClientPath::url('/demo/orders#'.$order['number']))
                        ->subtitle('$'.number_format($order['total'], 2).' · '.DemoData::orderStatus($order['status'])['label'])
                        ->icon('i-lucide-receipt')
                        ->group('Orders'))
                    ->values()
                    ->all()),
        ];
    }
}
