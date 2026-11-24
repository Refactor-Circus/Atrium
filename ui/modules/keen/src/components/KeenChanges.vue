<script setup lang="ts">
import { changeRows } from './entries'

/**
 * An audit entry's field changes, as Keen's v1 `x-keen::audit.changes` showed
 * them: one row per field with its value before and after (PHP's
 * `var_export()` for scalars and null, JSON for the rest), or a line saying
 * nothing changed. Shared by the entry page and the Keen hooks.
 */
const props = defineProps<{ changes: Record<string, unknown> | null | undefined }>()

const { t } = useI18n()

const rows = computed(() => changeRows(props.changes))
</script>

<template>
  <p v-if="rows.length === 0" class="text-sm text-muted" data-testid="keen-no-changes">
    {{ t('keen.changes.none') }}
  </p>
  <div v-else class="overflow-x-auto">
    <table class="w-full text-sm" data-testid="keen-changes">
      <thead>
        <tr class="border-b border-default text-left text-muted">
          <th class="py-2 pe-4 font-medium">{{ t('keen.changes.field') }}</th>
          <th class="py-2 pe-4 font-medium">{{ t('keen.changes.before') }}</th>
          <th class="py-2 font-medium">{{ t('keen.changes.after') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="row in rows" :key="row.field" data-testid="keen-change">
          <td class="py-2 pe-4"><code>{{ row.field }}</code></td>
          <td class="py-2 pe-4 break-all" data-testid="keen-change-before">{{ row.before }}</td>
          <td class="py-2 break-all" data-testid="keen-change-after">{{ row.after }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
