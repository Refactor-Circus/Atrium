<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\ScreenHost\ScreenHostController;
use Workbench\App\Models\User;

beforeEach(function (): void {
    ScreenHostController::register();
});

/**
 * The markup of one host row, from its opening tag to the next row's.
 */
function rowSlotsRow(string $html, int $id): string
{
    $start = strpos($html, 'data-testid="row-'.$id.'"');

    expect($start)->not->toBeFalse();

    $end = strpos($html, 'data-testid="row-', (int) $start + 1);

    return substr($html, (int) $start, $end === false ? null : $end - (int) $start);
}

/**
 * The innermost exception, past Blade's view wrappers.
 */
function rowSlotsCause(Closure $render): ?Throwable
{
    try {
        $render();
    } catch (Throwable $exception) {
        while ($exception->getPrevious() !== null) {
            $exception = $exception->getPrevious();
        }

        return $exception;
    }

    return null;
}

/**
 * A row section admitting only the second row, counting its closures.
 *
 * @param  list<string>  $asked
 * @param  list<string>  $resolved
 */
function rowSlotsSection(array &$asked, array &$resolved): SectionDefinition
{
    return SectionDefinition::make('acme.row-action')
        ->view('screens.marker')
        ->authorize(function (Request $request, ?Model $record, Screen $screen) use (&$asked): bool {
            $asked[] = $record?->name;

            return $record?->getKey() === 2;
        })
        ->resolve(function (?Model $record) use (&$resolved): array {
            $resolved[] = $record?->name;

            return ['marker' => 'row action'];
        });
}

it('renders a row section in the rows it admits, with the row as its record', function (): void {
    $asked = [];
    $resolved = [];

    Atrium::screens()->section('test.list', 'row.actions', rowSlotsSection($asked, $resolved));

    $html = $this->get(route('test.list'))->assertOk()->getContent();

    expect(substr_count($html, 'row action on test.list'))->toBe(1)
        ->and(rowSlotsRow($html, 2))->toContain('row action on test.list for Row 2')
        ->and(rowSlotsRow($html, 1))->not->toContain('row action')
        ->and(rowSlotsRow($html, 3))->not->toContain('row action')
        ->and($asked)->toBe(['Row 1', 'Row 2', 'Row 3'])
        ->and($resolved)->toBe(['Row 2']);
});

it('remembers each row\'s answer and data when the rows render again in the request', function (): void {
    $asked = [];
    $resolved = [];

    Atrium::screens()->section('test.list', 'row.actions', rowSlotsSection($asked, $resolved));

    $screen = Atrium::screens()->resolve(Screen::standard('test.list', Screen::LIST), request());
    $rows = [1, 2, 3];
    $template = '<x-atrium::screen-sections :screen="$screen" slot="row.actions" :row="$row" />';

    foreach ([1, 2] as $pass) {
        foreach ($rows as $id) {
            $row = new User()->forceFill(['id' => $id, 'name' => 'Row '.$id]);
            $html = Blade::render($template, ['screen' => $screen, 'row' => $row]);

            expect(str_contains($html, 'row action'))->toBe($id === 2);
        }
    }

    expect($asked)->toBe(['Row 1', 'Row 2', 'Row 3'])
        ->and($resolved)->toBe(['Row 2']);
});

it('refuses a row slot without its row and a normal slot with one', function (): void {
    $screen = Atrium::screens()->resolve(Screen::standard('test.list', Screen::LIST), request());
    $row = new User()->forceFill(['id' => 1, 'name' => 'Row 1']);

    $withoutRow = rowSlotsCause(fn () => Blade::render('<x-atrium::screen-sections :screen="$screen" slot="row.actions" />', ['screen' => $screen]));
    $withRow = rowSlotsCause(fn () => Blade::render('<x-atrium::screen-sections :screen="$screen" slot="before" :row="$row" />', ['screen' => $screen, 'row' => $row]));

    expect($withoutRow)->toBeInstanceOf(InvalidArgumentException::class)
        ->and($withoutRow?->getMessage())->toContain('[row.actions]')
        ->and($withRow)->toBeInstanceOf(InvalidArgumentException::class)
        ->and($withRow?->getMessage())->toContain('[before]');
});

it('never runs or renders a section on a slot the screen did not declare', function (): void {
    $calls = 0;

    $count = function () use (&$calls): bool {
        $calls++;

        return true;
    };

    Atrium::screens()
        ->section('test.list', 'row.undeclared', SectionDefinition::make('acme.undeclared-row')->view('screens.marker')->authorize($count))
        ->section('test.list', 'aside', SectionDefinition::make('acme.aside')->view('screens.marker')->authorize($count));

    $this->get(route('test.list'))
        ->assertOk()
        ->assertDontSee('section-acme.undeclared-row', false)
        ->assertDontSee('section-acme.aside', false);

    expect($calls)->toBe(0);
});
