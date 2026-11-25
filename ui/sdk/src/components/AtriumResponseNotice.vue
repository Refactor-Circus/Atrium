<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { useAtrium } from '../registry'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

/**
 * The app-wide notices response handlers raise with `atrium.notify()`
 * (D-049), such as Guardian's two-factor deadline: one dismissible alert per
 * notice, above every shell page, each linking where it says.
 */
const atrium = useAtrium()
const { t, te } = useI18n()

const notices = computed(() => [...atrium.notices.entries()].map(([key, notice]) => ({ key, notice })))

function dismiss(key: string): void {
  atrium.dismiss(key)
}

function text(message: string, params: Record<string, string | number> = {}): string {
  return te(message) ? t(message, params) : message
}
</script>

<template>
  <div v-if="notices.length > 0" class="space-y-2 p-2" data-testid="atrium-response-notices">
    <UAlert
      v-for="{ key, notice } in notices"
      :key="key"
      :color="notice.color ?? 'warning'"
      variant="subtle"
      icon="i-lucide-info"
      :title="text(notice.message, notice.params)"
      :data-testid="`atrium-response-notice-${key}`"
    >
      <template #actions>
        <UButton v-if="notice.link" :to="notice.link.to" size="xs" :color="notice.color ?? 'warning'" variant="soft" data-testid="atrium-response-notice-link">
          {{ text(notice.link.label) }}
        </UButton>
        <UButton size="xs" :color="notice.color ?? 'warning'" variant="ghost" data-testid="atrium-response-notice-dismiss" @click="dismiss(key)">
          {{ t('atrium.notice.dismiss') }}
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
