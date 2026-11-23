import { ref } from 'vue'
import type { Ref } from 'vue'
import type { components } from '../../client/schema'
import { AtriumIntegrationError, type AtriumIntegrationClient } from '../../../../composables/useAtriumIntegration'
import { isInternalPath } from '../../../../utils/atriumLink'
import { atriumStatus } from '../../../../utils/atriumStatus'

/*
 * What every Guardian screen and component shares (AC 83 to 98): the payload
 * types, the data of an answer, and an action runner that keeps Guardian's
 * machine-readable `code` (`method_unavailable`, `two_factor_required`, …),
 * its field errors and the wait of a 429. Components take a client as a
 * prop, so the shell-less two-factor pages (their own client, D-050) and the
 * shell's screens (`useAtriumIntegration('guardian')`) share them.
 */

type Schemas = components['schemas']

export type GuardianClient = AtriumIntegrationClient<'guardian'>
export type GuardianTwoFactorStatus = Schemas['TwoFactorStatusResource']
export type GuardianTwoFactorMethod = Schemas['TwoFactorMethodResource']
export type GuardianPasskey = Schemas['PasskeyResource']

/** A method a user enrols, by type. */
export type GuardianMethodType = 'totp' | 'email' | 'sms' | 'passkey'

/** A one-time-code channel. */
export type GuardianOneTimeType = 'email' | 'sms'

/** A way to pass the challenge (`PassChallengeRequest.method`). */
export type GuardianChallengeMethod = 'totp' | 'recovery' | 'email' | 'sms' | 'passkey'

/** Every method type, in Guardian's order. */
export const GUARDIAN_METHOD_TYPES: readonly GuardianMethodType[] = ['totp', 'email', 'sms', 'passkey']

/** The two-factor pages (D-050), which load no shell. */
export const CHALLENGE_PATH = '/guardian/two-factor/challenge'
export const SETUP_PATH = '/guardian/two-factor/setup'

/** What a confirmed factor answers: the recovery codes, on the first one only. */
export interface GuardianConfirmedFactor {
  recovery_codes: string[] | null
}

/** One record under `data`. */
export interface GuardianOne<T> {
  data: T
}

/** A failed Guardian answer's body. */
export interface GuardianErrorBody {
  message?: string
  code?: string
  errors?: Record<string, string[]>
  retry_after?: number
}

/**
 * The data of an `openapi-fetch` answer as `T`, or an `AtriumIntegrationError`
 * carrying its status and body.
 */
export function guardianData<T>(result: { data?: unknown, error?: unknown, response: Response }): T {
  if (!result.response.ok) {
    throw new AtriumIntegrationError(result.response.status, result.error)
  }

  return result.data as T
}

/** The body of a failed call, when Guardian sent one. */
export function guardianError(error: unknown): GuardianErrorBody {
  const body = error instanceof AtriumIntegrationError ? error.body : null

  return typeof body === 'object' && body !== null ? body as GuardianErrorBody : {}
}

/** A request body the vendored schema types wrongly or not at all, sent as Guardian validates it. */
export function untypedBody<T>(body: T): never {
  return body as never
}

/**
 * Where to go after the two-factor pages: `redirect` when it is a path inside
 * the SPA (the AC 14 link guard) and not one of the two-factor pages
 * themselves, otherwise `/`.
 */
export function guardedRedirect(redirect: unknown): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect

  if (typeof value !== 'string' || !isInternalPath(value)) {
    return '/'
  }

  const path = value.split(/[?#]/)[0]!

  return path === CHALLENGE_PATH || path === SETUP_PATH ? '/' : value
}

/** A timestamp as the user's locale shows it, or null. */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

/** The method types a user may enrol: the policy's when two-factor is required. */
export function offeredMethods(status: Pick<GuardianTwoFactorStatus, 'required' | 'allowed_methods'> | null): GuardianMethodType[] {
  if (status?.required) {
    return GUARDIAN_METHOD_TYPES.filter(type => status.allowed_methods.includes(type))
  }

  return [...GUARDIAN_METHOD_TYPES]
}

/** The confirmed methods of a status. */
export function confirmedMethods(status: GuardianTwoFactorStatus | null): GuardianTwoFactorMethod[] {
  return (status?.methods ?? []).filter(method => method.confirmed_at !== null)
}

export interface GuardianAction {
  busy: Ref<boolean>
  /** The HTTP status of the last failure */
  status: Ref<number | null>
  /** Guardian's machine-readable `code` of the last failure */
  code: Ref<string | null>
  /** The field errors of the last 422, by field */
  errors: Ref<Record<string, string[]>>
  /** The last action answered 403 */
  forbidden: Ref<boolean>
  /** The seconds a 429 asks to wait, when it says */
  retryAfter: Ref<number | null>
  /** Why the last action failed, when not by field or by 403 */
  message: Ref<string | null>
  /** Runs `action`; resolves whether it succeeded */
  run: (action: () => Promise<unknown>) => Promise<boolean>
  /** The first error of `field` */
  error: (field: string) => string | undefined
  reset: () => void
}

/**
 * Runs a mutation against Guardian. A 422 fills `errors` (by field) or, with
 * a `code` and no field errors, `message`; a 403 sets `forbidden`; a 429 sets
 * `retryAfter`; `status` and `code` always say what failed. Never logs the
 * request, which may carry a code.
 */
export function useGuardianAction(): GuardianAction {
  const busy = ref(false)
  const status = ref<number | null>(null)
  const code = ref<string | null>(null)
  const errors = ref<Record<string, string[]>>({})
  const forbidden = ref(false)
  const retryAfter = ref<number | null>(null)
  const message = ref<string | null>(null)

  function reset(): void {
    status.value = null
    code.value = null
    errors.value = {}
    forbidden.value = false
    retryAfter.value = null
    message.value = null
  }

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    busy.value = true
    reset()

    try {
      await action()
      return true
    } catch (error) {
      const body = guardianError(error)

      status.value = atriumStatus(error)
      code.value = typeof body.code === 'string' ? body.code : null

      if (status.value === 403) {
        forbidden.value = true
      } else if (status.value === 422 && body.errors && Object.keys(body.errors).length > 0) {
        errors.value = body.errors
      } else {
        retryAfter.value = status.value === 429 && typeof body.retry_after === 'number' ? body.retry_after : null
        message.value = typeof body.message === 'string' ? body.message : error instanceof Error ? error.message : String(error)
      }

      return false
    } finally {
      busy.value = false
    }
  }

  function error(field: string): string | undefined {
    return errors.value[field]?.[0]
  }

  return { busy, status, code, errors, forbidden, retryAfter, message, run, error, reset }
}
