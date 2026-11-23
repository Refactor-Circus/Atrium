<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Facades\Atrium;
use RefactorCircus\Atrium\Tests\Feature\Screens\JsonScreenHost;
use Workbench\App\Models\User;

beforeEach(function (): void {
    JsonScreenHost::register();
});

/**
 * A row section admitting only the second row, recording its closures' rows.
 */
function rowSlotsSection(ArrayObject $asked, ArrayObject $resolved): SectionDefinition
{
    return SectionDefinition::make('acme.row-action')
        ->authorize(function (Request $request, ?Model $record, Screen $screen) use ($asked): bool {
            $asked[] = $record?->name;

            return $record?->getKey() === 2;
        })
        ->resolve(function (?Model $record) use ($resolved): array {
            $resolved[] = $record?->name;

            return ['row' => $record?->name];
        });
}

it('sends a row section in the rows it admits, with the row as its record', function (): void {
    $asked = new ArrayObject;
    $resolved = new ArrayObject;

    Atrium::screens()->section('test.list', 'row.actions', rowSlotsSection($asked, $resolved));

    $rows = $this->getJson(route('test.list'))->assertOk()->json('data.rows');

    expect($rows)->toBe([
        1 => ['row.actions' => []],
        2 => ['row.actions' => [['key' => 'acme.row-action', 'label' => 'acme.row-action', 'component' => 'acme.row-action', 'data' => ['row' => 'Row 2']]]],
        3 => ['row.actions' => []],
    ])
        ->and($asked->getArrayCopy())->toBe(['Row 1', 'Row 2', 'Row 3'])
        ->and($resolved->getArrayCopy())->toBe(['Row 2']);
});

it('remembers each row\'s answer and data across serializations in the request', function (): void {
    $asked = new ArrayObject;
    $resolved = new ArrayObject;

    Atrium::screens()->section('test.list', 'row.actions', rowSlotsSection($asked, $resolved));

    $screen = Atrium::screens()->resolve(Screen::standard('test.list', Screen::LIST), request());

    foreach ([1, 2] as $pass) {
        // Each pass builds new rows, so only their keys tie them together.
        $rows = array_map(fn (int $id): User => new User()->forceFill(['id' => $id, 'name' => 'Row '.$id]), [1, 2, 3]);

        $payload = json_decode((string) json_encode(new ResolvedScreenResource($screen)->withRows($rows)->resolve()), true);

        expect(array_map(fn (array $slots): int => count($slots['row.actions']), $payload['rows']))->toBe([1 => 0, 2 => 1, 3 => 0]);
    }

    expect($asked->getArrayCopy())->toBe(['Row 1', 'Row 2', 'Row 3'])
        ->and($resolved->getArrayCopy())->toBe(['Row 2']);
});

it('refuses a row slot without its row and a normal slot with one', function (): void {
    $screen = Atrium::screens()->resolve(Screen::standard('test.list', Screen::LIST), request());
    $row = new User()->forceFill(['id' => 1, 'name' => 'Row 1']);

    expect(fn () => $screen->sections('row.actions'))->toThrow(InvalidArgumentException::class, '[row.actions]')
        ->and(fn () => $screen->rowSections('before', $row))->toThrow(InvalidArgumentException::class, '[before]');
});

it('refuses a row without a key', function (): void {
    $screen = Atrium::screens()->resolve(Screen::standard('test.list', Screen::LIST), request());

    expect(fn () => new ResolvedScreenResource($screen)->withRows([new User])->resolve())
        ->toThrow(InvalidArgumentException::class, 'needs a key');
});

it('never runs or sends a section on a slot the screen did not declare', function (): void {
    $calls = 0;

    $count = function () use (&$calls): bool {
        $calls++;

        return true;
    };

    Atrium::screens()
        ->section('test.list', 'row.undeclared', SectionDefinition::make('acme.undeclared-row')->authorize($count))
        ->section('test.list', 'aside', SectionDefinition::make('acme.aside')->authorize($count));

    $screen = $this->getJson(route('test.list'))->assertOk()->json('data');

    expect($screen['sections'])->not->toHaveKey('aside')
        ->and(array_keys($screen['rows'][1]))->toBe(['row.actions'])
        ->and($calls)->toBe(0);
});
