<script setup lang="ts">
/**
 * Recovery codes, shown once (AC 87): Guardian answers them on the first
 * confirmed factor and on a regeneration, and never again. They can be
 * copied, or downloaded as a `.txt` file made in the browser; they are never
 * stored or logged, and are gone once the user is done.
 */
const props = defineProps<{ codes: string[] }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const copied = ref(false)

const text = computed(() => `${props.codes.join('\n')}\n`)

async function copy(): Promise<void> {
  await navigator.clipboard?.writeText(text.value)
  copied.value = true
}

function download(): void {
  const url = URL.createObjectURL(new Blob([text.value], { type: 'text/plain' }))
  const link = document.createElement('a')

  link.href = url
  link.download = 'recovery-codes.txt'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard data-testid="guardian-recovery-codes">
    <template #header>
      <h3 class="font-medium">{{ t('guardian.two_factor.recovery.title') }}</h3>
    </template>
    <p class="mb-3 text-sm text-muted">{{ t('guardian.two_factor.recovery.once') }}</p>
    <ul class="mb-3 grid grid-cols-2 gap-1 font-mono text-sm">
      <li v-for="code in codes" :key="code" data-testid="guardian-recovery-code">{{ code }}</li>
    </ul>
    <div class="flex flex-wrap gap-2">
      <UButton icon="i-lucide-copy" color="neutral" variant="soft" data-testid="guardian-recovery-copy" @click="copy">
        {{ copied ? t('guardian.two_factor.recovery.copied') : t('guardian.two_factor.recovery.copy') }}
      </UButton>
      <UButton icon="i-lucide-download" color="neutral" variant="soft" data-testid="guardian-recovery-download" @click="download">
        {{ t('guardian.two_factor.recovery.download') }}
      </UButton>
      <UButton data-testid="guardian-recovery-done" @click="emit('done')">{{ t('guardian.two_factor.recovery.done') }}</UButton>
    </div>
  </UCard>
</template>
