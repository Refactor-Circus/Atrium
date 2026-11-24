import './atrium.css'
import { defineAtriumModule } from '@refactor-circus/atrium'
import SettingsHelp from './components/extensions/SettingsHelp.vue'
import StorefrontTab from './components/extensions/StorefrontTab.vue'
import VisitStore from './components/extensions/VisitStore.vue'
import GoalsWidget from './components/widgets/GoalsWidget.vue'
import RecentOrdersWidget from './components/widgets/RecentOrdersWidget.vue'
import ServicesWidget from './components/widgets/ServicesWidget.vue'
import ShopSettings from './components/widgets/ShopSettings.vue'
import StatWidget from './components/widgets/StatWidget.vue'
import WelcomeWidget from './components/widgets/WelcomeWidget.vue'

/**
 * WORKBENCH ONLY. What a host app does with Atrium's front end: its own
 * module (here the demo plugin's components), built with the module preset
 * and loaded by the page (the workbench registers it with Atrium::module()).
 * It sets no auth adapter: the page's session signs every request.
 */
export default defineAtriumModule({
  key: 'demo',
  widgets: {
    'demo.revenue': StatWidget,
    'demo.orders': StatWidget,
    'demo.conversion': StatWidget,
    'demo.users': StatWidget,
    'demo.recent-orders': RecentOrdersWidget,
    'demo.services': ServicesWidget,
    'demo.goals': GoalsWidget,
    'demo.welcome': WelcomeWidget
  },
  settingsPanels: {
    demo: ShopSettings
  },
  extensions: {
    'demo.storefront': StorefrontTab,
    'demo.visit-store': VisitStore,
    'demo.help': SettingsHelp
  }
})
