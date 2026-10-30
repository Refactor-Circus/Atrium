{{--
    A placed widget's body. The dashboard page includes it inline; the lazy
    widget endpoint renders it as the `atrium.dashboard-widget` screen and
    passes that screen as `widgetScreen`, so header actions and the tab bar
    sit above it, `before`, `aside` and `after` around it, and an open
    registered tab's panel replaces it.
--}}
@php
    $atriumWidgetScreen = $widgetScreen ?? null;
    $atriumWidgetPanel = $atriumWidgetScreen !== null && $atriumWidgetScreen->openRegisteredTab !== null;
    $atriumWidgetAside = $atriumWidgetScreen !== null && ! $atriumWidgetPanel && $atriumWidgetScreen->sections('aside') !== [];
@endphp

@if ($atriumWidgetScreen !== null)
    @if ($atriumWidgetScreen->sections('header.actions') !== [])
        <div class="mb-4 flex items-center justify-end gap-2">
            <x-atrium::screen-sections :screen="$atriumWidgetScreen" slot="header.actions" />
        </div>
    @endif

    <x-atrium::screen-tabs :screen="$atriumWidgetScreen" class="mb-4" />
@endif

@if ($atriumWidgetPanel)
    <x-atrium::screen-tab-panel :screen="$atriumWidgetScreen" />
@else
    @if ($atriumWidgetScreen !== null)
        <x-atrium::screen-sections :screen="$atriumWidgetScreen" slot="before" class="mb-4" />
    @endif

    @if ($atriumWidgetAside)
        <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
    @endif

    @if ($definition?->component)
        <x-dynamic-component :component="$definition->component"
                             :attributes="new \Illuminate\View\ComponentAttributeBag($definition->resolveData($placement->settings ?? []))" />
    @elseif ($definition?->view)
        @include($definition->view, $definition->resolveData($placement->settings ?? []))
    @endif

    @if ($atriumWidgetAside)
            </div>

            <aside class="flex flex-col gap-4" data-testid="screen-aside">
                <x-atrium::screen-sections :screen="$atriumWidgetScreen" slot="aside" />
            </aside>
        </div>
    @endif

    @if ($atriumWidgetScreen !== null)
        <x-atrium::screen-sections :screen="$atriumWidgetScreen" slot="after" class="mt-4" />
    @endif
@endif
