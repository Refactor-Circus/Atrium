{{--
    A panel that slides in from the right over the page, for viewing one
    record without leaving the list behind it.

    Server-rendered: pass `open` when the request already names the record
    (a `?record=` link), and the panel renders open and slides in on load.
    `close-url` is where closing goes back to (the list without the record),
    as an absolute URL; without it, closing only hides the panel.

    Client-side: a `slide-over-link` (or an `atrium-slide-over-load` event,
    `{ name, url }`) fetches `url`, takes this panel's content from the page
    it returns, swaps it in and slides the panel open, updating the address
    so the record stays linkable. `atrium-slide-over-open` / `-close` with the
    name open and close it as the modal's events do.

    <x-atrium::slide-over name="orders" title="SO-1" :open="$selected !== null" :close-url="$listUrl">
        ...the record...
    </x-atrium::slide-over>
--}}
@props([
    'name',
    'title' => null,
    'open' => false,
    'closeUrl' => null,
    'size' => 'lg',
])

@php
    $sizes = [
        'md' => 'max-w-lg',
        'lg' => 'max-w-2xl',
        'xl' => 'max-w-4xl',
    ];
@endphp

<div
    x-data="{
        open: false,
        loading: false,
        failed: false,
        title: @js($title),
        closeUrl: @js($closeUrl),
        init() {
            if (@js((bool) $open)) {
                this.$nextTick(() => this.open = true);
            }
        },
        async load(url) {
            this.open = true;
            this.loading = true;
            this.failed = false;

            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });

                if (! response.ok) {
                    throw new Error(response.statusText);
                }

                const page = new DOMParser().parseFromString(await response.text(), 'text/html');
                const content = page.querySelector('[data-slide-over-content=' + JSON.stringify(@js($name)) + ']');

                if (! content) {
                    throw new Error('No slide-over content on the page.');
                }

                this.$refs.content.innerHTML = content.innerHTML;
                this.title = content.dataset.slideOverTitle || this.title;
                window.history.pushState({ atriumSlideOver: @js($name) }, '', url);
            } catch (error) {
                this.failed = true;
            } finally {
                this.loading = false;
            }
        },
        close() {
            this.open = false;

            if (this.closeUrl && window.location.href !== this.closeUrl) {
                window.history.pushState({}, '', this.closeUrl);
            }
        },
    }"
    x-on:atrium-slide-over-load.window="if ($event.detail.name === @js($name)) load($event.detail.url)"
    x-on:atrium-slide-over-open.window="if ($event.detail === @js($name)) open = true"
    x-on:atrium-slide-over-close.window="if ($event.detail === @js($name)) close()"
    x-on:keydown.escape.window="if (open) close()"
    x-on:popstate.window="if (open && closeUrl && window.location.href === closeUrl) open = false"
    data-slide-over="{{ $name }}"
>
    <div class="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm" x-show="open" x-cloak x-transition.opacity x-on:click="close()"></div>

    <aside
        {{ $attributes->class('fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-outline bg-surface text-on-surface shadow-2xl dark:border-outline-dark dark:bg-surface-dark dark:text-on-surface-dark '.($sizes[$size] ?? $sizes['lg'])) }}
        x-show="open"
        x-cloak
        x-transition:enter="transform transition duration-200 ease-out"
        x-transition:enter-start="translate-x-full"
        x-transition:enter-end="translate-x-0"
        x-transition:leave="transform transition duration-150 ease-in"
        x-transition:leave-start="translate-x-0"
        x-transition:leave-end="translate-x-full"
        role="dialog"
        aria-modal="true"
        x-bind:aria-busy="loading"
    >
        <div class="flex items-center justify-between gap-3 border-b border-outline px-5 py-3 dark:border-outline-dark">
            <h2 class="truncate text-base font-semibold text-on-surface-strong dark:text-on-surface-dark-strong" x-text="title">{{ $title }}</h2>

            <button type="button" class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong" x-on:click="close()" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="relative flex-1 overflow-y-auto">
            <div class="absolute inset-0 grid place-items-center bg-surface/60 dark:bg-surface-dark/60" x-show="loading" x-cloak>
                <x-atrium::spinner />
            </div>

            <div class="p-5" x-show="failed" x-cloak>
                <x-atrium::alert variant="danger">{{ __('This record could not be loaded.') }}</x-atrium::alert>
            </div>

            <div class="p-5" x-ref="content" x-show="! failed" data-slide-over-content="{{ $name }}" data-slide-over-title="{{ $title }}">{{ $slot }}</div>
        </div>
    </aside>
</div>
