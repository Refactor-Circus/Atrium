@php($visible = $placements->reject(fn ($placement) => $placement->isOrphaned())->values())

{{-- The `atrium.dashboard` (or `atrium.named-dashboard`) screen: header
     actions always render; an open registered tab's panel replaces the
     widgets, and `before`, `aside` and `after` render only around them. --}}
@php($panelOpen = $resolved->openRegisteredTab !== null)
@php($aside = ! $panelOpen && $resolved->sections('aside') !== [])

{{-- The Alpine scope wraps the header too, so the edit toggle and the grid
     share one state. --}}
<x-atrium::layout :title="$dashboard?->name ?? __('atrium::atrium.dashboard')">
    <div x-data="atriumDashboard({
            endpoint: @js($dashboard ? route('atrium.dashboards.layout', $dashboard) : null),
            placements: @js($visible->map(fn ($placement) => [
                'id' => $placement->id,
                'widget_key' => $placement->widget_key,
                'grid_width' => $placement->grid_width,
                'grid_height' => $placement->grid_height,
            ])->values()),
         })">

        <x-atrium::page-header :title="$dashboard?->name ?? __('atrium::atrium.dashboard')">
            <x-slot:actions>
                @include('atrium::dashboard.switcher')

                @if ($editable && ! $panelOpen)
                    {{-- Two buttons rather than one with x-text, so each label
                         is real markup present before Alpine boots. --}}
                    <x-atrium::button variant="outline" data-testid="edit-layout"
                                      x-show="! editing" x-on:click="editing = true">
                        {{ __('atrium::atrium.edit_layout') }}
                    </x-atrium::button>

                    <x-atrium::button variant="outline" data-testid="done-editing"
                                      x-show="editing" x-cloak x-on:click="editing = false">
                        {{ __('atrium::atrium.done_editing') }}
                    </x-atrium::button>
                @endif

                <x-atrium::screen-sections :screen="$resolved" slot="header.actions" />
            </x-slot:actions>
        </x-atrium::page-header>

        <x-atrium::screen-tabs :screen="$resolved" class="mt-4" />

        @if ($panelOpen)
            <x-atrium::screen-tab-panel :screen="$resolved" class="mt-4" />
        @else
            <p class="mt-2 min-h-5 text-sm text-on-surface/70 dark:text-on-surface-dark/70"
               role="status" aria-live="polite" data-testid="save-status"
               x-text="saving ? @js(__('atrium::atrium.saving')) : (saved > 0 ? @js(__('atrium::atrium.saved')) : '')"></p>

            <x-atrium::screen-sections :screen="$resolved" slot="before" class="mt-4" />

            @if ($aside)
                <div class="mt-4 grid gap-6 lg:grid-cols-3">
                    <div class="lg:col-span-2">
            @endif

            @if ($dashboard === null)
                <x-atrium::empty-state :title="__('atrium::atrium.no_widgets')" />
            @else
                @if ($visible->isEmpty())
                    <x-atrium::empty-state :title="__('atrium::atrium.no_widgets')">
                        @if ($editable)
                            <x-slot:actions>
                                <x-atrium::button data-testid="add-widget"
                                                  x-on:click="$dispatch('atrium-modal-open', 'atrium-widget-picker')">
                                    {{ __('atrium::atrium.add_widget') }}
                                </x-atrium::button>
                            </x-slot:actions>
                        @endif
                    </x-atrium::empty-state>
                @endif

                <div class="mt-4 grid grid-cols-12 gap-4">
                    @foreach ($visible as $placement)
                        @include('atrium::dashboard.widget', ['placement' => $placement, 'editable' => $editable])
                    @endforeach
                </div>

                @if ($editable)
                    @if ($visible->isNotEmpty())
                        <div class="mt-4">
                            <x-atrium::button variant="outline" data-testid="add-widget"
                                              x-on:click="$dispatch('atrium-modal-open', 'atrium-widget-picker')">
                                {{ __('atrium::atrium.add_widget') }}
                            </x-atrium::button>
                        </div>
                    @endif

                    @include('atrium::dashboard.picker', ['available' => $available])
                @endif
            @endif

            @if ($aside)
                    </div>

                    <aside class="mt-4 flex flex-col gap-4" data-testid="screen-aside">
                        <x-atrium::screen-sections :screen="$resolved" slot="aside" />
                    </aside>
                </div>
            @endif

            <x-atrium::screen-sections :screen="$resolved" slot="after" class="mt-6" />
        @endif
    </div>
</x-atrium::layout>
