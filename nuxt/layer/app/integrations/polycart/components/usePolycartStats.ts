import { integrationData } from '../../../composables/useAtriumIntegration'
import { useIntegrationQuery } from '../../../composables/useIntegrationQuery'
import type { PolycartStats } from './polycart'

/**
 * Polycart's `stats.show`, which both of its widgets read: one request per
 * dashboard load, shared while either is mounted (D-029).
 */
export function usePolycartStats() {
  return useIntegrationQuery('polycart', 'polycart.stats.show', async client => integrationData(await client.GET('/stats')).data as PolycartStats)
}
