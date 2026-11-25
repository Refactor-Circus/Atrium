<script setup lang="ts">
import AtriumDashboardGrid from './AtriumDashboardGrid.vue'
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue'
import UDashboardPanel from '@nuxt/ui/components/DashboardPanel.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAtriumDashboard } from '../composables/useAtriumDashboard'
import { useHead } from '@unhead/vue'
import { navigateTo } from '../runtime/context'

/**
 * The dashboard screen: the switcher, and the dashboard's grid. Without a
 * slug it shows the user's default dashboard, creating their first one when
 * they have none (useAtriumDashboard).
 */
const props = defineProps<{ slug?: string }>()

const { t } = useI18n()
const { page, list, dashboard, abilities, create, remove, saveLayout } = useAtriumDashboard(() => props.slug)

useHead({ title: () => dashboard.value?.name ?? t('atrium.dashboard.title') })

const naming = ref(false)
const newName = ref('')

const switcher = computed(() => [
  (list.data.value ?? []).map(d => ({
    label: d.name,
    to: d.is_default ? '/' : `/d/${encodeURIComponent(d.slug)}`,
    icon: d.slug === dashboard.value?.slug ? 'i-lucide-check' : undefined
  })),
  [{ label: t('atrium.dashboard.new'), icon: 'i-lucide-plus', onSelect: () => { naming.value = true } }]
])

async function submitNew() {
  const created = await create(newName.value || t('atrium.dashboard.untitled'))

  naming.value = false
  newName.value = ''
  await navigateTo(`/d/${encodeURIComponent(created.slug)}`)
}

async function destroy() {
  await remove()
  await navigateTo('/')
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="dashboard?.name ?? t('atrium.dashboard.title')">
        <template #right>
          <UDropdownMenu :items="switcher">
            <UButton
              icon="i-lucide-layout-dashboard"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
              data-testid="atrium-switcher"
            >
              {{ t('atrium.dashboard.switcher') }}
            </UButton>
          </UDropdownMenu>
          <UButton
            v-if="dashboard && abilities.delete && slug"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            :aria-label="t('atrium.dashboard.delete')"
            @click="destroy"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="page.status.value === 'pending'" class="grid grid-cols-12 gap-4">
        <USkeleton v-for="n in 4" :key="n" class="col-span-3 h-32" />
      </div>
      <UAlert v-else-if="page.error.value" color="error" :title="t('atrium.dashboard.load_failed')" />
      <AtriumDashboardGrid
        v-else-if="dashboard"
        :key="`${dashboard.slug}:${dashboard.version}`"
        :dashboard="dashboard"
        :editable="abilities.update"
        :save="saveLayout"
      />

      <UModal v-model:open="naming" :title="t('atrium.dashboard.new')">
        <template #body>
          <form class="flex gap-2" @submit.prevent="submitNew">
            <UInput v-model="newName" :placeholder="t('atrium.dashboard.name')" autofocus class="flex-1" />
            <UButton type="submit">{{ t('atrium.dashboard.create') }}</UButton>
          </form>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
