/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('guardian')`, `useIntegrationQuery('guardian', …)` and
// `mockPackageApi('guardian', …)` by Guardian's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    guardian: paths
  }
}
