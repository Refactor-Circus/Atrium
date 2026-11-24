/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('keen')`, `useIntegrationQuery('keen', …)` and
// `mockPackageApi('keen', …)` by Keen's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    keen: paths
  }
}
