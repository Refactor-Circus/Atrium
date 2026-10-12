@php
    $depth ??= 0;
    $atriumNav ??= app(\RefactorCircus\Atrium\Domains\Navigation\Services\NavigationState::class);
    $badge = $item->resolveBadge();
    $active = $atriumNav->isActive($item, request());
    $url = $atriumNav->url($item, request());
    $hasChildren = $item->children !== [];
    $childActive = $atriumNav->hasActiveChild($item, request());

    // What the rail shows beside this item on hover: its label, and a menu of
    // its children, since the rail itself has no room for either.
    $flyout = [
        'label' => $item->label,
        'badge' => $badge,
        'children' => array_map(fn ($child) => [
            'label' => $child->label,
            'url' => $atriumNav->url($child, request()) ?? '#',
            'active' => $atriumNav->isActive($child, request()),
        ], $item->children),
    ];

    $tag = $url === null && $hasChildren ? 'button' : 'a';
@endphp

<li @if ($hasChildren) x-data="{ open: @js($active || $childActive) }" @endif>
    @if ($depth === 0)
        <div class="relative">
            <{{ $tag }}
                data-testid="nav-item"
                @if ($tag === 'a') href="{{ $url ?? '#' }}" @else type="button" x-on:click="open = ! open" :aria-expanded="open.toString()" @endif
                data-flyout="{{ json_encode($flyout) }}"
                x-on:mouseenter="peek($el)" x-on:mouseleave="unpeek()"
                x-on:focus="peek($el)" x-on:blur="unpeek()"
                @class([
                    'group/item relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-radius px-2.5 text-left text-sm font-medium transition-colors rail:justify-center rail:px-0',
                    'pr-9' => $hasChildren && $tag === 'a',
                    'bg-surface text-on-surface-strong shadow-xs ring-1 ring-outline dark:bg-surface-dark dark:text-on-surface-dark-strong dark:ring-outline-dark' => $active,
                    'text-on-surface-strong dark:text-on-surface-dark-strong' => ! $active && $childActive,
                    'text-on-surface dark:text-on-surface-dark' => ! $active && ! $childActive,
                    'hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong' => ! $active,
                ])
                @if ($active) aria-current="page" @endif>
                @if ($item->icon)
                    <span @class([
                        'grid size-5 shrink-0 place-items-center [&_svg]:size-[18px]',
                        'text-primary dark:text-primary-dark' => $active,
                        'opacity-80 group-hover/item:opacity-100' => ! $active,
                    ]) aria-hidden="true">{!! $item->icon !!}</span>
                @else
                    {{-- Without an icon the rail still needs something to show. --}}
                    <span @class([
                        'hidden size-7 shrink-0 place-items-center rounded-md text-xs font-semibold rail:grid',
                        'bg-primary/10 text-primary dark:bg-primary-dark/15 dark:text-primary-dark' => $active,
                        'bg-on-surface-strong/5 dark:bg-white/5' => ! $active,
                    ]) aria-hidden="true">{{ mb_strtoupper(mb_substr($item->label, 0, 1)) }}</span>
                @endif

                <span class="flex-1 truncate rail:sr-only">{{ $item->label }}</span>

                @if ($badge !== null)
                    <span @class([
                        'rounded-md px-1.5 text-[11px] font-semibold leading-5 tabular-nums rail:hidden',
                        'bg-primary/10 text-primary dark:bg-primary-dark/15 dark:text-primary-dark' => $active,
                        'bg-on-surface-strong/5 text-on-surface dark:bg-white/10 dark:text-on-surface-dark' => ! $active,
                    ])>{{ $badge }}</span>

                    <span class="absolute right-2.5 top-1.5 hidden size-2 rounded-full bg-primary ring-2 ring-canvas rail:block dark:bg-primary-dark dark:ring-canvas-dark" aria-hidden="true"></span>
                @endif

                @if ($hasChildren && $tag === 'button')
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 shrink-0 opacity-60 transition-transform rail:hidden"
                         :class="open || '-rotate-90'" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                    </svg>
                @endif
            </{{ $tag }}>

            @if ($hasChildren && $tag === 'a')
                {{-- The row itself links somewhere, so folding gets its own button. --}}
                <button type="button"
                        class="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-on-surface/60 transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong rail:hidden dark:text-on-surface-dark/60 dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong"
                        x-on:click="open = ! open" :aria-expanded="open.toString()" aria-label="{{ $item->label }}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 transition-transform" :class="open || '-rotate-90'" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                    </svg>
                </button>
            @endif
        </div>
    @else
        <a data-testid="nav-item" href="{{ $url ?? '#' }}"
           @class([
               'relative flex h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors',
               'bg-on-surface-strong/5 font-medium text-on-surface-strong before:absolute before:-left-[13px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary dark:bg-white/5 dark:text-on-surface-dark-strong dark:before:bg-primary-dark' => $active,
               'text-on-surface hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong' => ! $active,
           ])
           @if ($active) aria-current="page" @endif>
            <span class="flex-1 truncate">{{ $item->label }}</span>

            @if ($badge !== null)
                <span class="rounded-md bg-on-surface-strong/5 px-1.5 text-[11px] font-semibold leading-5 tabular-nums dark:bg-white/10">{{ $badge }}</span>
            @endif
        </a>
    @endif

    @if ($hasChildren)
        <ul class="ml-[1.3rem] mt-0.5 flex flex-col gap-0.5 border-l border-outline pl-3 rail:hidden! dark:border-outline-dark"
            x-show="open" @unless ($active || $childActive) x-cloak @endunless>
            @foreach ($item->children as $child)
                @include('atrium::partials.nav-item', ['item' => $child, 'depth' => $depth + 1])
            @endforeach
        </ul>
    @endif
</li>
