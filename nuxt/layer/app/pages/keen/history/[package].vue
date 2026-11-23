<script setup lang="ts">
import { integrationData, useAtriumIntegration } from '../../../composables/useAtriumIntegration'
import KeenEntriesBrowser from '../../../integrations/keen/components/KeenEntriesBrowser.vue'
import type { KeenAuditedPackage } from '../../../integrations/keen/components/entries'

/**
 * The `keen.history` screen: one package's audit log, `keen.entries.index`
 * with `source` fixed to the package. The package must be one Keen lists in
 * `keen.packages.index` (it audits, and its history rule lets the user
 * read it); any other shows a not-found state, as v1 answered 404.
 */
const route = useRoute()
const { t } = useI18n()
const { client } = useAtriumIntegration('keen')

const key = computed(() => String(route.params.package))
const packages = shallowRef<KeenAuditedPackage[] | null>(null)
const error = shallowRef<unknown>(null)

const found = computed(() => packages.value?.find(pkg => pkg.key === key.value) ?? null)
const forbidden = computed(() => atriumStatus(error.value) === 403)
const title = computed(() => t('keen.history.title', { package: found.value?.label ?? key.value }))

onMounted(async () => {
  if (!client) {
    return
  }

  try {
    packages.value = integrationData(await client.GET('/packages')).data
  } catch (e) {
    error.value = e
    packages.value = []
  }
})

useHead({ title: () => title.value })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="keen.history">
        <AtriumNoAccess v-if="forbidden" />
        <USkeleton v-else-if="packages === null" class="h-40" />
        <UAlert
          v-else-if="!found"
          color="neutral"
          variant="subtle"
          icon="i-lucide-search-x"
          :title="t('keen.history.not_found')"
          :description="t('keen.history.not_found_description', { package: key })"
          data-testid="keen-history-not-found"
        />
        <KeenEntriesBrowser v-else :source="found.key" data-testid="keen-history" />
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
