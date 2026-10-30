{{--
    The sections of one of a screen's slots the viewer may see, in order, each
    in an element with data-testid="section-{key}" that carries any `class`
    given. A row slot renders once per row, with the row:

    <x-atrium::screen-sections :screen="$resolved" slot="before" />
    <x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$row" />

    A section's data comes from ResolvedScreen::data(), so its resolver runs
    only when it renders. A view gets the data with the host's `screen`,
    `record` and `tab` over it; a component gets it as one `data` prop. Each
    section renders into a buffer first: one whose resolver or view throws
    renders nothing, is reported once per request, and the page carries on.
--}}
@props(['screen', 'row' => null])

@php
    // `$slot` is Blade's default slot, so the slot name comes from the attributes.
    $atriumSlot = (string) $attributes->get('slot');
    $atriumSections = $row === null ? $screen->sections($atriumSlot) : $screen->rowSections($atriumSlot, $row);
    $atriumRendered = [];
    $atriumViews = view();

    foreach ($atriumSections as $atriumSection) {
        $atriumLevel = ob_get_level();

        // A view that throws makes Laravel flush the view factory's state,
        // which would take the page's open components with it; keep a copy
        // to put back.
        $atriumState = (fn (): array => get_object_vars($this))->call($atriumViews);

        try {
            $atriumData = $screen->data($atriumSection, $row);

            $atriumRendered[] = [$atriumSection->key, $atriumSection->component !== null
                ? \Illuminate\Support\Facades\Blade::render('<x-'.$atriumSection->component.' :data="$data" />', ['data' => $atriumData])
                : view($atriumSection->view, [
                    ...$atriumData,
                    'screen' => $screen->screen,
                    'record' => $row ?? $screen->screen->record,
                    'tab' => $screen->openTab,
                ])->render()];
        } catch (\Throwable $atriumException) {
            // Discard whatever the section wrote before it failed.
            while (ob_get_level() > $atriumLevel) {
                ob_end_clean();
            }

            (function (array $state): void {
                foreach ($state as $property => $value) {
                    $this->{$property} = $value;
                }
            })->call($atriumViews, $atriumState);

            app(\RefactorCircus\Atrium\Domains\Screens\Services\ScreenVisibility::class)
                ->report("render\0{$screen->screen->key}\0{$atriumSection->key}", $atriumException);
        }
    }
@endphp

@foreach ($atriumRendered as [$atriumKey, $atriumHtml])
    <div {{ $attributes->except('slot')->merge(['data-testid' => 'section-'.$atriumKey]) }}>{!! $atriumHtml !!}</div>
@endforeach
