import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// Every Lucide icon, bundled into the client (see `icon` below). Icon names
// come from the API at runtime, so a scan of the source cannot find them.
const lucide = createRequire(import.meta.url)('@iconify-json/lucide/icons.json') as { icons: Record<string, unknown> }
const lucideIcons = Object.keys(lucide.icons).map(name => `lucide:${name}`)

// The suite integrations the layer ships (app/integrations/{key}).
const integrations = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']

// Each integration's layer strings, merged into `en` (AC 53): one file per
// integration, one per Guardian, Roster and Showroom screen area, and the hooks'.
const integrationLocales = [
  'cortex', 'impex', 'keen', 'pennantplus', 'polycart',
  'guardian', 'guardian-two-factor', 'guardian-security', 'guardian-access', 'guardian-admin', 'guardian-sso',
  'roster', 'roster-users', 'roster-organizations', 'roster-access',
  'showroom', 'showroom-catalog', 'showroom-structure', 'showroom-assets',
  'hooks'
].map(name => `integrations/${name}.en.json`)

// Headless Atrium as a Nuxt layer. An app extends it, points
// `runtimeConfig.public.atrium.apiBase` at Atrium's JSON API
// (`atrium.routes.prefix`, `/atrium/api` by default) and registers, in its own
// plugins, how it authenticates and the Vue component for each widget,
// screen extension and settings panel key its packages declare.
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/i18n'],

  // Atrium's layer is an SPA: nothing renders on the server.
  ssr: false,

  css: [fileURLToPath(new URL('./app/assets/css/atrium.css', import.meta.url))],

  // Pinia stores in the layer, auto-imported like its composables.
  imports: {
    dirs: [fileURLToPath(new URL('./app/stores', import.meta.url))]
  },

  runtimeConfig: {
    public: {
      atrium: {
        // Overridden with NUXT_PUBLIC_ATRIUM_API_BASE.
        apiBase: '/atrium/api',
        // The layer's own version, compared with the shell's `api_version`.
        version,
        // Where each integration's API is, when not where the shell's
        // `api_base` says (an API on another host). Empty means the shell's.
        // Overridden with NUXT_PUBLIC_ATRIUM_INTEGRATIONS_{KEY}_API_BASE.
        integrations: Object.fromEntries(integrations.map(key => [key, { apiBase: '' }])) as Record<string, { apiBase: string }>
      }
    }
  },

  // Icons come from collections installed with the app: nothing leaves for
  // the Iconify API unless a host opts in with `icon: { fallbackToApi: true }`
  // (or `provider: 'iconify'`). The Lucide collection is bundled into the
  // client, so it renders in a static SPA (`nuxt generate`, served by
  // Laravel) where no server answers `/api/_nuxt_icon`; the server bundle
  // serves it, and any pack a host adds, when the app runs a Nitro server.
  // Hosts add packs by installing `@iconify-json/<set>` and listing the set
  // in `icon.serverBundle.collections` (a static host lists its icons in
  // `icon.clientBundle.icons` instead).
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      icons: lucideIcons,
      scan: true,
      sizeLimitKb: 0
    },
    fallbackToApi: false
  },

  // The layer's own strings. Hosts add or override locales with their own
  // `i18n.locales`; the shell's `locale` picks the one in use.
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', name: 'English', files: ['en.json', ...integrationLocales] }
    ]
  },

  compatibilityDate: '2026-11-01'
})
