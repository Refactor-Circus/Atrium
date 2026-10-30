{{--
    The open registered tab's panel, which replaces the host's page content;
    nothing while a built-in tab is open. A view gets the tab's data with the
    host's `screen`, `record` and `tab` over it; a component gets it as one
    `data` prop. A panel that throws is not caught: the request fails as any
    page would.

    <x-atrium::screen-tab-panel :screen="$resolved" />
--}}
@props(['screen'])

@if ($screen->openRegisteredTab !== null)
    @php
        $atriumTab = $screen->openRegisteredTab;
        $atriumData = $screen->data($atriumTab);

        $atriumHtml = $atriumTab->component !== null
            ? \Illuminate\Support\Facades\Blade::render('<x-'.$atriumTab->component.' :data="$data" />', ['data' => $atriumData])
            : view($atriumTab->view, [
                ...$atriumData,
                'screen' => $screen->screen,
                'record' => $screen->screen->record,
                'tab' => $screen->openTab,
            ])->render();
    @endphp

    <div {{ $attributes->merge(['data-testid' => 'tab-panel-'.$atriumTab->key]) }}>{!! $atriumHtml !!}</div>
@endif
