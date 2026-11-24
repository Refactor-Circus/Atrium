<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import GuardianPager from '../../components/access/GuardianPager.vue'
import { blankToNull, pageOf } from '../../components/access/access'
import { ADMIN_PAGE_SIZE, endOfDay, ipRuleModeOf, type GuardianIpRule } from '../../components/admin/admin'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad, type GuardianPage } from '../../components/two-factor/guardian'

/**
 * `guardian.ip-rules` (AC 93): the IP allow and deny rules
 * (`guardian.ip-rules.index`), a page at a time; a new rule (`cidr`,
 * `action`, `description` and an optional expiry day, sent as the end of
 * that day) through `guardian.ip-rules.store`, whose 422 names an invalid
 * CIDR; and a delete after a confirmation. The screen's `mode` option says
 * how Guardian applies them: in `allowlist` mode a warning says a request
 * matching no allow rule is refused, and deleting an allow rule asks a
 * second time, naming that risk.
 */
const { t } = useI18n()
const create = useGuardianAction()
const remove = useGuardianAction()

useHead({ title: () => t('guardian.admin.ip_rules.title') })

const { data: screen } = useAtriumScreen('guardian.ip-rules')
const mode = computed(() => ipRuleModeOf(screen.value?.data.options as Record<string, unknown> | undefined))

const page = ref(1)
const query = computed(() => ({ per_page: ADMIN_PAGE_SIZE, ...(page.value > 1 ? { page: page.value } : {}) }))

const { client, data, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianIpRule>>(await guardian.GET('/ip-rules', { params: { query: query.value } })), query)

const rows = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))
const form = reactive({ cidr: '', action: 'deny' as 'allow' | 'deny', description: '', expires: '' })

async function add(): Promise<void> {
  if (!client) {
    return
  }

  const body = {
    cidr: form.cidr.trim(),
    action: form.action,
    description: blankToNull(form.description),
    expires_at: endOfDay(form.expires)
  }

  if (await create.run(async () => guardianData(await client.POST('/ip-rules', { body })))) {
    Object.assign(form, { cidr: '', action: 'deny', description: '', expires: '' })
    await reload()
  }
}

async function destroy(rule: GuardianIpRule): Promise<void> {
  if (!client || !window.confirm(t('guardian.admin.ip_rules.confirm_delete', { cidr: rule.cidr }))) {
    return
  }

  if (mode.value === 'allowlist' && rule.action === 'allow' && !window.confirm(t('guardian.admin.ip_rules.confirm_allow_delete', { cidr: rule.cidr }))) {
    return
  }

  if (await remove.run(async () => guardianData(await client.DELETE('/ip-rules/{rule}', { params: { path: { rule: rule.id } } })))) {
    await reload()
  }
}

function go(next: number): void {
  page.value = next
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.admin.ip_rules.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.ip-rules">
        <div class="space-y-4" data-testid="guardian-ip-rules">
          <p class="text-sm text-muted" data-testid="guardian-ip-rules-mode">{{ t(`guardian.admin.ip_rules.mode.${mode}`) }}</p>
          <UAlert
            v-if="mode === 'allowlist'"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            :title="t('guardian.admin.ip_rules.allowlist_warning')"
            data-testid="guardian-ip-rules-allowlist"
          />

          <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status">
            <div class="space-y-4">
              <GuardianErrors :action="remove" testid="guardian-ip-rule-delete" />
              <p v-if="rows.length === 0" class="atrium-empty" data-testid="guardian-ip-rules-empty">{{ t('guardian.admin.ip_rules.empty') }}</p>
              <table v-else class="w-full text-left text-sm" data-testid="guardian-ip-rules-table">
                <thead class="text-muted">
                  <tr>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.ip_rules.fields.cidr') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.ip_rules.fields.action') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.ip_rules.fields.description') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.ip_rules.fields.expires_at') }}</th>
                    <th class="py-2" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="rule in rows" :key="rule.id" :data-testid="`guardian-ip-rule-${rule.id}`">
                    <td class="py-2 pr-3 font-mono">{{ rule.cidr }}</td>
                    <td class="py-2 pr-3">
                      <UBadge :color="rule.action === 'allow' ? 'success' : 'error'" variant="subtle">{{ t(`guardian.admin.ip_rules.actions.${rule.action === 'allow' ? 'allow' : 'deny'}`) }}</UBadge>
                    </td>
                    <td class="py-2 pr-3">{{ rule.description ?? '—' }}</td>
                    <td class="py-2 pr-3 text-muted">{{ formatDate(rule.expires_at) ?? t('guardian.admin.never') }}</td>
                    <td class="py-2 text-right">
                      <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash" :data-testid="`guardian-ip-rule-delete-${rule.id}`" @click="destroy(rule)">{{ t('guardian.admin.delete') }}</UButton>
                    </td>
                  </tr>
                </tbody>
              </table>

              <GuardianPager :current="paging.current" :last="paging.last" testid="guardian-ip-rules" @go="go" />

              <UCard>
                <template #header>
                  <h2 class="font-medium">{{ t('guardian.admin.ip_rules.new') }}</h2>
                </template>
                <form class="flex flex-wrap items-end gap-3" data-testid="guardian-ip-rule-form" @submit.prevent="add">
                  <UFormField :label="t('guardian.admin.ip_rules.fields.cidr')" :hint="t('guardian.admin.ip_rules.cidr_hint')" :error="create.error('cidr')" required>
                    <UInput v-model="form.cidr" class="w-48 font-mono" data-testid="guardian-ip-rule-cidr" />
                  </UFormField>
                  <UFormField :label="t('guardian.admin.ip_rules.fields.action')" :error="create.error('action')" required>
                    <select v-model="form.action" class="w-32 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-ip-rule-action">
                      <option value="allow">{{ t('guardian.admin.ip_rules.actions.allow') }}</option>
                      <option value="deny">{{ t('guardian.admin.ip_rules.actions.deny') }}</option>
                    </select>
                  </UFormField>
                  <UFormField :label="t('guardian.admin.ip_rules.fields.description')" :error="create.error('description')">
                    <UInput v-model="form.description" class="w-64" data-testid="guardian-ip-rule-description" />
                  </UFormField>
                  <UFormField :label="t('guardian.admin.ip_rules.fields.expires_at')" :error="create.error('expires_at')">
                    <input v-model="form.expires" type="date" class="rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-ip-rule-expires">
                  </UFormField>
                  <UButton type="submit" icon="i-lucide-plus" :loading="create.busy.value" data-testid="guardian-ip-rule-submit">{{ t('guardian.admin.ip_rules.create') }}</UButton>
                </form>
                <div class="mt-3">
                  <GuardianErrors v-if="Object.keys(create.errors.value).length === 0" :action="create" testid="guardian-ip-rule-create" />
                </div>
              </UCard>
            </div>
          </GuardianState>
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
