@php($atriumThemes = app(\RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry::class))

{{-- Beside the light/dark toggle: pick the dashboard's theme. Shown when
     there is more than one theme and `atrium.themes.switcher_feature` is on. --}}
@if ($atriumSwitchable ?? $atriumThemes->switchable(request()))
    <div x-data="atriumPalette(@js(array_keys($atriumThemes->all())), @js($atriumThemes->default()?->key), @js($atriumThemes->layouts()))">
        <x-atrium::dropdown align="right">
            <x-slot:trigger>
                <button type="button" data-testid="theme-switcher"
                        class="grid size-9 cursor-pointer place-items-center rounded-radius text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong"
                        aria-label="{{ __('atrium::atrium.themes') }}" title="{{ __('atrium::atrium.themes') }}">
                    <x-atrium::icon name="swatch" class="size-[18px]" />
                </button>
            </x-slot:trigger>

            <div class="min-w-40" role="menu" aria-label="{{ __('atrium::atrium.themes') }}">
                @foreach ($atriumThemes->all() as $atriumTheme)
                    <button type="button" role="menuitemradio" data-testid="palette-{{ $atriumTheme->key }}"
                            class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong"
                            :class="palette === @js($atriumTheme->key) && 'text-on-surface-strong! dark:text-on-surface-dark-strong! font-medium'"
                            :aria-checked="(palette === @js($atriumTheme->key)).toString()"
                            x-on:click="choose(@js($atriumTheme->key)); open = false">
                        <span class="size-4 shrink-0 rounded-full ring-1 ring-inset ring-on-surface-strong/10 dark:ring-white/10" style="background: {{ $atriumTheme->swatchColor() }}" aria-hidden="true"></span>
                        <span class="flex-1 text-left">{{ $atriumTheme->label }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-primary dark:text-primary-dark" x-show="palette === @js($atriumTheme->key)" aria-hidden="true">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                        </svg>
                    </button>
                @endforeach
            </div>
        </x-atrium::dropdown>
    </div>
@endif
