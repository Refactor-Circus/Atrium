import type { components } from '../../client/schema'

/*
 * What the current user's security page shares (AC 88): payload types, the
 * screen's static options (D-054) and the token expiry bound.
 */

type Schemas = components['schemas']

export type GuardianSession = Schemas['SessionResource']
export type GuardianDevice = Schemas['DeviceResource']
export type GuardianToken = Schemas['TokenResource']
export type GuardianSecurityEvent = Schemas['SecurityEventResource']

/** How many sessions, devices or events a block loads at once. */
export const SECURITY_PAGE_SIZE = 50

/** The `guardian.security` screen's options, as `GuardianIntegration` sends them. */
export interface GuardianSecurityOptions {
  tokenAbilities: string[]
  tokenMaxLifetimeDays: number | null
}

/** Guardian's defaults (`guardian.tokens.*`). */
export const DEFAULT_SECURITY_OPTIONS: GuardianSecurityOptions = { tokenAbilities: ['*'], tokenMaxLifetimeDays: 365 }

/** Reads the screen's `options`, falling back to Guardian's defaults for anything missing. */
export function securityOptions(options: Record<string, unknown> | null | undefined): GuardianSecurityOptions {
  const abilities = Array.isArray(options?.token_abilities)
    ? options.token_abilities.filter((ability): ability is string => typeof ability === 'string' && ability !== '')
    : []
  const days = options?.token_max_lifetime_days

  return {
    tokenAbilities: abilities.length > 0 ? abilities : DEFAULT_SECURITY_OPTIONS.tokenAbilities,
    tokenMaxLifetimeDays: days === null ? null : typeof days === 'number' && days > 0 ? days : DEFAULT_SECURITY_OPTIONS.tokenMaxLifetimeDays
  }
}

/** A day as `YYYY-MM-DD`, in the user's time zone. */
export function isoDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The last day a new token may expire on, or null for no limit. */
export function latestExpiry(maxDays: number | null, today = new Date()): string | null {
  if (maxDays === null) {
    return null
  }

  const last = new Date(today)
  last.setDate(last.getDate() + maxDays)

  return isoDay(last)
}

/** A picked expiry day as the end of that day, in ISO 8601. */
export function expiryOf(day: string): string {
  return new Date(`${day}T23:59:59`).toISOString()
}
