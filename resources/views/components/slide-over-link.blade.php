{{--
    A link that opens its `href` in the named slide-over without leaving the
    page. A plain link still works: without JavaScript, or opened in a new tab,
    it loads the page with the panel open.

    <x-atrium::slide-over-link name="orders" :href="$url">SO-1</x-atrium::slide-over-link>
--}}
@props(['name', 'href'])

<a
    href="{{ $href }}"
    {{ $attributes->class('font-medium text-primary hover:underline dark:text-primary-dark') }}
    x-data
    x-on:click="if (! ($event.metaKey || $event.ctrlKey || $event.shiftKey || $event.button === 1)) { $event.preventDefault(); $dispatch('atrium-slide-over-load', { name: @js($name), url: $el.href }); }"
>{{ $slot }}</a>
