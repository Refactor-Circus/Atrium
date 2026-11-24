<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import GuardianPager from '../../components/access/GuardianPager.vue'
import { blankToNull, pageOf, scopeKeyOf, scopeTypesOf, useRoleCatalogue } from '../../components/access/access'
import { ADMIN_PAGE_SIZE, POLICY_METHODS, type GuardianPolicyMethod, type GuardianTwoFactorPolicy } from '../../components/admin/admin'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { guardianData, useGuardianAction, useGuardianLoad, type GuardianPage } from '../../components/two-factor/guardian'

/**
 * `guardian.two-factor-policies` (AC 95): who must use two-factor, and how.
 * Lists `guardian.two-factor-policies.index` a page at a time; creates a
 * policy with `scope_type` (from the screen's `scope_types`, or none),
 * `scope_id`, `role` (from `guardian.roles.index`, or none), `required`,
 * `methods` (any of the four, or none for every method) and `grace_days`;
 * updates `required`, `methods` and `grace_days` in place, which is all
 * Guardian's update accepts (D-071); deletes after a confirmation.
 */
const { t } = useI18n()
const create = useGuardianAction()
const update = useGuardianAction()
const remove = useGuardianAction()

useHead({ title: () => t('guardian.admin.policies.title') })

const { data: screen } = useAtriumScreen('guardian.two-factor-policies')
const scopeTypes = computed(() => scopeTypesOf(screen.value?.data.options as Record<string, unknown> | undefined))

const page = ref(1)
const query = computed(() => ({ per_page: ADMIN_PAGE_SIZE, ...(page.value > 1 ? { page: page.value } : {}) }))

const { client, data, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianTwoFactorPolicy>>(await guardian.GET('/two-factor-policies', { params: { query: query.value } })), query)

const roles = useRoleCatalogue(client)
const rows = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))

interface PolicyEdit {
  required: boolean
  methods: GuardianPolicyMethod[]
  grace_days: number
}

const edits = reactive<Record<string, PolicyEdit>>({})
const form = reactive({ scope_type: '', scope_id: '', role: '', required: true, methods: [] as GuardianPolicyMethod[], grace_days: 0 })

watch(rows, (current) => {
  for (const policy of current) {
    edits[policy.id] = {
      required: policy.required,
      methods: POLICY_METHODS.filter(method => policy.methods?.includes(method)),
      grace_days: policy.grace_days
    }
  }
}, { immediate: true })

function scopeOf(policy: GuardianTwoFactorPolicy): string {
  return policy.scope_type
    ? `${scopeKeyOf(policy.scope_type, scopeTypes.value)} ${policy.scope_id ?? ''}`.trim()
    : t('guardian.admin.policies.everyone')
}

function methodsOf(methods: GuardianPolicyMethod[]): GuardianPolicyMethod[] | null {
  return methods.length === 0 ? null : POLICY_METHODS.filter(method => methods.includes(method))
}

function graceOf(value: number | string): number {
  const days = Number(value)

  return Number.isFinite(days) ? Math.trunc(days) : 0
}

async function add(): Promise<void> {
  if (!client) {
    return
  }

  const scopeType = blankToNull(form.scope_type)
  const body = {
    scope_type: scopeType,
    scope_id: scopeType === null ? null : blankToNull(form.scope_id),
    role: blankToNull(form.role),
    required: form.required,
    methods: methodsOf(form.methods),
    grace_days: graceOf(form.grace_days)
  }

  if (await create.run(async () => guardianData(await client.POST('/two-factor-policies', { body })))) {
    Object.assign(form, { scope_type: '', scope_id: '', role: '', required: true, methods: [], grace_days: 0 })
    await reload()
  }
}

async function save(policy: GuardianTwoFactorPolicy): Promise<void> {
  const edit = edits[policy.id]

  if (!client || !edit) {
    return
  }

  const body = { required: edit.required, methods: methodsOf(edit.methods), grace_days: graceOf(edit.grace_days) }

  if (await update.run(async () => guardianData(await client.PATCH('/two-factor-policies/{policy}', { params: { path: { policy: policy.id } }, body })))) {
    await reload()
  }
}

