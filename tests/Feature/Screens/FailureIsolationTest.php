<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Exceptions;
use Illuminate\View\ViewException;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;

beforeEach(function (): void {
    ScreenHostController::register();
});

it('discards the markup of a section whose view throws, reports it, and still answers 200', function (): void {
    Exceptions::fake();

    Atrium::screens()
        ->section('test.host', 'before', SectionDefinition::make('acme.broken')->view('screens.throws')->public())
        ->section('test.host', 'before', SectionDefinition::make('acme.fine')->view('screens.marker')->public()
            ->resolve(fn (): array => ['marker' => 'still here']));

    $this->get(route('test.host'))
        ->assertOk()
        ->assertDontSee('leaked markup')
        ->assertDontSee('section-acme.broken', false)
        ->assertSee('still here on test.host');

    Exceptions::assertReportedCount(1);
    // Blade wraps what a view throws, naming the view.
    Exceptions::assertReported(fn (ViewException $exception): bool => str_contains($exception->getMessage(), 'The section view failed.')
        && $exception->getPrevious() instanceof RuntimeException);
});

it('isolates a resolver that throws, an HTTP exception included', function (): void {
    Atrium::screens()
        ->section('test.host', 'after', SectionDefinition::make('acme.aborts')->view('screens.marker')->public()
            ->resolve(fn (): array => abort(404)))
        ->section('test.host', 'after', SectionDefinition::make('acme.fails')->view('screens.marker')->public()
            ->resolve(fn (): array => throw new LogicException('The resolver failed.')))
        ->section('test.host', 'after', SectionDefinition::make('acme.fine')->view('screens.marker')->public());

    // The HTTP exception goes to report() too, which Laravel's handler
    // leaves unlogged, as it does any HTTP exception.
    $this->get(route('test.host'))
        ->assertOk()
        ->assertDontSee('section-acme.aborts', false)
        ->assertDontSee('section-acme.fails', false)
        ->assertSee('data-testid="section-acme.fine"', false);
});

it('reports a row section failing in every row once', function (): void {
    Exceptions::fake();

    $calls = 0;

    Atrium::screens()->section('test.list', 'row.actions', SectionDefinition::make('acme.row-broken')->view('screens.marker')->public()
        ->resolve(function () use (&$calls): array {
            $calls++;

            throw new RuntimeException('The row resolver failed.');
        }));

    $this->get(route('test.list'))
        ->assertOk()
        ->assertSee('Row 3')
        ->assertDontSee('section-acme.row-broken', false);

    expect($calls)->toBe(3);

    Exceptions::assertReportedCount(1);
    Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'The row resolver failed.');
});

it('lets a throwing open tab panel fail the request', function (): void {
    Atrium::screens()->tab('test.host', TabDefinition::make('acme.broken')->view('screens.throws')->public());

    $this->get(route('test.host', ['tab' => 'acme.broken']))->assertStatus(500);
});
