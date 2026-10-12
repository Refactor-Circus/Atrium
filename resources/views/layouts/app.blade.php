{{-- The Atrium shell. Every region is a slot, and this file is publishable,
     so applications can replace any part of the chrome without forking. --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ?? config('app.name') }}</title>

    {{-- Asked once; the head script and the switcher both need it. --}}
    @php($atriumSwitchable = app(\RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry::class)->switchable(request()))
    @include('atrium::partials.theme')

    <link rel="stylesheet" href="{{ asset('vendor/atrium/atrium.css') }}">

    {{-- Styles packages added with Atrium::stylesheet() and Atrium::css(). --}}
    @php($atriumStyles = app(\RefactorCircus\Atrium\Support\StyleRegistry::class))
    @foreach ($atriumStyles->stylesheets() as $href)
        <link rel="stylesheet" href="{{ $href }}">
    @endforeach
    @if ($atriumStyles->inline() !== [])
        <style>{!! implode("\n", $atriumStyles->inline()) !!}</style>
    @endif

    @stack('atrium-head')
</head>
<body class="bg-canvas text-on-surface antialiased dark:bg-canvas-dark dark:text-on-surface-dark">
@php($atriumNav = app(\RefactorCircus\Atrium\Domains\Navigation\Services\NavigationState::class))
@php($atriumSections = \RefactorCircus\Atrium\Facades\Atrium::navigationSections(request()))
@php($atriumCurrentSection = collect($atriumSections)->first(fn ($section) => $section->grouped && $atriumNav->sectionIsActive($section, request()))?->key)
<div class="flex h-dvh" x-data="atriumShell(@js($atriumCurrentSection))" x-on:keydown.escape.window="drawer = false" x-on:atrium-theme-changed.window="flyout = null">
    <a class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-radius focus:bg-surface focus:px-3 focus:py-2 dark:focus:bg-surface-dark" href="#atrium-main">
        {{ __('atrium::atrium.skip_to_content') }}
    </a>

    {{-- Drawer backdrop, below lg only --}}
    <div class="fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
         x-show="drawer" x-cloak x-transition.opacity x-on:click="drawer = false"></div>

    {{-- Sidebar: a rail of sections and, docked beside it, the current
         section's pages. Below lg both sit in an off-canvas drawer. --}}
    <aside
        data-testid="sidebar"
        class="fixed inset-y-0 left-0 z-40 flex shrink-0 bg-canvas transition-transform duration-200 ease-out max-lg:-translate-x-full max-lg:data-open:translate-x-0 max-lg:data-open:shadow-2xl lg:static topnav:hidden dark:bg-canvas-dark"
        :data-open="drawer"
    >
        @include('atrium::partials.navigation', ['sections' => $atriumSections, 'currentSection' => $atriumCurrentSection])
    </aside>

    {{-- Rail flyout: an item's label, and its children, beside the icon rail --}}
    <template x-if="flyout">
        <div class="fixed z-50 hidden lg:block" :style="`top: ${flyout.top}px; left: ${flyout.left}px`"
             x-on:mouseenter="holdFlyout()" x-on:mouseleave="unpeek()" data-testid="nav-flyout">
            <div class="min-w-44 rounded-radius border border-outline bg-surface p-1 shadow-lg dark:border-outline-dark dark:bg-surface-dark">
                <div class="flex items-center justify-between gap-4 px-2 py-1.5 text-sm font-medium text-on-surface-strong dark:text-on-surface-dark-strong">
                    <span x-text="flyout.label"></span>
                    <span class="rounded-md bg-on-surface-strong/5 px-1.5 text-xs leading-5 tabular-nums text-on-surface dark:bg-white/10 dark:text-on-surface-dark"
                          x-show="flyout.badge !== null && flyout.badge !== undefined" x-text="flyout.badge"></span>
                </div>

                <template x-if="flyout.children && flyout.children.length > 0">
                    <ul class="mt-1 flex flex-col gap-0.5 border-t border-outline pt-1 dark:border-outline-dark">
                        <template x-for="child in flyout.children" :key="child.url + child.label">
                            <li>
                                <a :href="child.url" x-text="child.label"
                                   class="block rounded-md px-2 py-1.5 text-sm text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong"
                                   :class="child.active && 'font-medium text-primary! dark:text-primary-dark!'"></a>
                            </li>
                        </template>
                    </ul>
                </template>
            </div>
        </div>
    </template>

    <div class="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2 topnav:pl-2">
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface lg:rounded-xl lg:border lg:border-outline lg:shadow-xs dark:bg-surface-dark dark:border-outline-dark">
            {{-- Topbar --}}
            <header class="flex h-14 shrink-0 items-center gap-3 border-b border-outline px-4 lg:px-6 dark:border-outline-dark">
                <button type="button" class="-ml-1 grid size-9 cursor-pointer place-items-center rounded-radius text-on-surface transition-colors hover:bg-on-surface-strong/5 lg:hidden dark:text-on-surface-dark dark:hover:bg-white/5"
                        x-on:click="drawer = ! drawer" aria-label="{{ __('atrium::atrium.toggle_navigation') }}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="size-5" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {{-- The top layout has no rail, so the brand leads the topbar. --}}
                <a href="{{ route('atrium.dashboard') }}" class="hidden shrink-0 items-center gap-2.5 font-semibold text-on-surface-strong topnav:flex dark:text-on-surface-dark-strong" data-testid="topbar-brand">
                    <span class="grid size-7 place-items-center rounded-radius bg-primary text-sm text-on-primary shadow-xs dark:bg-primary-dark dark:text-on-primary-dark" aria-hidden="true">{{ mb_strtoupper(mb_substr((string) config('app.name'), 0, 1)) }}</span>
                    <span class="text-sm">{{ config('app.name') }}</span>
                </a>

                @if (! empty($topbar))
                    {{ $topbar }}
                @else
                    @include('atrium::partials.search')
                @endif

                <div class="ml-auto flex items-center gap-1.5">
                    @include('atrium::partials.theme-switcher')
                    @include('atrium::partials.appearance')

                    @if (! empty($topbarEnd))
                        {{ $topbarEnd }}
                    @endif
                </div>
            </header>

            @include('atrium::partials.top-navigation', ['sections' => $atriumSections, 'currentSection' => $atriumCurrentSection])

            <div class="min-h-0 flex-1 overflow-y-auto">
                @if (! empty($breadcrumbs))
                    <nav class="px-4 pt-4 text-sm sm:px-6 lg:px-8 lg:pt-6" aria-label="{{ __('atrium::atrium.breadcrumbs') }}">
                        {{ $breadcrumbs }}
                    </nav>
                @endif

                <main id="atrium-main" class="p-4 sm:p-6 lg:p-8">
                    @if (! empty($header))
                        <div class="mb-6">{{ $header }}</div>
                    @endif

                    {{ $slot }}
                </main>

                @if (! empty($footer))
                    <footer class="border-t border-outline px-4 py-3 text-sm sm:px-6 lg:px-8 dark:border-outline-dark">{{ $footer }}</footer>
                @endif
            </div>
        </div>
    </div>
</div>

{{-- Atrium's own behavior is registered before Alpine boots, so the
     component functions exist by the time Alpine initialises them. --}}
<script src="{{ asset('vendor/atrium/atrium.js') }}"></script>
@stack('atrium-scripts')

@if (config('atrium.alpine', true))
    <script src="{{ asset('vendor/atrium/alpine.js') }}" defer></script>
@endif
</body>
</html>
