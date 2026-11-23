import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Component tests run in a Nuxt environment built from this layer. A second
// locale, `fr`, exists here only (D-011): the layer ships `en` alone. The
// overrides reach Vitest's workers by cloning, so they name the module that
// adds it by path rather than holding a hook function.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.ts'],
      tsconfig: './test/tsconfig.json'
    },
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          modules: [fileURLToPath(new URL('./test/locale-module.ts', import.meta.url))]
        }
      }
    }
  }
})
