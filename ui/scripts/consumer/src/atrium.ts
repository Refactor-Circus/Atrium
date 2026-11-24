import './atrium.css'
import { defineAtriumModule } from '@refactor-circus/atrium'
import ConsumerPanel from './components/ConsumerPanel.vue'

export default defineAtriumModule({
  key: 'consumer',
  integration: null,
  widgets: { 'consumer.panel': ConsumerPanel }
})
