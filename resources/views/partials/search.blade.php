<div class="relative w-full max-w-sm" x-data="atriumSearch()"
     x-on:keydown.window.meta.k.prevent="$refs.input.focus()"
     x-on:keydown.window.ctrl.k.prevent="$refs.input.focus()">
    <label class="sr-only" for="atrium-search-input">{{ __('atrium::atrium.search') }}</label>

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface/60 dark:text-on-surface-dark/60" aria-hidden="true">
        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
    </svg>

    <input id="atrium-search-input"
           x-ref="input"
           type="search"
           class="h-9 w-full rounded-radius border border-outline bg-surface-alt pl-8 pr-12 text-sm text-on-surface-strong transition placeholder:text-on-surface/60 hover:border-on-surface/30 focus:border-primary focus:bg-surface focus:outline-none focus:ring-3 focus:ring-primary/15 dark:border-outline-dark dark:bg-white/5 dark:text-on-surface-dark-strong dark:placeholder:text-on-surface-dark/60 dark:hover:border-white/20 dark:focus:border-primary-dark dark:focus:bg-surface-dark dark:focus:ring-primary-dark/20 [&::-webkit-search-cancel-button]:hidden"
           autocomplete="off"
           placeholder="{{ __('atrium::atrium.search_placeholder') }}"
           x-model="query"
           x-on:input.debounce.250ms="run()"
           x-on:focus="open = true"
           x-on:keydown.escape="close(); $el.blur()">

    <kbd class="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-outline bg-surface px-1.5 font-sans text-[11px] font-medium leading-5 text-on-surface/70 sm:block dark:border-outline-dark dark:bg-surface-dark dark:text-on-surface-dark/70"
         x-show="query.length === 0" aria-hidden="true"
         x-text="/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'">⌘K</kbd>

    <div class="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-radius border border-outline bg-surface p-1 shadow-xl dark:border-outline-dark dark:bg-surface-dark"
         x-show="open && query.trim().length >= minLength" x-cloak x-transition.opacity.duration.100ms x-on:click.outside="close()">
        <template x-if="results.length === 0 && ! loading">
            <p class="px-3 py-6 text-center text-sm text-on-surface dark:text-on-surface-dark">{{ __('atrium::atrium.no_results') }}</p>
        </template>

        <ul>
            <template x-for="result in results" :key="result.url + result.title">
                <li>
                    <a :href="result.url" class="block rounded-md px-2.5 py-2 transition-colors hover:bg-on-surface-strong/5 focus:bg-on-surface-strong/5 focus:outline-none dark:hover:bg-white/5 dark:focus:bg-white/5">
                        <span class="block text-sm font-medium text-on-surface-strong dark:text-on-surface-dark-strong" x-text="result.title"></span>
                        <template x-if="result.subtitle">
                            <span class="block text-xs text-on-surface dark:text-on-surface-dark" x-text="result.subtitle"></span>
                        </template>
                    </a>
                </li>
            </template>
        </ul>
    </div>
</div>

@once
    @push('atrium-scripts')
        <script>
            window.atriumSearch = function () {
                return {
                    query: '',
                    results: [],
                    loading: false,
                    open: false,
                    minLength: @js(\RefactorCircus\Atrium\Domains\Search\Http\Controllers\SearchController::minLength()),
                    controller: null,
                    sequence: 0,
                    close() { this.open = false },
                    async run() {
                        // A newer keystroke supersedes whatever is in flight.
                        this.controller?.abort()
                        this.controller = null
                        const ticket = ++this.sequence
                        const query = this.query.trim()

                        if (query.length < this.minLength) {
                            this.results = []
                            this.loading = false
                            return
                        }

                        const controller = new AbortController()
                        this.controller = controller
                        this.loading = true

                        try {
                            const response = await fetch(
                                @js(route('atrium.search')) + '?q=' + encodeURIComponent(query),
                                { headers: { 'Accept': 'application/json' }, signal: controller.signal }
                            )
                            const payload = await response.json()

                            // Only the latest search may show its results.
                            if (ticket !== this.sequence) { return }

                            this.results = payload.data ?? []
                            this.open = true
                        } catch (error) {
                            if (error.name !== 'AbortError') { throw error }
                        } finally {
                            if (ticket === this.sequence) {
                                this.loading = false
                                this.controller = null
                            }
                        }
                    },
                }
            }
        </script>
    @endpush
@endonce
