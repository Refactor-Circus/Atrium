{{--
    The screen-extensions test host. `header.actions` always renders; with a
    registered tab open its panel replaces the page content, and the other
    slots render only while a built-in tab is open.
--}}
@php($screen = $resolved->screen)

<x-atrium::layout :title="$screen->key">
    <x-slot:header>
        <x-atrium::page-header :title="$screen->key" description="A workbench screen that packages extend through Atrium::screens().">
            <x-slot:actions>
                <x-atrium::screen-sections :screen="$resolved" slot="header.actions" />
            </x-slot:actions>
        </x-atrium::page-header>

        <x-atrium::screen-tabs :screen="$resolved" class="mt-4" />
    </x-slot:header>

    @if ($resolved->openRegisteredTab !== null)
        <x-atrium::screen-tab-panel :screen="$resolved" />
    @else
        <x-atrium::screen-sections :screen="$resolved" slot="before" class="mb-6" />

        @if ($screen->kind === \RefactorCircus\Atrium\Domains\Screens\Data\Screen::DETAIL)
            <div class="grid gap-6 lg:grid-cols-3">
                <x-atrium::card class="lg:col-span-2" data-testid="host-content">
                    <p>{{ $screen->record?->name }}: the {{ $resolved->openTab }} tab.</p>
                </x-atrium::card>

                <aside class="flex flex-col gap-4" data-testid="host-aside">
                    <x-atrium::screen-sections :screen="$resolved" slot="aside" />
                </aside>
            </div>
        @else
            <x-atrium::table data-testid="host-content">
                <x-slot:head>
                    <x-atrium::table.row>
                        <x-atrium::table.cell heading>Name</x-atrium::table.cell>
                        <x-atrium::table.cell heading><span class="sr-only">Actions</span></x-atrium::table.cell>
                    </x-atrium::table.row>
                </x-slot:head>

                @foreach ($rows as $row)
                    <x-atrium::table.row data-testid="row-{{ $row->getKey() }}">
                        <x-atrium::table.cell>{{ $row->name }}</x-atrium::table.cell>
                        <x-atrium::table.cell numeric>
                            <x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$row" class="inline-flex" />
                        </x-atrium::table.cell>
                    </x-atrium::table.row>
                @endforeach
            </x-atrium::table>
        @endif

        <x-atrium::screen-sections :screen="$resolved" slot="after" class="mt-6" />
    @endif
</x-atrium::layout>
