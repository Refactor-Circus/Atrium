@php
    $atriumThemes = app(\RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry::class);
    $atriumDefaultTheme = $atriumThemes->default()?->key;
    // Without the switcher only the default theme is ever applied, whatever
    // a browser remembers from when it was on.
    $atriumSwitchable ??= $atriumThemes->switchable(request());
    $atriumThemeKeys = $atriumSwitchable ? array_keys($atriumThemes->all()) : array_filter([$atriumDefaultTheme]);
@endphp

{{-- Runs before the stylesheet paints, so a stored dark preference, theme,
     its layout, or a collapsed sidebar never flashes the wrong state on load.
     atrium.js owns changing them afterwards. --}}
<script>
    (function () {
        var root = document.documentElement;
        var mode = null;
        var palette = null;
        var sidebar = null;
        var themes = @js(array_values($atriumThemeKeys));
        var layouts = @js(array_intersect_key($atriumThemes->layouts(), array_flip($atriumThemeKeys)));

        try {
            mode = localStorage.getItem('atrium.theme');
            palette = localStorage.getItem('atrium.palette');
            sidebar = localStorage.getItem('atrium.sidebar');
        } catch (error) {}

        var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.classList.toggle('dark', dark);
        root.dataset.atriumTheme = themes.indexOf(palette) !== -1 ? palette : @js($atriumDefaultTheme);
        root.dataset.atriumLayout = layouts[root.dataset.atriumTheme] || 'sidebar';

        if (sidebar === 'collapsed') {
            root.dataset.atriumSidebar = 'collapsed';
        }
    })();
</script>

{{-- Each theme sets the design tokens the stylesheet was compiled with, so
     switching needs no rebuilt CSS. A theme setting nothing keeps the
     compiled defaults. --}}
<style data-atrium-themes>
@foreach ($atriumThemeKeys as $atriumKey)
@php($atriumProperties = $atriumThemes->find($atriumKey)?->properties() ?? [])
@if ($atriumProperties !== [])
    :root[data-atrium-theme="{{ $atriumKey }}"] {
@foreach ($atriumProperties as $atriumProperty => $atriumValue)
        {{ $atriumProperty }}: {{ $atriumValue }};
@endforeach
    }
@endif
@endforeach
</style>
