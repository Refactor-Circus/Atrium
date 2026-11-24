<script setup lang="ts">
import { integrationData, useAtriumIntegration } from '@refactor-circus/atrium'
import KeenEntriesBrowser from '../../components/KeenEntriesBrowser.vue'
import KeenRecordForm from '../../components/KeenRecordForm.vue'

/**
 * The `keen.entries` screen: every package's audit entries, filtered and a
 * cursor page at a time, and the "Record an event" form. The source filter
 * offers the packages whose history the user may read
 * (`keen.packages.index`), plus the application's own entries.
 */
const { t } = useI18n()
const { client } = useAtriumIntegration('keen')

const browser = useTemplateRef<InstanceType<typeof KeenEntriesBrowser>>('browser')
const sources = shallowRef<{ value: string, label: string }[]>([])

useHead({ title: () => t('keen.audit_log') })

onMounted(async () => {
  try {
    const packages = client ? integrationData(await client.GET('/packages')).data : []

    sources.value = packages.map(pkg => ({ value: pkg.key, label: pkg.label }))
  } catch {
    // The source filter still offers the application's own entries.
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('keen.audit_log')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="keen.entries">
        <div class="space-y-4" data-testid="keen-entries-page">
          <KeenEntriesBrowser ref="browser" :sources="sources" />
          <KeenRecordForm @recorded="browser?.reload()" />
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
