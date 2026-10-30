{{-- The `atrium.settings-panel` screen: header actions always render; an
     open registered tab's panel replaces the settings panel, and `before`,
     `aside` and `after` render only around it. --}}
@php($panelOpen = $resolved->openRegisteredTab !== null)
@php($aside = ! $panelOpen && $resolved->sections('aside') !== [])

<x-atrium::layout :title="$panel->label">
    <x-atrium::page-header :title="$panel->label" :description="$panel->description">
        @if ($resolved->sections('header.actions') !== [])
            <x-slot:actions>
                <x-atrium::screen-sections :screen="$resolved" slot="header.actions" />
            </x-slot:actions>
        @endif
    </x-atrium::page-header>

    <x-atrium::screen-tabs :screen="$resolved" class="mt-4" />

    @if ($panelOpen)
        <x-atrium::screen-tab-panel :screen="$resolved" class="mt-5" />
    @else
        <x-atrium::screen-sections :screen="$resolved" slot="before" class="mt-5" />

        @if ($aside)
            <div class="mt-5 grid gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2">
        @else
                <div class="mt-5">
        @endif
                    @if ($panel->component)
                        <x-dynamic-component :component="$panel->component"
                                             :attributes="new \Illuminate\View\ComponentAttributeBag($panel->resolveData())" />
                    @elseif ($panel->view)
                        @include($panel->view, $panel->resolveData())
                    @endif
                </div>

        @if ($aside)
                <aside class="flex flex-col gap-4" data-testid="screen-aside">
                    <x-atrium::screen-sections :screen="$resolved" slot="aside" />
                </aside>
            </div>
        @endif

        <x-atrium::screen-sections :screen="$resolved" slot="after" class="mt-5" />
    @endif
</x-atrium::layout>
