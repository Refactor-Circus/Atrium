/// <reference types="vite/client" />
import type { paths } from '../client/schema'

// Types `useAtriumIntegration('pennantplus')`, `useIntegrationQuery('pennantplus', …)` and
// `mockPackageApi('pennantplus', …)` by PennantPlus's API.
declare module '@refactor-circus/atrium' {
  interface AtriumIntegrationPaths {
    pennantplus: paths
  }
}