async function destroy(policy: GuardianTwoFactorPolicy): Promise<void> {
  if (!client || !window.confirm(t('guardian.admin.policies.confirm_delete', { scope: scopeOf(policy) }))) {
    return
  }

  if (await remove.run(async () => guardianData(await client.DELETE('/two-factor-policies/{policy}', { params: { path: { policy: policy.id } } })))) {
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
      <UDashboardNavbar :title="t('guardian.admin.policies.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.two-factor-policies">
        <div class="space-y-4" data-testid="guardian-two-factor-policies">
          <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status">
            <div class="space-y-4">
              <GuardianErrors :action="update" testid="guardian-policy-update" />
              <GuardianErrors :action="remove" testid="guardian-policy-delete" />
              <p v-if="rows.length === 0" class="atrium-empty" data-testid="guardian-policies-empty">{{ t('guardian.admin.policies.empty') }}</p>
              <table v-else class="w-full text-left text-sm" data-testid="guardian-policies-table">
                <thead class="text-muted">
                  <tr>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.policies.fields.scope') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.policies.fields.role') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.policies.fields.required') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.policies.fields.methods') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.policies.fields.grace_days') }}</th>
                    <th class="py-2" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="policy in rows" :key="policy.id" :data-testid="`guardian-policy-${policy.id}`">
                    <td class="py-2 pr-3">{{ scopeOf(policy) }}</td>
                    <td class="py-2 pr-3">{{ policy.role ?? t('guardian.admin.policies.any_role') }}</td>
                    <template v-if="edits[policy.id]">
                      <td class="py-2 pr-3">
                        <input v-model="edits[policy.id]!.required" type="checkbox" data-testid="guardian-policy-required">
                      </td>
                      <td class="py-2 pr-3">
                        <div class="flex flex-wrap gap-2">
                          <label v-for="method in POLICY_METHODS" :key="method" class="flex items-center gap-1">
                            <input v-model="edits[policy.id]!.methods" type="checkbox" :value="method" :data-testid="`guardian-policy-method-${method}`">
                            {{ t(`guardian.admin.policies.methods.${method}`) }}
                          </label>
                        </div>
                      </td>
                      <td class="py-2 pr-3">
                        <UInput v-model.number="edits[policy.id]!.grace_days" type="number" min="0" max="3650" class="w-20" data-testid="guardian-policy-grace" />
                      </td>
                    </template>
                    <td class="py-2 text-right whitespace-nowrap">
                      <UButton size="xs" variant="soft" data-testid="guardian-policy-save" @click="save(policy)">{{ t('guardian.admin.save') }}</UButton>
                      <UButton size="xs" color="error" variant="ghost" data-testid="guardian-policy-delete" @click="destroy(policy)">{{ t('guardian.admin.delete') }}</UButton>
                    </td>
                  </tr>
                </tbody>
              </table>

              <GuardianPager :current="paging.current" :last="paging.last" testid="guardian-policies" @go="go" />

              <UCard>
                <template #header>
                  <h2 class="font-medium">{{ t('guardian.admin.policies.new') }}</h2>
                </template>
                <form class="space-y-3" data-testid="guardian-policy-form" @submit.prevent="add">
                  <div class="flex flex-wrap items-end gap-3">
                    <UFormField :label="t('guardian.admin.policies.fields.scope_type')">
                      <select v-model="form.scope_type" class="w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-policy-new-scope-type">
                        <option value="">{{ t('guardian.admin.policies.everyone') }}</option>
                        <option v-for="scope in scopeTypes" :key="scope.key" :value="scope.type">{{ scope.key }}</option>
                      </select>
                    </UFormField>
                    <UFormField v-if="form.scope_type" :label="t('guardian.admin.policies.fields.scope_id')" required>
                      <UInput v-model="form.scope_id" class="w-32" data-testid="guardian-policy-new-scope-id" />
                    </UFormField>
                    <UFormField :label="t('guardian.admin.policies.fields.role')">
                      <select v-model="form.role" class="w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-policy-new-role">
                        <option value="">{{ t('guardian.admin.policies.any_role') }}</option>
                        <option v-for="role in roles" :key="role.slug" :value="role.slug">{{ role.name }}</option>
                      </select>
                    </UFormField>
                    <UFormField :label="t('guardian.admin.policies.fields.grace_days')">
                      <UInput v-model.number="form.grace_days" type="number" min="0" max="3650" class="w-24" data-testid="guardian-policy-new-grace" />
                    </UFormField>
                  </div>
                  <div class="flex flex-wrap items-center gap-4 text-sm">
                    <label class="flex items-center gap-1">
                      <input v-model="form.required" type="checkbox" data-testid="guardian-policy-new-required">
                      {{ t('guardian.admin.policies.fields.required') }}
                    </label>
                    <span class="text-muted">{{ t('guardian.admin.policies.fields.methods') }}:</span>
                    <label v-for="method in POLICY_METHODS" :key="method" class="flex items-center gap-1">
                      <input v-model="form.methods" type="checkbox" :value="method" :data-testid="`guardian-policy-new-method-${method}`">
                      {{ t(`guardian.admin.policies.methods.${method}`) }}
                    </label>
                  </div>
                  <p class="text-xs text-muted">{{ t('guardian.admin.policies.methods_hint') }}</p>
                  <GuardianErrors :action="create" testid="guardian-policy-create" />
                  <UButton type="submit" icon="i-lucide-plus" :loading="create.busy.value" data-testid="guardian-policy-new-submit">{{ t('guardian.admin.policies.create') }}</UButton>
                </form>
              </UCard>
            </div>
          </GuardianState>
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
