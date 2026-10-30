{{--
    A screen's tab bar: the built-in tabs, then the registered ones the viewer
    may see, as icon-button links to `?tab={key}` that keep the rest of the
    query string except `page`. The open tab is the primary button and has
    aria-current="page". The bar is a flex row, which never wraps, and
    scrolls sideways when its tabs overflow. It renders nothing while fewer
    than two tabs are visible.

    <x-atrium::screen-tabs :screen="$resolved" />
--}}
@props(['screen'])

@if (count($screen->tabs) >= 2)
    <nav {{ $attributes->merge(['data-testid' => 'screen-tabs'])->class('flex items-center gap-1 overflow-x-auto border-b border-outline pb-2 dark:border-outline-dark') }}>
        @foreach ($screen->tabs as $tab)
            @php($open = $tab->key === $screen->openTab)

            <x-atrium::icon-button
                :icon="\RefactorCircus\Atrium\Support\Icons::has($tab->icon) ? $tab->icon : \RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition::DEFAULT_ICON"
                :label="$tab->label"
                :href="request()->fullUrlWithQuery(['page' => null, 'tab' => $tab->key])"
                :variant="$open ? 'primary' : 'ghost'"
                :data-testid="'tab-'.$tab->key"
                :aria-current="$open ? 'page' : null"
            />
        @endforeach
    </nav>
@endif
