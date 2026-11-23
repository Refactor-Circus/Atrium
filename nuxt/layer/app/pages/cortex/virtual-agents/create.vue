<script setup lang="ts">
import type { CortexVirtualAgent } from '../../../integrations/cortex/components/cortex'
import CortexAgentForm from '../../../integrations/cortex/components/CortexAgentForm.vue'
import CortexPage from '../../../integrations/cortex/components/CortexPage.vue'

/**
 * `cortex.virtual-agent-create`: a new virtual agent (`virtual-agents.store`),
 * then its own page.
 */
const { t } = useI18n()
const router = useRouter()

function saved(agent: CortexVirtualAgent): void {
  void router.push(`/cortex/virtual-agents/${agent.slug}`)
}
</script>

<template>
  <CortexPage
    :title="t('cortex.virtual_agents.new')"
    screen-key="cortex.virtual-agent-create"
    :back="{ to: '/cortex/virtual-agents', label: t('cortex.virtual_agents.title') }"
  >
    <CortexAgentForm :agent="null" @saved="saved" />
  </CortexPage>
</template>
