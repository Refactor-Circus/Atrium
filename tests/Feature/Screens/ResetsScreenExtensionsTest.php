<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Feature\Screens;

use Illuminate\Support\ServiceProvider;
use PHPUnit\Framework\Attributes\Depends;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Testing\ResetsScreenExtensions;
use RefactorCircus\Atrium\Tests\TestCase;

final class ResetsScreenExtensionsTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [...parent::getPackageProviders($app), RegistersScreenTabOnBoot::class];
    }

    public function test_the_package_test_case_uses_the_trait(): void
    {
        $this->assertArrayHasKey(ResetsScreenExtensions::class, class_uses_recursive(TestCase::class));
    }

    public function test_a_tab_registered_on_boot_is_present_and_one_registered_in_a_test_is_added(): void
    {
        $this->assertSame(['acme.boot'], $this->tabKeys());

        Atrium::screens()->tab('test.screen', TabDefinition::make('acme.inline')->view('acme::inline'));

        $this->assertSame(['acme.boot', 'acme.inline'], $this->tabKeys());
    }

    #[Depends('test_a_tab_registered_on_boot_is_present_and_one_registered_in_a_test_is_added')]
    public function test_the_next_test_keeps_the_boot_tab_and_loses_the_test_tab(): void
    {
        $this->assertSame(['acme.boot'], $this->tabKeys());
    }

    public function test_the_snapshot_taken_after_boot_is_restored_when_the_test_ends(): void
    {
        Atrium::screens()
            ->tab('test.screen', TabDefinition::make('acme.inline')->view('acme::inline'))
            ->section('*', 'before', SectionDefinition::make('acme.inline')->view('acme::inline'));

        // What the trait runs as the application is torn down.
        $this->tearDownResetsScreenExtensions();

        $this->assertSame(['acme.boot'], $this->tabKeys());
        $this->assertSame([], Atrium::screens()->sections('*', 'before'));
    }

    public function test_restoring_its_own_snapshot_changes_nothing(): void
    {
        $screens = Atrium::screens();
        $snapshot = $screens->snapshot();

        $screens->restore($screens->snapshot());

        $this->assertEquals($snapshot, $screens->snapshot());
        $this->assertSame(['acme.boot'], $this->tabKeys());
    }

    /**
     * @return list<string>
     */
    private function tabKeys(): array
    {
        return array_map(fn (TabDefinition $tab): string => $tab->key, Atrium::screens()->tabs('test.screen'));
    }
}

/**
 * A package registering a tab from its provider's boot(), as consumers do.
 */
final class RegistersScreenTabOnBoot extends ServiceProvider
{
    public function boot(): void
    {
        Atrium::screens()->tab('test.screen', TabDefinition::make('acme.boot')->view('acme::boot'));
    }
}
