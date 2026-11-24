import type { components } from '../../client/schema'

/*
 * Shared payloads of the Guardian security administration suites (AC 91 to
 * 95), typed with `satisfies` against the vendored schema.
 */

type Schemas = components['schemas']

export const failedLogin = {
  id: 'evt-1',
  type: 'login.failed',
  user_id: '7',
  identifier_hash: 'abc123',
  ip: '203.0.113.5',
  user_agent: 'Firefox',
  context: { guard: 'web', attempts: 3, reasons: ['password'] },
  occurred_at: '2026-11-23T10:00:00+00:00'
} satisfies Schemas['SecurityEventResource']

export const lockedOut = { ...failedLogin, id: 'evt-2', type: 'login.locked_out', context: {} } satisfies Schemas['SecurityEventResource']

export const denyRule = {
  id: 'rule-1',
  cidr: '198.51.100.0/24',
  action: 'deny',
  description: 'Scrapers',
  expires_at: null,
  created_by: '1',
  created_at: '2026-11-01T10:00:00+00:00',
  updated_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['IpRuleResource']

export const allowRule = { ...denyRule, id: 'rule-2', cidr: '203.0.113.0/24', action: 'allow', description: 'Office' } satisfies Schemas['IpRuleResource']

export const passwordPolicy = {
  min_length: 12,
  max_length: 128,
  letters: true,
  mixed_case: true,
  numbers: true,
  symbols: false,
  uncompromised: true,
  uncompromised_threshold: 0,
  history: 5,
  max_age_days: 90
} satisfies Schemas['PasswordPolicyResource']

export const orgPolicy = {
  id: 'pol-1',
  scope_type: 'org',
  scope_id: 'acme',
  role: 'editor',
  required: true,
  methods: ['totp', 'passkey'],
  grace_days: 7,
  created_at: '2026-11-01T10:00:00+00:00',
  updated_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['TwoFactorPolicyResource']
