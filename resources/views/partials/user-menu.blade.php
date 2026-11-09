{{--
    The signed-in user and a way out: who they are, and Sign out, which posts
    to the app's logout route (`atrium.logout_route`). Hidden for guests, and
    when that route is off (null) or not defined.
--}}
@php
    $atriumUser = auth()->user();
    $atriumLogout = config('atrium.logout_route', 'logout');
    $atriumLogout = is_string($atriumLogout) && $atriumLogout !== '' && \Illuminate\Support\Facades\Route::has($atriumLogout) ? route($atriumLogout) : null;
    $atriumUserName = $atriumUser ? (string) ($atriumUser->name ?? $atriumUser->email ?? '') : '';
    $atriumUserEmail = $atriumUser ? (string) ($atriumUser->email ?? '') : '';
    $atriumInitials = mb_strtoupper(collect(preg_split('/\s+/', trim($atriumUserName)) ?: [])->filter()->take(2)->map(fn (string $word): string => mb_substr($word, 0, 1))->implode('')) ?: '?';
@endphp

@if ($atriumUser && $atriumLogout)
    <x-atrium::dropdown align="right" data-testid="user-menu">
        <x-slot:trigger>
            <button type="button" data-testid="user-menu-toggle"
                    class="grid size-9 cursor-pointer place-items-center rounded-radius text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong"
                    aria-label="{{ __('atrium::atrium.account') }}" title="{{ $atriumUserName }}">
                <x-atrium::avatar :initials="$atriumInitials" :alt="$atriumUserName" size="sm" />
            </button>
        </x-slot:trigger>

        <div class="min-w-36" role="menu" aria-label="{{ __('atrium::atrium.account') }}">
            <div class="px-2 py-1.5 text-sm">
                <div class="truncate font-medium text-on-surface-strong dark:text-on-surface-dark-strong">{{ $atriumUserName }}</div>
                @if ($atriumUserEmail !== '' && $atriumUserEmail !== $atriumUserName)
                    <div class="truncate text-xs">{{ $atriumUserEmail }}</div>
                @endif
            </div>

            <form method="POST" action="{{ $atriumLogout }}">
                @csrf
                <button type="submit" role="menuitem" data-testid="sign-out"
                        class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-on-surface transition-colors hover:bg-on-surface-strong/5 hover:text-on-surface-strong dark:text-on-surface-dark dark:hover:bg-white/5 dark:hover:text-on-surface-dark-strong">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="size-4 shrink-0" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    <span class="flex-1 text-left">{{ __('atrium::atrium.sign_out') }}</span>
                </button>
            </form>
        </div>
    </x-atrium::dropdown>
@endif
