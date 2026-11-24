{{--
    Atrium's page (D-079): the prebuilt front end, booted from the JSON
    below. The import map gives every module the page's one copy of each
    shared specifier (D-082); each module's script runs before Atrium's own,
    which installs the modules and then mounts.
--}}
@php($nonce = \Illuminate\Support\Facades\Vite::cspNonce())
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', $boot['locale']) }}" data-atrium-theme="{{ $theme }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ $boot['csrf_token'] }}">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $title }}</title>
    <script @if($nonce) nonce="{{ $nonce }}" @endif>
        (function () {
            try {
                var mode = localStorage.getItem('vueuse-color-scheme') || 'auto';
                if (mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                }
            } catch (e) {}
            window.Atrium = window.Atrium || { queue: [], register: function (module) { this.queue.push(module); } };
        })();
    </script>
    <script type="importmap" @if($nonce) nonce="{{ $nonce }}" @endif>@json(['imports' => $imports], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG)</script>
    @foreach ($styles as $href)
    <link rel="stylesheet" href="{{ $href }}">
    @endforeach
    <link rel="modulepreload" href="{{ $entry }}">
    <script type="application/json" id="atrium-boot">@json($boot, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP)</script>
</head>
<body>
    <div id="atrium"></div>
    @foreach ($scripts as $src)
    <script type="module" src="{{ $src }}" @if($nonce) nonce="{{ $nonce }}" @endif></script>
    @endforeach
    <script type="module" src="{{ $entry }}" @if($nonce) nonce="{{ $nonce }}" @endif></script>
</body>
</html>
