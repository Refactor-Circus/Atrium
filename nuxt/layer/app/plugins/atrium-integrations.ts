import type { AtriumIntegrationModule } from '../composables/useAtriumIntegration'
import type { AtriumRegistry } from './atrium'

/**
 * Registers every suite integration the layer ships: each
 * `app/integrations/{pkg}/index.ts` default-exports a function that registers
 * its widgets, extensions, settings panel, search sources and live resolvers
 * (`defineAtriumIntegration()`), and exports its `screens` map.
 *
 * Every integration is always registered and always compiled (D-023): the
 * shell decides at run time which are active, and a registration whose
 * integration the shell does not list never runs or renders. A host's own
 * plugin, which runs after this one, may still replace any of them by key.
 */
const modules = import.meta.glob<AtriumIntegrationModule>('../integrations/*/index.ts', { eager: true })

export default defineNuxtPlugin({
  name: 'atrium-integrations',
  dependsOn: ['atrium'],
  setup(nuxtApp) {
    const atrium = nuxtApp.$atrium as AtriumRegistry

    for (const path of Object.keys(modules).sort()) {
      modules[path]?.default?.(atrium)
    }
  }
})
