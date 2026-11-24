/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('showroom')`, `useIntegrationQuery('showroom', …)` and
// `mockPackageApi('showroom', …)` by Showroom's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    showroom: paths
  }
}
