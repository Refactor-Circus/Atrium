import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Component tests run in a Nuxt environment built from this layer. A second
// locale, `fr`, exists here only (D-011): the layer ships `en` alone.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.ts'],
      tsconfig: './test/tsconfig.json'
    },
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          hooks: {
            'i18n:registerModule': (register) => {
              register({
                langDir: fileURLToPath(new URL('./test/locales', import.meta.url)),
                locales: [{ code: 'fr', name: 'Français (test only)', file: 'fr.json' }]
              })
            }
          }
        }
      }
    }
  }
})
