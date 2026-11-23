import { fileURLToPath } from 'node:url'
import { defineNuxtModule } from 'nuxt/kit'

// Adds the test-only `fr` locale (D-011: the layer ships `en` alone). It is a
// module, named by path in vitest.config.ts, because Vitest hands the Nuxt
// overrides to its workers, which cannot receive a hook function.
export default defineNuxtModule({
  meta: { name: 'atrium-test-locale' },
  setup(_options, nuxt) {
    nuxt.hook('i18n:registerModule', (register) => {
      register({
        langDir: fileURLToPath(new URL('./locales', import.meta.url)),
        locales: [{ code: 'fr', name: 'Français (test only)', file: 'fr.json' }]
      })
    })
  }
})
