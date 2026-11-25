<script setup lang="ts">
import type { SelectItem, SelectValue } from '@refactor-circus/atrium/ui'

// Leans on the preset's resolver for its own tags, as every module does; the
// SDK components it renders must not lean on it for theirs.
const open = ref(true)

// D-094: vue-tsc checks that the SDK's components take Nuxt UI's own types,
// SelectItem[] (whose values include bigint) and groups of them.
const scope = ref<SelectValue>(null)
const scopes: SelectItem[] = [{ label: 'Team', value: 'team' }, { type: 'separator' }, { label: 'Org', value: 'org' }]
const grouped: SelectItem[][] = [[{ label: 'Small', value: 1n }], [{ type: 'label', label: 'Large' }, { label: 'Big', value: 1000n }]]
const size = ref<SelectValue>(1n)
</script>

<template>
  <div class="p-4" data-testid="consumer-panel">
    <AtriumPageHeader title="Consumer" :ui="{ root: 'border-none py-0', title: 'max-w-xl' }" data-testid="consumer-header" />
    <UAlert v-if="open" title="From the module" data-testid="consumer-alert" />
    <AtriumNoAccess title="Locked" />
    <AtriumState icon="i-lucide-inbox" title="Nothing yet" />
    <AtriumSelect v-model="scope" :items="scopes" blank="Global" :blank-value="null" data-testid="consumer-scope" />
    <AtriumSelect v-model="size" :items="grouped" data-testid="consumer-size" />
    <!-- A field row: the SDK's theme gives a label-less control its offset (mt-field-label, h-field). -->
    <div class="flex items-start gap-2" data-testid="consumer-field-row">
      <UFormField label="Name"><UInput /></UFormField>
      <div class="mt-field-label h-field flex items-center"><UCheckbox label="Active" /></div>
    </div>
    <AtriumDetails :items="[{ key: 'constructor', label: 'Constructor', value: 'Object', href: '/x', linkTestid: 'consumer-link', rowAttrs: { 'data-source': 'env' } }]" />
  </div>
</template>
