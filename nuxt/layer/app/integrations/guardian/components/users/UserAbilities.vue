<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import { guardianData, useGuardianLoad } from '../two-factor/guardian'
import { blankToNull, type GuardianScopeType, type GuardianUserAbilities } from '../access/access'

/**
 * What one user may do (AC 90): `guardian.users.abilities.index`, globally
 * or, with a scope type and id, in that scope.
 */
const props = defineProps<{ user: string, scopeTypes: GuardianScopeType[] }>()

const { t } = useI18n()
const form = reactive({ scope_type: '', scope_id: '' })
const applied = ref<{ scope_type: string | null, scope_id: string | null }>({ scope_type: null, scope_id: null })

const query = computed(() => ({ user: props.user, ...applied.value }))

const { data, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<{ data: GuardianUserAbilities }>(await guardian.GET('/users/{user}/abilities', {
    params: {
      path: { user: props.user },
      query: applied.value.scope_type ? { scope_type: applied.value.scope_type, scope_id: applied.value.scope_id } : {}
    }
  })).data, query)

function apply(): void {
  const scopeType = blankToNull(form.scope_type)

  applied.value = { scope_type: scopeType, scope_id: scopeType === null ? null : blankToNull(form.scope_id) }
}
</script>

<template>
  <UCard data-testid="guardian-user-abilities">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.abilities') }}</h2>
    </template>
    <div class="space-y-3">
      <form class="flex flex-wrap items-end gap-3" data-testid="guardian-abilities-scope" @submit.prevent="apply">
        <UFormField :label="t('guardian.access.assignments.fields.scope_type')">
          <select v-model="form.scope_type" class="w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-abilities-scope-type">
            <option value="">{{ t('guardian.access.scopes.global') }}</option>
            <option v-for="scope in scopeTypes" :key="scope.key" :value="scope.type">{{ scope.key }}</option>
          </select>
        </UFormField>
        <UFormField v-if="form.scope_type" :label="t('guardian.access.assignments.fields.scope_id')">
          <UInput v-model="form.scope_id" class="w-32" data-testid="guardian-abilities-scope-id" />
        </UFormField>
        <UButton type="submit" size="sm" variant="soft" data-testid="guardian-abilities-apply">{{ t('guardian.access.user.show_abilities') }}</UButton>
      </form>
      <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status" compact>
        <p v-if="data?.super_admin" data-testid="guardian-abilities-super">{{ t('guardian.access.user.super_admin') }}</p>
        <p v-else-if="(data?.abilities ?? []).length === 0" class="text-sm text-muted">{{ t('guardian.access.user.no_abilities') }}</p>
        <ul v-else class="flex flex-wrap gap-1" data-testid="guardian-abilities-list">
          <li v-for="ability in data?.abilities ?? []" :key="ability"><UBadge color="neutral" variant="subtle"><code>{{ ability }}</code></UBadge></li>
        </ul>
      </GuardianState>
    </div>
  </UCard>
</template>
