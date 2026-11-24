import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Guardian from '../../src/atrium'
import {
  DEADLINE_HEADER,
  DEADLINE_NOTICE_KEY,
  GUARDIAN_HANDLER_KEY,
  guardianTwoFactorHandler,
  resetGuardianHandler
} from '../../src/components/two-factor/handler'
import type { AtriumRegistry } from '@refactor-circus/atrium'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { AtriumResponseNotice, useAtrium, useAtriumI18n } from '@refactor-circus/atrium'
import { mountSuspended, runInAtrium, useRouter } from '@refactor-circus/atrium/testing'

/*
 * Guardian's response handler (AC 84, D-049): a 403 `two_factor_challenge_required`
 * goes to the challenge page and `two_factor_enrollment_required` to the
 * setup page, each with `redirect`; concurrent 403s navigate once; nothing
 * happens on those two pages; a `Guardian-Two-Factor-Deadline` header shows
 * a dismissible app-wide notice linking to `/guardian/security`; anything
 * else is left alone.
 */

function denied(code: string | null, headers: Record<string, string> = {}): Response {
  const body = code === null ? { message: 'This action is unauthorized.' } : { message: 'No.', code }

  return new Response(JSON.stringify(body), { status: 403, headers: { 'content-type': 'application/json', ...headers } })
}

const request = new Request('https://app.test/cortex/api/virtual-agents')

let atrium: AtriumRegistry

async function handle(response: Response): Promise<void> {
  const handler = guardianTwoFactorHandler(atrium)

  // Run as the clients do: inside the app's context (mounting would reset the route).
  await runInAtrium(() => handler(response, request))
  await settle()
}

describe('the guardian.two-factor response handler', () => {
  beforeEach(async () => {
    resetGuardianHandler()
    atrium = await withSetup(() => useAtrium())
    await useRouter().push('/cortex/virtual-agents?page=2')
  })

  afterEach(async () => {
    resetGuardianHandler()
    atrium.notices.clear()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('is registered by src/atrium.ts under its key', () => {
    expect(Object.keys(Guardian.responseHandlers ?? {})).toEqual([GUARDIAN_HANDLER_KEY])
    expect(atrium.responseHandlers.has(GUARDIAN_HANDLER_KEY)).toBe(true)
  })

  it('sends two_factor_challenge_required to the challenge page, with where the user was', async () => {
    await handle(denied('two_factor_challenge_required'))

    const route = useRouter().currentRoute.value
    expect(route.path).toBe('/guardian/two-factor/challenge')
    expect(route.query.redirect).toBe('/cortex/virtual-agents?page=2')
  })

  it('sends two_factor_enrollment_required to the setup page, with where the user was', async () => {
    await handle(denied('two_factor_enrollment_required'))

    const route = useRouter().currentRoute.value
    expect(route.path).toBe('/guardian/two-factor/setup')
    expect(route.query.redirect).toBe('/cortex/virtual-agents?page=2')
  })

  it('navigates once for concurrent 403s', async () => {
    const push = vi.spyOn(useRouter(), 'push')
    const handler = guardianTwoFactorHandler(atrium)

    await runInAtrium(() => Promise.all([
      handler(denied('two_factor_challenge_required'), request),
      handler(denied('two_factor_challenge_required'), request),
      handler(denied('two_factor_enrollment_required'), request)
    ]))
    await settle()

    expect(push).toHaveBeenCalledTimes(1)
  })

  it.each(['/guardian/two-factor/challenge', '/guardian/two-factor/setup'])('does nothing while %s is open', async (path) => {
    await useRouter().push(`${path}?redirect=/x`)
    const push = vi.spyOn(useRouter(), 'push')

    await handle(denied('two_factor_challenge_required'))
    await handle(denied('two_factor_enrollment_required'))

    expect(push).not.toHaveBeenCalled()
    expect(useRouter().currentRoute.value.fullPath).toBe(`${path}?redirect=/x`)
  })

  it.each([
    ['a 403 without a code', denied(null)],
    ['a 403 with another code', denied('password_expired')],
    ['a 403 that is not JSON', new Response('two_factor_challenge_required', { status: 403 })],
    ['a 422 with a Guardian code', new Response(JSON.stringify({ code: 'two_factor_challenge_required' }), { status: 422, headers: { 'content-type': 'application/json' } })],
    ['a 200', new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })]
  ])('leaves %s alone', async (_, response) => {
    const push = vi.spyOn(useRouter(), 'push')

    await handle(response)

    expect(push).not.toHaveBeenCalled()
    expect(atrium.notices.size).toBe(0)
  })

  it('shows the deadline header as a dismissible app-wide notice linking to /guardian/security', async () => {
    const deadline = '2026-12-01T10:00:00+00:00'

    await handle(new Response('{}', { status: 200, headers: { 'content-type': 'application/json', [DEADLINE_HEADER]: deadline } }))

    const notice = atrium.notices.get(DEADLINE_NOTICE_KEY)
    expect(notice).toMatchObject({ id: deadline, link: { to: '/guardian/security' } })
    expect(notice?.params?.deadline).toBe(new Date(deadline).toLocaleString())

    const wrapper = await mountSuspended(AtriumResponseNotice)
    const alert = wrapper.find(`[data-testid="atrium-response-notice-${DEADLINE_NOTICE_KEY}"]`)

    expect(alert.text()).toContain(new Date(deadline).toLocaleString())
    expect(alert.find('[data-testid="atrium-response-notice-link"]').attributes('href')).toBe('/guardian/security')

    await alert.find('[data-testid="atrium-response-notice-dismiss"]').trigger('click')
    expect(wrapper.find('[data-testid="atrium-response-notices"]').exists()).toBe(false)

    // The same deadline stays dismissed; a new one shows again.
    await handle(new Response('{}', { status: 200, headers: { [DEADLINE_HEADER]: deadline } }))
    expect(atrium.notices.size).toBe(0)

    await handle(new Response('{}', { status: 200, headers: { [DEADLINE_HEADER]: '2026-11-30T10:00:00+00:00' } }))
    expect(atrium.notices.size).toBe(1)
  })

  it('shows the deadline notice on a 403 too, and still navigates', async () => {
    await handle(denied('two_factor_enrollment_required', { [DEADLINE_HEADER]: '2026-12-24T10:00:00+00:00' }))

    expect(atrium.notices.has(DEADLINE_NOTICE_KEY)).toBe(true)
    expect(useRouter().currentRoute.value.path).toBe('/guardian/two-factor/setup')
  })
})
