<script setup lang="ts">
import type { GuardianPermission } from './access'

/**
 * The permission picker of the role forms: one checkbox per permission in
 * the catalogue, ticked when the role has it. The model is the ticked names.
 */
const props = defineProps<{ permissions: GuardianPermission[], idPrefix: string, error?: string }>()

const model = defineModel<string[]>({ required: true })

const { t } = useI18n()
</script>

<template>
  <fieldset class="space-y-2">
    <legend class="mb-1 text-sm font-medium">{{ t('guardian.access.roles.fields.permissions') }}</legend>
    <p v-if="props.permissions.length === 0" class="text-sm text-muted">{{ t('guardian.access.roles.no_permissions') }}</p>
    <div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <label v-for="permission in props.permissions" :key="permission.name" class="flex items-center gap-2 text-sm">
        <input v-model="model" type="checkbox" class="accent-(--ui-primary)" :value="permission.name" :data-testid="`${props.idPrefix}-permission-${permission.name}`">
        <code>{{ permission.name }}</code>
      </label>
    </div>
    <p v-if="props.error" class="text-sm text-error">{{ props.error }}</p>
  </fieldset>
</template>
