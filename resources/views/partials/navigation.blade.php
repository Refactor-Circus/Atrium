@php
    $sections ??= \RefactorCircus\Atrium\Facades\Atrium::navigationSections(request());
    $currentSection ??= null;
    $atriumNav ??= app(\RefactorCircus\Atrium\Domains\Navigation\Services\NavigationState::class);

    $railButton = 'relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-radius transition-colors [&_svg]:size-5';
    $railIdle = 'text-on-surface hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong';
    $railActive = 'bg-surface text-primary shadow-xs ring-1 ring-outline dark:bg-surface-dark dark:text-primary-dark dark:ring-outline-dark';
@endphp

<div class="flex h-full">
    {{-- The rail: the app's own pages, then one icon per section. Hovering a
         section previews its pages; clicking it docks them in the panel. --}}
    <div class="flex w-16 shrink-0 flex-col items-center" data-testid="nav-rail">
        <div class="flex h-14 shrink-0 items-center">
            <a href="{{ route('atrium.dashboard') }}" class="grid size-8 place-items-center rounded-radius bg-primary text-sm font-semibold text-on-primary shadow-xs dark:bg-primary-dark dark:text-on-primary-dark"
               aria-label="{{ config('app.name') }}" title="{{ config('app.name') }}">
                {{ mb_strtoupper(mb_substr((string) config('app.name'), 0, 1)) }}
            </a>
        </div>

        <nav class="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto py-2" aria-label="{{ __('atrium::atrium.primary_navigation') }}"
             x-on:scroll="flyout = null">
            @foreach ($sections as $section)
                @php
                    $active = $atriumNav->sectionIsActive($section, request());
                    $flyout = [
                        'label' => $section->label,
                        'badge' => null,
                        'children' => $section->grouped ? array_map(fn ($item) => [
                            'label' => $item->label,
                            'url' => $atriumNav->url($item, request()) ?? '#',
                            'active' => $atriumNav->isActive($item, request()),
                        ], $section->items) : [],
                    ];
                    $glyph = $section->icon ?? null;
                @endphp

                @if ($section->grouped)
                    <button type="button" data-testid="nav-section" data-section="{{ $section->key }}"
                            aria-label="{{ $section->label }}" data-flyout="{{ json_encode($flyout) }}"
                            x-on:click="selectSection(@js($section->key))"
                            x-on:mouseenter="previewSection($el, @js($section->key))" x-on:mouseleave="unpeek()"
                            x-on:focus="previewSection($el, @js($section->key))" x-on:blur="unpeek()"
                            :aria-pressed="(section === @js($section->key) && ! collapsed).toString()"
                            @class([$railButton, $railActive => $active, $railIdle => ! $active])
                            :class="! @js($active) && section === @js($section->key) && ! collapsed && 'bg-on-surface-strong/5 text-on-surface-strong dark:bg-white/5 dark:text-on-surface-dark-strong'">
                @else
                    <a href="{{ $atriumNav->sectionUrl($section, request()) ?? '#' }}" data-testid="nav-section" data-section="{{ $section->key }}"
                       aria-label="{{ $section->label }}" data-flyout="{{ json_encode($flyout) }}"
                       x-on:mouseenter="previewSection($el, null)" x-on:mouseleave="unpeek()"
                       x-on:focus="previewSection($el, null)" x-on:blur="unpeek()"
                       @if ($active) aria-current="page" @endif
                       @class([$railButton, $railActive => $active, $railIdle => ! $active])>
                @endif
                    @if ($glyph)
                        <span aria-hidden="true">{!! $glyph !!}</span>
                    @else
                        <span class="text-sm font-semibold" aria-hidden="true">{{ mb_strtoupper(mb_substr($section->label, 0, 1)) }}</span>
                    @endif
                @if ($section->grouped)
                    </button>
                @else
                    </a>
                @endif
            @endforeach
        </nav>

        <div class="hidden shrink-0 py-3 lg:block">
            <button type="button" data-testid="sidebar-toggle"
                    class="{{ $railButton }} {{ $railIdle }}"
                    x-on:click="toggleCollapsed()"
                    :aria-label="collapsed ? @js(__('atrium::atrium.expand_sidebar')) : @js(__('atrium::atrium.collapse_sidebar'))"
                    :aria-expanded="(! collapsed).toString()"
                    title="{{ __('atrium::atrium.collapse_sidebar') }}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="transition-transform rail:rotate-180" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2.5" />
                    <path stroke-linecap="round" d="M9 4v16M15.5 10 13.5 12l2 2" />
                </svg>
            </button>
        </div>
    </div>

    {{-- The docked panel: the pages of the section in view. Collapsing the
         sidebar hides it, leaving the rail. --}}
    <div class="flex w-56 shrink-0 flex-col rail:hidden" data-testid="nav-panel"
         x-show="section !== null && ! isRail()" @if ($currentSection === null) x-cloak @endif>
        <div class="flex h-14 shrink-0 items-center overflow-hidden px-3">
            @if (! empty($brand))
                {{ $brand }}
            @else
                <a href="{{ route('atrium.dashboard') }}" class="truncate text-sm font-semibold text-on-surface-strong dark:text-on-surface-dark-strong">{{ config('app.name') }}</a>
            @endif
        </div>

        <nav class="flex-1 overflow-y-auto px-3 pb-2" aria-label="{{ __('atrium::atrium.section_navigation') }}">
            @foreach ($sections as $section)
                @continue(! $section->grouped)

                <div x-show="section === @js($section->key)" @if ($section->key !== $currentSection) x-cloak @endif
                     data-testid="nav-panel-section" data-section="{{ $section->key }}">
                    <p class="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface/70 dark:text-on-surface-dark/70">{{ $section->label }}</p>

                    <ul class="flex flex-col gap-0.5">
                        @foreach ($section->items as $item)
                            @include('atrium::partials.nav-item', ['item' => $item, 'depth' => 0])
                        @endforeach
                    </ul>
                </div>
            @endforeach
        </nav>

        @if (! empty($sidebarFooter))
            <div class="shrink-0 border-t border-outline px-4 py-3 dark:border-outline-dark">{{ $sidebarFooter }}</div>
        @endif
    </div>
</div>
