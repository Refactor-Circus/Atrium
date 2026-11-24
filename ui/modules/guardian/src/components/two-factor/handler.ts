import { atriumRouter, type AtriumRegistry } from '@refactor-circus/atrium'
import type { AtriumResponseHandler } from '@refactor-circus/atrium'
import { CHALLENGE_PATH, formatDate, SETUP_PATH } from './guardian'

/*
 * Guardian's response handler (AC 84, D-049), registered by
 * `src/atrium.ts` whether or not the shell lists Guardian: the host may
 * put `guardian.two-factor` on Atrium's own route group, so the shell itself
 * can answer 403.
 *
 * - A 403 whose `code` is `two_factor_challenge_required` goes to the
 *   challenge page, and `two_factor_enrollment_required` to the setup page,
 *   each with `redirect` set to where the user was. Concurrent 403s navigate
 *   once, and nothing happens while one of those pages is open.
 * - A `Guardian-Two-Factor-Deadline` header shows an app-wide notice with the
 *   deadline, linking to `/guardian/security`.
 * - Anything else is left alone.
 */

export const GUARDIAN_HANDLER_KEY = 'guardian.two-factor'
export const DEADLINE_HEADER = 'Guardian-Two-Factor-Deadline'
export const DEADLINE_NOTICE_KEY = 'guardian.two-factor-deadline'

/** The page each of Guardian's two-factor 403 codes sends the user to. */
const TARGETS: Record<string, string> = {
  two_factor_challenge_required: CHALLENGE_PATH,
  two_factor_enrollment_required: SETUP_PATH
}

let navigating = false

/** Forget a navigation in flight (tests). */
export function resetGuardianHandler(): void {
  navigating = false
}

function onTwoFactorPage(path: string): boolean {
  return path === CHALLENGE_PATH || path === SETUP_PATH
}

async function codeOf(response: Response): Promise<string | null> {
  if (!(response.headers.get('content-type') ?? '').includes('json')) {
    return null
  }

  try {
    const body = await response.json() as { code?: unknown }

    return typeof body?.code === 'string' ? body.code : null
  } catch {
    return null
  }
}

/** The handler, bound to the app's registry for its notice. */
export function guardianTwoFactorHandler(atrium: AtriumRegistry): AtriumResponseHandler {
  return async (response) => {
    // The app's router: a handler runs outside any component.
    const router = atriumRouter()
    const deadline = response.headers.get(DEADLINE_HEADER)

    if (deadline) {
      atrium.notify(DEADLINE_NOTICE_KEY, {
        id: deadline,
        message: 'guardian.two_factor.deadline.notice',
        params: { deadline: formatDate(deadline) ?? deadline },
        link: { to: '/guardian/security', label: 'guardian.two_factor.deadline.link' },
        color: 'warning'
      })
    }

    if (response.status !== 403 || navigating || onTwoFactorPage(router.currentRoute.value.path)) {
      return
    }

    const target = TARGETS[await codeOf(response) ?? ''] ?? null

    if (target === null || navigating || onTwoFactorPage(router.currentRoute.value.path)) {
      return
    }

    navigating = true

    try {
      await router.push({ path: target, query: { redirect: router.currentRoute.value.fullPath } })
    } finally {
      navigating = false
    }
  }
}
