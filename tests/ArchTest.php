<?php

declare(strict_types=1);
use Illuminate\Database\Eloquent\Model;
use RefactorCircus\Atrium\Support\Tables;
use RefactorCircus\Keystone\Testing\Arch;

const ATRIUM_DOMAINS = __DIR__.'/../src/Domains';

// Every Action in the source: the domains' and any outside them.
const ATRIUM_ACTIONS = [ATRIUM_DOMAINS.'/*/Actions/*.php', __DIR__.'/../src/Actions/*.php'];

arch()->preset()->php();

arch()->preset()->security();

arch('nothing is revived with unserialize()')
    ->expect('unserialize')
    ->not->toBeUsed();

arch('it will not use dd(), ddd(), env(), or exit()')
    ->expect(['dd', 'ddd', 'env', 'exit'])
    ->each->not->toBeUsed();

arch('the package source declares strict types')
    ->expect('RefactorCircus\Atrium')
    ->toUseStrictTypes();

arch('domain models are named for their entity and end in Model')
    ->expect('RefactorCircus\Atrium\Domains\Dashboard\Models')
    ->classes()
    ->toExtend(Model::class)
    ->toHaveSuffix('Model');

arch('actions take their input as Data objects, not arrays')
    ->expect(fn (): array => array_values(array_filter(
        array_map(function (string $action): ?string {
            // Atrium's actions extend Keystone's Action, whose `execute()`
            // forwards to the action's own `handle()`.
            foreach ((new ReflectionMethod($action, 'handle'))->getParameters() as $parameter) {
                $type = $parameter->getType();

                if ($type instanceof ReflectionNamedType && $type->getName() === 'array') {
                    return $action.'::handle($'.$parameter->getName().')';
                }
            }

            return null;
        }, Arch::domainClasses('RefactorCircus\Atrium', ATRIUM_DOMAINS, 'Actions')),
    )))
    ->toBeEmpty();

arch('action input validates itself')
    ->expect(fn (): array => Arch::dataWithoutRules(Arch::domainClasses('RefactorCircus\Atrium', ATRIUM_DOMAINS, 'Data')))
    ->toBeEmpty();

arch('every action dispatches a starting and a finished event')
    ->expect(fn (): array => Arch::actionEventGaps(ATRIUM_ACTIONS))
    ->toBeEmpty();

arch('actions write inside a transaction')
    ->expect(fn (): array => Arch::writesOutsideTransactions(ATRIUM_ACTIONS))
    ->toBeEmpty();

arch('every model fires an event for every lifecycle hook')
    ->expect(fn (): array => Arch::modelEventGaps(Arch::domainClasses('RefactorCircus\Atrium', ATRIUM_DOMAINS, 'Models')))
    ->toBeEmpty();

arch('requests validate once, with the Data rules, and build from what they validated')
    ->expect(fn (): array => array_values(array_filter(
        (array) glob(ATRIUM_DOMAINS.'/*/Http/Requests/*.php'),
        fn (string $path): bool => str_contains((string) file_get_contents($path), 'Data::from('),
    )))
    ->toBeEmpty();

arch('every model has a policy in the config')
    ->expect(fn (): array => Arch::modelsWithoutPolicies(
        Arch::domainClasses('RefactorCircus\Atrium', ATRIUM_DOMAINS, 'Models'),
        (require __DIR__.'/../config/atrium.php')['policies'],
    ))
    ->toBeEmpty();

arch('tables are named through Tables, never as literals')
    ->expect(fn (): array => Arch::literalTableNames(
        [...array_values(array_filter(
            array_map(fn (SplFileInfo $file): string => $file->getPathname(), iterator_to_array(new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__.'/../src', FilesystemIterator::SKIP_DOTS)))),
            fn (string $path): bool => str_ends_with($path, '.php') && ! str_ends_with($path, 'Support/Tables.php'),
        )), ...(array) glob(__DIR__.'/../database/migrations/*.php')],
        array_values(Tables::DEFAULTS),
    ))
    ->toBeEmpty();
