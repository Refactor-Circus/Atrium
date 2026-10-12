@if ($definition?->component)
    <x-dynamic-component :component="$definition->component"
                         :attributes="new \Illuminate\View\ComponentAttributeBag($definition->resolveData($placement->settings ?? []))" />
@elseif ($definition?->view)
    @include($definition->view, $definition->resolveData($placement->settings ?? []))
@endif
