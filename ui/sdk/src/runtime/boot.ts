/**
 * What the Blade page (`atrium::app`) hands the front end, as JSON in
 * `<script type="application/json" id="atrium-boot">`: where the API is,
 * where the SPA is served, who is signed in, which integrations are active
 * and which module scripts the page loaded. Read once, at boot.
 */
export interface AtriumBoot {
  /** Atrium's package version (`2.0.0`); its major.minor is the API version */
  version: string
  /** Atrium's JSON API, an absolute URL without a trailing slash */
  api_base: string
  /** The path the SPA is served under (the router's base), e.g. `/atrium` */
  client_path: string
  /** The app's locale; the front end switches to it when it has messages for it */
  locale: string
  /** The session's CSRF token, sent as `X-CSRF-TOKEN` on same-origin requests */
  csrf_token: string | null
  /** The signed-in user, as the host's guard resolved them */
  user: AtriumBootUser | null
  /** The theme shown until someone picks another */
  theme: string
  /** Every registered suite integration, by key: its API base and whether it is active for the user */
  integrations: Record<string, AtriumBootIntegration>
  /** Every suite integration Atrium knows, registered or not: a path under one of them is that integration's */
  known_integrations: string[]
  /** The modules whose scripts the page loaded, in load order */
  modules: AtriumBootModule[]
  /** Whether icons outside the bundled collections may be fetched from the Iconify API */
  icons: { remote: boolean }
}

export interface AtriumBootUser {
  id: string | number | null
  name: string | null
  email: string | null
}

export interface AtriumBootIntegration {
  /** Absolute URL of the package's API */
  api_base: string
  /** Registered and active for the user (its features resolve) */
  active: boolean
}

export interface AtriumBootModule {
  /** The module's key: an integration key (`roster`), a plugin key, or `app` */
  key: string
  /** The integration it belongs to, when it is one: it runs only while that integration is active */
  integration: string | null
  scripts: string[]
  styles: string[]
}

const DEFAULTS: AtriumBoot = {
  version: '0.0.0',
  api_base: '/atrium/api',
  client_path: '/',
  locale: 'en',
  csrf_token: null,
  user: null,
  theme: 'atrium',
  integrations: {},
  known_integrations: [],
  modules: [],
  icons: { remote: false }
}

let boot: AtriumBoot | null = null

/** The boot data from the page, read once (defaults when the page has none, as in tests). */
export function useAtriumBoot(): AtriumBoot {
  if (boot === null) {
    boot = readBoot()
  }

  return boot
}

/** Replaces the boot data: for tests, and for hosts that mount Atrium themselves. */
export function setAtriumBoot(overrides: Partial<AtriumBoot> = {}): AtriumBoot {
  boot = { ...DEFAULTS, ...overrides, icons: { ...DEFAULTS.icons, ...overrides.icons } }

  return boot
}

function readBoot(): AtriumBoot {
  const element = typeof document === 'undefined' ? null : document.getElementById('atrium-boot')

  if (!element?.textContent) {
    return { ...DEFAULTS }
  }

  try {
    return { ...DEFAULTS, ...JSON.parse(element.textContent) as Partial<AtriumBoot> }
  } catch {
    console.error('[atrium] The boot data (#atrium-boot) is not valid JSON; using defaults.')

    return { ...DEFAULTS }
  }
}
