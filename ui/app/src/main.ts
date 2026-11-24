import './assets/atrium.css'
import ui from '@nuxt/ui/vue-plugin'
import {
  atriumI18n,
  installAtriumIcons,
  installAtriumModules,
  setAtriumApp,
  setAtriumLocale,
  useAtriumBoot
} from '@refactor-circus/atrium'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { integrationGuard } from './integration-guard'
import { installSpotlight } from './plugins/spotlight'
import { coreRoutes } from './routes'

/*
 * Atrium's front end, as the Blade page boots it (D-079): the module
 * scripts the page lists ran before this one and declared themselves with
 * defineAtriumModule(); each whose integration is active now registers its
 * routes, components and strings, and only then does the router take its
 * first navigation and the app mount.
 */
const boot = useAtriumBoot()
const router = createRouter({ history: createWebHistory(boot.client_path), routes: coreRoutes })
const app = createApp(App)

app.use(createPinia())
app.use(atriumI18n())
app.use(ui)

setAtriumApp(app, router)
installAtriumIcons({ remote: boot.icons.remote })
setAtriumLocale(boot.locale)

await installAtriumModules(app, router)

router.beforeEach(integrationGuard)
app.use(router)

await router.isReady()

app.mount('#atrium')

installSpotlight()
