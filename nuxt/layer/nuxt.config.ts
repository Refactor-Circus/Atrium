import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

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
        version
      }
    }
  },

  // Icons come from collections installed with the app, served by the app's
  // own icon endpoint: nothing leaves for the Iconify API unless a host opts
  // in with `icon: { fallbackToApi: true }` (or `provider: 'iconify'`).
  // Hosts add packs by installing `@iconify-json/<set>` and listing the set
  // in `icon.serverBundle.collections`.
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['lucide']
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
      { code: 'en', name: 'English', file: 'en.json' }
    ]
  },

  compatibilityDate: '2026-11-01'
})
