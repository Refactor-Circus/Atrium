import StatWidget from '../components/widgets/StatWidget.vue'
import RecentOrdersWidget from '../components/widgets/RecentOrdersWidget.vue'
import ServicesWidget from '../components/widgets/ServicesWidget.vue'
import GoalsWidget from '../components/widgets/GoalsWidget.vue'
import WelcomeWidget from '../components/widgets/WelcomeWidget.vue'
import ShopSettings from '../components/widgets/ShopSettings.vue'
import StorefrontTab from '../components/extensions/StorefrontTab.vue'
import VisitStore from '../components/extensions/VisitStore.vue'
import SettingsHelp from '../components/extensions/SettingsHelp.vue'

/**
 * What a host app (or a package's Nuxt layer) does: say how it signs API
 * requests, and give each key its PHP side declares a Vue component.
 */
export default defineNuxtPlugin(() => {
  const token = useRuntimeConfig().public.atrium.token as string
  const atrium = useAtrium()

  // Any scheme works here: a Passport access token from your OAuth flow, a
  // Sanctum cookie (`credentials: 'include'`), ... The host owns the token
  // and where it is stored. The workbench accepts one fixed token, through
  // its workbench-only AuthenticateWorkbenchToken guard, in `local` only.
  atrium.auth({
    headers: () => ({ Authorization: `Bearer ${token}` }),
    onUnauthorized: () => { console.warn('[atrium] the API answered 401: sign in again') }
  })

  for (const key of ['demo.revenue', 'demo.orders', 'demo.conversion', 'demo.users']) {
    atrium.widget(key, StatWidget)
  }

  atrium
    .widget('demo.recent-orders', RecentOrdersWidget)
    .widget('demo.services', ServicesWidget)
    .widget('demo.goals', GoalsWidget)
    .widget('demo.welcome', WelcomeWidget)
    .settingsPanel('demo', ShopSettings)
    .extension('demo.storefront', StorefrontTab)
    .extension('demo.visit-store', VisitStore)
    .extension('demo.help', SettingsHelp)
})
