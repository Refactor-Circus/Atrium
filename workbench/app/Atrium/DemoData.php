<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Fixed business data for the demo: an online shop's orders, services and
 * goals. It is deliberately static, so every `composer serve` shows the same
 * believable numbers without the workbench needing tables of its own. The
 * people are real rows, seeded through the users table.
 */
final class DemoData
{
    /**
     * Features the workbench's resolver answers for. Anything unlisted is on.
     *
     * @var array<string, bool>
     */
    public const array FEATURES = [
        'reports' => true,
        'billing' => true,
        'audit-log' => false,
    ];

    /**
     * @return Collection<int, array{number: string, customer: string, email: string, total: float, status: string, placed: string}>
     */
    public static function orders(): Collection
    {
        return collect([
            ['number' => 'ORD-1048', 'customer' => 'Northwind Traders', 'email' => 'buying@northwind.test', 'total' => 1840.00, 'status' => 'paid', 'placed' => '12 minutes ago'],
            ['number' => 'ORD-1047', 'customer' => 'Initech', 'email' => 'peter@initech.test', 'total' => 329.50, 'status' => 'pending', 'placed' => '48 minutes ago'],
            ['number' => 'ORD-1046', 'customer' => 'Umbrella Health', 'email' => 'ops@umbrella.test', 'total' => 5120.00, 'status' => 'paid', 'placed' => '2 hours ago'],
            ['number' => 'ORD-1045', 'customer' => 'Stark Industries', 'email' => 'procurement@stark.test', 'total' => 12400.00, 'status' => 'shipped', 'placed' => '5 hours ago'],
            ['number' => 'ORD-1044', 'customer' => 'Wayne Enterprises', 'email' => 'lucius@wayne.test', 'total' => 760.25, 'status' => 'refunded', 'placed' => 'Yesterday'],
            ['number' => 'ORD-1043', 'customer' => 'Hooli', 'email' => 'gavin@hooli.test', 'total' => 2199.00, 'status' => 'shipped', 'placed' => 'Yesterday'],
            ['number' => 'ORD-1042', 'customer' => 'Soylent Foods', 'email' => 'orders@soylent.test', 'total' => 415.80, 'status' => 'failed', 'placed' => '2 days ago'],
            ['number' => 'ORD-1041', 'customer' => 'Cyberdyne Systems', 'email' => 'miles@cyberdyne.test', 'total' => 9875.00, 'status' => 'shipped', 'placed' => '3 days ago'],
        ]);
    }

    /**
     * The badge variant and label for an order status.
     *
     * @return array{variant: string, label: string}
     */
    public static function orderStatus(string $status): array
    {
        return match ($status) {
            'paid' => ['variant' => 'success', 'label' => 'Paid'],
            'shipped' => ['variant' => 'primary', 'label' => 'Shipped'],
            'pending' => ['variant' => 'info', 'label' => 'Awaiting payment'],
            'refunded' => ['variant' => 'warning', 'label' => 'Refunded'],
            'failed' => ['variant' => 'danger', 'label' => 'Payment failed'],
            default => ['variant' => 'neutral', 'label' => Str::headline($status)],
        };
    }

    /**
     * @return array<int, array{name: string, status: string, label: string, uptime: string}>
     */
    public static function services(): array
    {
        return [
            ['name' => 'Storefront', 'status' => 'success', 'label' => 'Operational', 'uptime' => '99.99%'],
            ['name' => 'Checkout API', 'status' => 'success', 'label' => 'Operational', 'uptime' => '99.97%'],
            ['name' => 'Queue workers', 'status' => 'success', 'label' => 'Operational', 'uptime' => '99.95%'],
            ['name' => 'Search index', 'status' => 'warning', 'label' => 'Degraded: reindexing', 'uptime' => '98.40%'],
            ['name' => 'Email delivery', 'status' => 'info', 'label' => 'Maintenance scheduled', 'uptime' => '99.90%'],
        ];
    }

    /**
     * @return array<string, array{value: string, change: string, trend: string}>
     */
    public static function kpis(): array
    {
        return [
            'revenue' => ['value' => '$48,250', 'change' => '+12.4% vs last month', 'trend' => 'up'],
            'orders' => ['value' => '1,284', 'change' => '+8.1% vs last month', 'trend' => 'up'],
            'conversion' => ['value' => '3.2%', 'change' => '-0.4 pts vs last month', 'trend' => 'down'],
        ];
    }

    /**
     * @return array<int, array{label: string, value: int, max: int}>
     */
    public static function goals(): array
    {
        return [
            ['label' => 'Q4 revenue: $150k', 'value' => 112, 'max' => 150],
            ['label' => 'New customers: 400', 'value' => 286, 'max' => 400],
            ['label' => 'Support tickets resolved within a day', 'value' => 91, 'max' => 100],
        ];
    }

    /**
     * Monthly figures for the reports pages.
     *
     * @return array<string, array{title: string, description: string, unit: string, rows: array<string, int>}>
     */
    public static function reports(): array
    {
        return [
            'sales' => [
                'title' => 'Sales',
                'description' => 'Revenue by month, in dollars.',
                'unit' => '$',
                'rows' => ['May' => 31200, 'June' => 34850, 'July' => 38100, 'August' => 41700, 'September' => 42930, 'October' => 48250],
            ],
            'signups' => [
                'title' => 'Signups',
                'description' => 'New customer accounts by month.',
                'unit' => '',
                'rows' => ['May' => 212, 'June' => 248, 'July' => 231, 'August' => 276, 'September' => 301, 'October' => 286],
            ],
        ];
    }

    /**
     * The store details the settings panel's Storefront tab shows.
     *
     * @return array{name: string, url: string, currency: string, timezone: string}
     */
    public static function storefront(): array
    {
        return [
            'name' => 'Acme Shop',
            'url' => 'https://shop.acme.test',
            'currency' => 'USD',
            'timezone' => 'America/New_York',
        ];
    }

    /**
     * @return array<int, array{number: string, period: string, amount: string, status: string}>
     */
    public static function invoices(): array
    {
        return [
            ['number' => 'INV-2026-010', 'period' => 'October 2026', 'amount' => '$499.00', 'status' => 'info'],
            ['number' => 'INV-2026-009', 'period' => 'September 2026', 'amount' => '$499.00', 'status' => 'success'],
            ['number' => 'INV-2026-008', 'period' => 'August 2026', 'amount' => '$499.00', 'status' => 'success'],
            ['number' => 'INV-2026-007', 'period' => 'July 2026', 'amount' => '$349.00', 'status' => 'success'],
        ];
    }
}
