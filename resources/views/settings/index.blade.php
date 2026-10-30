{{-- The `atrium.settings` screen: header actions always render; an open
     registered tab's panel replaces the panel list, and `before` and `after`
     render only around it. --}}
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

        @if (count($panels) === 0)
            <x-atrium::empty-state :title="__('atrium::atrium.no_settings_panels')" />
        @else
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($panels as $panel)
                    <x-atrium::card :title="$panel->label" :subtitle="$panel->description">
                        <x-atrium::button variant="outline" :href="route('atrium.settings.show', $panel->key)">
                            {{ $panel->label }}
                        </x-atrium::button>
                    </x-atrium::card>
                @endforeach
            </div>
        @endif

        <x-atrium::screen-sections :screen="$resolved" slot="after" class="mt-5" />
    @endif
</x-atrium::layout>
