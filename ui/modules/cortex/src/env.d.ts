/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('cortex')`, `useIntegrationQuery('cortex', …)` and
// `mockPackageApi('cortex', …)` by Cortex's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    cortex: paths
  }
}
