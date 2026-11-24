<script setup lang="ts">
import { cortexData, useCortexAction, useCortexLoad, type CortexList, type CortexRedirectDomain } from '../components/cortex'
import CortexActionError from '../components/CortexActionError.vue'
import CortexLoad from '../components/CortexLoad.vue'
import CortexPage from '../components/CortexPage.vue'

/**
 * `cortex.redirect-domains`: the stored OAuth redirect domains
 * (`redirect-domains.index`), global and owned, with add
 * (`redirect-domains.store`) and remove (`redirect-domains.destroy`). The
 * v1 source filter, configured-domains block and paging have no v2 route
 * (see `app/integrations/cortex/index.ts`).
 */
const { t } = useI18n()
const action = useCortexAction()
const busy = action.busy

const domain = ref('')

const { client, data, pending, failed, status, reload } = useCortexLoad(async cortex =>
  cortexData<CortexList<CortexRedirectDomain>>(await cortex.GET('/redirect-domains')).data)

const domains = computed(() => data.value ?? [])

async function add(): Promise<void> {
  if (client && await action.run(async () => cortexData(await client.POST('/redirect-domains', { body: { domain: domain.value } })))) {
    domain.value = ''
    await reload()
  }
}

async function remove(entry: CortexRedirectDomain): Promise<void> {
  if (client && await action.run(async () => cortexData(await client.DELETE('/redirect-domains/{domain}', { params: { path: { domain: entry.id } } })))) {
    await reload()
  }
}
</script>

<template>
  <CortexPage :title="t('cortex.redirect_domains.title')" screen-key="cortex.redirect-domains" :description="t('cortex.redirect_domains.description')">
    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <div class="flex flex-col gap-4">
        <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />

        <UCard>
          <template #header>
            <h3 class="font-medium">{{ t('cortex.redirect_domains.add') }}</h3>
          </template>
          <form class="flex flex-wrap items-end gap-3" data-testid="cortex-add-domain-form" @submit.prevent="add">
            <UFormField :label="t('cortex.redirect_domains.domain')" :hint="t('cortex.redirect_domains.domain_hint')" :error="action.error('domain')" class="w-80" required>
              <UInput v-model="domain" placeholder="https://claude.ai" class="w-full" data-testid="cortex-domain" />
            </UFormField>
            <UButton type="submit" icon="i-lucide-plus" :label="t('cortex.redirect_domains.add')" :loading="busy" data-testid="cortex-add-domain" />
          </form>
        </UCard>

        <p v-if="domains.length === 0" class="atrium-empty" data-testid="cortex-empty">{{ t('cortex.redirect_domains.empty') }}</p>

        <table v-else class="w-full text-sm" data-testid="cortex-redirect-domains">
          <thead class="text-left text-muted">
            <tr>
              <th class="py-2">{{ t('cortex.redirect_domains.domain') }}</th>
              <th class="py-2">{{ t('cortex.redirect_domains.source') }}</th>
              <th class="py-2">{{ t('cortex.redirect_domains.created') }}</th>
              <th class="py-2 text-right">{{ t('cortex.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="entry in domains" :key="entry.id" :data-testid="`cortex-domain-${entry.id}`">
              <td class="py-2"><code class="text-xs">{{ entry.domain }}</code></td>
              <td class="py-2">
                <span v-if="entry.owner_type">{{ entry.owner_id }} <span class="text-xs text-muted">{{ entry.owner_type }}</span></span>
                <UBadge v-else color="neutral" variant="subtle" :label="t('cortex.redirect_domains.global')" />
              </td>
              <td class="py-2">{{ entry.created_at ?? '—' }}</td>
              <td class="py-2 text-right">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-trash"
                  :label="t('cortex.redirect_domains.remove')"
                  :data-testid="`cortex-remove-domain-${entry.id}`"
                  @click="remove(entry)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
