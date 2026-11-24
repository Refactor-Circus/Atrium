import type { components } from '../../../client/schema'

/*
 * What Guardian's security administration screens share (AC 91 to 95):
 * payload types, the security event types the events filter offers, the IP
 * rule mode the `guardian.ip-rules` screen is sent, and the form helpers.
 */

type Schemas = components['schemas']

export type GuardianSecurityEventType = Schemas['SecurityEventType']
export type GuardianIpRule = Schemas['IpRuleResource']
export type GuardianPasswordPolicy = Schemas['PasswordPolicyResource']
export type GuardianTwoFactorPolicy = Schemas['TwoFactorPolicyResource']

/**
 * Every `SecurityEventType` (Guardian AC 23), in Guardian's order. The
 * vendored schema has the enum, so this list is checked against it both
 * ways at compile time (`EveryEventType`) and against `openapi.json` by
 * Vitest (D-069): a type Guardian adds fails the typecheck until it is
 * listed here.
 */
export const SECURITY_EVENT_TYPES = [
  'login.succeeded',
  'login.failed',
  'login.locked_out',
  'login.suspicious',
  'logout',
  'password.reset',
  'password.changed',
  'password.breach_check_unavailable',
  'two_factor.enabled',
  'two_factor.disabled',
  'two_factor.challenge_passed',
  'two_factor.challenge_failed',
  'two_factor.recovery_code_used',
  'two_factor.recovery_codes_regenerated',
  'two_factor.policy_conflict',
  'passkey.sign_count_mismatch',
  'session.revoked',
  'device.new',
  'token.issued',
  'token.revoked',
  'ip.denied',
  'lockout.cleared'
] as const satisfies readonly GuardianSecurityEventType[]

type Listed = typeof SECURITY_EVENT_TYPES[number]
type EveryEventType = [Exclude<GuardianSecurityEventType, Listed>] extends [never] ? true : never

/** Fails the typecheck while the schema has a type the list lacks. */
export const EVERY_EVENT_TYPE_LISTED: EveryEventType = true

/** The event type a lockout records (AC 92). */
export const LOCKED_OUT_EVENT: GuardianSecurityEventType = 'login.locked_out'

/** How many events a list loads at once. */
export const EVENTS_PAGE_SIZE = 50

/** How many IP rules or two-factor policies a list loads at once. */
export const ADMIN_PAGE_SIZE = 25

/** The two-factor methods a policy may allow, in Guardian's order. */
export const POLICY_METHODS = ['totp', 'email', 'sms', 'passkey'] as const

export type GuardianPolicyMethod = typeof POLICY_METHODS[number]

/** How Guardian applies IP rules (`guardian.ip_rules.mode`, D-063). */
export type GuardianIpRuleMode = 'allowlist' | 'denylist'

/** The `mode` option of the `guardian.ip-rules` screen: `allowlist` only when it says so exactly. */
export function ipRuleModeOf(options: Record<string, unknown> | null | undefined): GuardianIpRuleMode {
  return options?.mode === 'allowlist' ? 'allowlist' : 'denylist'
}

/** The layer path of a security event's page. */
export function eventPath(id: string): string {
  return `/guardian/security-events/${encodeURIComponent(id)}`
}

/** A `YYYY-MM-DD` day from a date input as the start of that day, in ISO 8601; null when blank. */
export function startOfDay(day: string): string | null {
  return dayAt(day, '00:00:00.000')
}

/** A `YYYY-MM-DD` day from a date input as the end of that day, in ISO 8601; null when blank. */
export function endOfDay(day: string): string | null {
  return dayAt(day, '23:59:59.999')
}

function dayAt(day: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return null
  }

  const date = new Date(`${day}T${time}`)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** A context value as one row shows it: strings as they are, anything else as JSON. */
export function contextValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  return value === undefined ? '' : JSON.stringify(value)
}
