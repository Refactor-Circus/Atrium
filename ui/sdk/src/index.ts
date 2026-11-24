/*
 * @refactor-circus/atrium: the runtime every Atrium module shares through the
 * page's import map (D-082). Everything here is one instance per page.
 */
import './types/router'

/**
 * Each integration's API paths, for its typed client
 * (`useAtriumIntegration(key)`, `useIntegrationQuery(key, …)`,
 * `mockPackageApi(key, …)`). Empty here: each module adds its own,
 *
 *   declare module '@refactor-circus/atrium' {
 *     interface AtriumIntegrationPaths { roster: import('../client').paths }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AtriumIntegrationPaths {}

export * from './runtime/boot'
export * from './runtime/context'
export * from './runtime/http'
export * from './runtime/asyncData'
export * from './runtime/i18n'
export * from './runtime/colorMode'
export * from './runtime/icons'
export * from './runtime/module'
export * from './runtime/version'
export * from './registry'
export * from './composables/useAtriumApi'
export * from './composables/useAtriumClient'
export * from './composables/useAtriumDashboard'
export * from './composables/useAtriumIcon'
export * from './composables/useAtriumIntegration'
export * from './composables/useAtriumNavigation'
export * from './composables/useAtriumPalette'
export * from './composables/useAtriumScreen'
export * from './composables/useAtriumSearch'
export * from './composables/useAtriumSettingsPanel'
export * from './composables/useAtriumTheme'
export * from './composables/useIntegrationQuery'
export * from './stores/atriumShell'
export * from './utils/atriumLayout'
export * from './utils/atriumLink'
export * from './utils/atriumStatus'
export * from './utils/atriumVersion'
export type * from './types/atrium'
export type * from './types/router'
export type * from './types/components'
export type { paths as AtriumPaths, components as AtriumComponents, operations as AtriumOperations } from './client/schema'
export { useHead } from '@unhead/vue'

export { default as AtriumDashboardGrid } from './components/AtriumDashboardGrid.vue'
export { default as AtriumDashboardPage } from './components/AtriumDashboardPage.vue'
export { default as AtriumDetails } from './components/AtriumDetails.vue'
export { default as AtriumErrorCard } from './components/AtriumErrorCard.vue'
export { default as AtriumExtension } from './components/AtriumExtension.vue'
export { default as AtriumIcon } from './components/AtriumIcon.vue'
export { default as AtriumIntegrationScreen } from './components/AtriumIntegrationScreen.vue'
export { default as AtriumIntegrationUnavailable } from './components/AtriumIntegrationUnavailable.vue'
export { default as AtriumNavigation } from './components/AtriumNavigation.vue'
export { default as AtriumNavList } from './components/AtriumNavList.vue'
export { default as AtriumNoAccess } from './components/AtriumNoAccess.vue'
export { default as AtriumPageHeader } from './components/AtriumPageHeader.vue'
export { default as AtriumResponseNotice } from './components/AtriumResponseNotice.vue'
export { default as AtriumScreen } from './components/AtriumScreen.vue'
export { default as AtriumSearch } from './components/AtriumSearch.vue'
export { default as AtriumSections } from './components/AtriumSections.vue'
export { default as AtriumSelect } from './components/AtriumSelect.vue'
export { default as AtriumSettingsPanel } from './components/AtriumSettingsPanel.vue'
export { default as AtriumStat } from './components/AtriumStat.vue'
export { default as AtriumState } from './components/AtriumState.vue'
export { default as AtriumStatusBar } from './components/AtriumStatusBar.vue'
export { default as AtriumTopbar } from './components/AtriumTopbar.vue'
export { default as AtriumUnregistered } from './components/AtriumUnregistered.vue'
export { default as AtriumVersionBanner } from './components/AtriumVersionBanner.vue'
export { default as AtriumWidget } from './components/AtriumWidget.vue'
export { default as AtriumWidgetPicker } from './components/AtriumWidgetPicker.vue'
export { default as AtriumLink } from './components/AtriumLink.vue'
