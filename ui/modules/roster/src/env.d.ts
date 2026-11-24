/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('roster')`, `useIntegrationQuery('roster', …)` and
// `mockPackageApi('roster', …)` by Roster's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    roster: paths
  }
}
