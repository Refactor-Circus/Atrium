@php
    $sections ??= \RefactorCircus\Atrium\Facades\Atrium::navigationSections(request());
    $currentSection ??= null;
    $atriumNav ??= app(\RefactorCircus\Atrium\Domains\Navigation\Services\NavigationState::class);

    $tab = 'inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-radius px-2.5 text-sm font-medium transition-colors [&_svg]:size-4';
    $tabIdle = 'text-on-surface hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong';
    $tabActive = 'bg-on-surface-strong/5 text-on-surface-strong dark:bg-white/5 dark:text-on-surface-dark-strong';
@endphp

{{-- The top layout, for themes that choose it (lg and up): the rail's
     sections across a bar, and the current section's pages as tabs beneath.
     Clicking another section shows its tabs without leaving the page. --}}
<div class="hidden shrink-0 border-b border-outline topnav:block dark:border-outline-dark" data-testid="top-nav">
    <nav class="flex h-11 items-center gap-1 overflow-x-auto px-4 lg:px-6" aria-label="{{ __('atrium::atrium.primary_navigation') }}">
        @foreach ($sections as $section)
            @php
                $active = $atriumNav->sectionIsActive($section, request());
            @endphp

            @if ($section->grouped)
                <button type="button" data-testid="top-section" data-section="{{ $section->key }}"
                        x-on:click="section = @js($section->key)"
                        :aria-pressed="(section === @js($section->key)).toString()"
                        @class([$tab, $tabActive => $active, $tabIdle => ! $active])
                        :class="! @js($active) && section === @js($section->key) && @js($tabActive)">
            @else
                <a href="{{ $atriumNav->sectionUrl($section, request()) ?? '#' }}" data-testid="top-section" data-section="{{ $section->key }}"
                   @if ($active) aria-current="page" @endif
                   @class([$tab, $tabActive => $active, $tabIdle => ! $active])>
            @endif
                @if ($section->icon)
                    <span class="opacity-80" aria-hidden="true">{!! $section->icon !!}</span>
                @endif
                <span>{{ $section->label }}</span>
            @if ($section->grouped)
                </button>
            @else
                </a>
            @endif
        @endforeach
    </nav>

    @foreach ($sections as $section)
        @continue(! $section->grouped)

        <nav x-show="section === @js($section->key)" @if ($section->key !== $currentSection) x-cloak @endif
             class="flex h-10 items-center gap-1 overflow-x-auto border-t border-outline px-4 lg:px-6 dark:border-outline-dark"
             aria-label="{{ $section->label }}" data-testid="top-tabs" data-section="{{ $section->key }}">
            @foreach ($section->items as $item)
                @php($itemActive = $atriumNav->isActive($item, request()) || $atriumNav->hasActiveChild($item, request()))
                <a href="{{ $atriumNav->url($item, request()) ?? '#' }}" @if ($itemActive) aria-current="page" @endif
                   @class(['inline-flex h-7 shrink-0 items-center rounded-radius px-2.5 text-sm transition-colors',
                       'bg-primary text-on-primary dark:bg-primary-dark dark:text-on-primary-dark' => $itemActive,
                       'text-on-surface hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong' => ! $itemActive])>
                    {{ $item->label }}
                </a>
            @endforeach
        </nav>
    @endforeach
</div>
