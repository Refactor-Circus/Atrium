{{-- The `atrium.settings` screen: header actions always render; an open
     registered tab's panel replaces the panel list, and `before`, `after` and
     each panel row's `row.actions` render only around it. A row is the
     panel's SettingsPanelRow, so row sections receive it as `$record`. --}}
<x-atrium::layout :title="__('atrium::atrium.settings')">
    <x-atrium::page-header :title="__('atrium::atrium.settings')">
        @if ($resolved->sections('header.actions') !== [])
            <x-slot:actions>
                <x-atrium::screen-sections :screen="$resolved" slot="header.actions" />
            </x-slot:actions>
        @endif
    </x-atrium::page-header>

    <x-atrium::screen-tabs :screen="$resolved" class="mt-4" />

    @if ($resolved->openRegisteredTab !== null)
        <x-atrium::screen-tab-panel :screen="$resolved" class="mt-5" />
    @else
        <x-atrium::screen-sections :screen="$resolved" slot="before" class="mt-5" />

        @if (count($rows) === 0)
            <x-atrium::empty-state :title="__('atrium::atrium.no_settings_panels')" />
        @else
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($rows as $row)
                    <x-atrium::card :title="$row->panel->label" :subtitle="$row->panel->description">
                        <x-atrium::button variant="outline" :href="route('atrium.settings.show', $row->panel->key)">
                            {{ $row->panel->label }}
                        </x-atrium::button>

                        <x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$row" class="mt-3" />
                    </x-atrium::card>
                @endforeach
            </div>
        @endif

        <x-atrium::screen-sections :screen="$resolved" slot="after" class="mt-5" />
    @endif
</x-atrium::layout>
