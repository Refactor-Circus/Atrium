<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UPageHeader from '@nuxt/ui/components/PageHeader.vue'
import type { ButtonProps, PageHeaderProps } from '@nuxt/ui'
import { computed, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

/**
 * A page's header in the deck's style (D-077), Nuxt UI's <UPageHeader>: an
 * optional overline (the section, a record type) as its headline, the
 * title, a description or `meta` line, and the page's actions on the right
 * (default slot, or `links`, <UPageHeader>'s buttons).
 *
 * D-093: `back` (a path or route) puts a back button before the title
 * (`back-label` names it, "Back" by default), or the `leading` slot puts
 * anything there. Slots: `title` replaces the title's content, so a status
 * badge can sit beside it (`<template #title>{{ run.flow }} <UBadge … /></template>`,
 * still in the `<h1>`), `headline` the overline, `description` the
 * description, `meta` a line after it, and the default slot the actions.
 * `data-testid` is `atrium-page-header` unless the page passes its own.
 *
 * D-094: `ui` is <UPageHeader>'s, merged slot by slot with the header's own
 * classes (later wins through tailwind-merge), never replacing them:
 * `:ui="{ root: 'border-none py-0' }"` drops the border and padding,
 * `:ui="{ title: 'max-w-xl' }"` keeps the title's truncation and adds to it.
 */
const props = defineProps<{
  title?: string | null
  overline?: string | null
  description?: string | null
  links?: ButtonProps[]
  back?: RouteLocationRaw | null
  backLabel?: string | null
  /** <UPageHeader>'s slot classes, merged with the header's own per slot. */
  ui?: PageHeaderProps['ui']
}>()

const slots = useSlots()
const { t } = useI18n()

/** Whether the title is more than its text: a back button, a leading slot, or the title slot. */
const composed = computed(() => !!props.back || !!slots.leading || !!slots.title)

/** The header's own slot classes, then the page's for each slot. */
const ui = computed<PageHeaderProps['ui']>(() => ({
  ...props.ui,
  title: [composed.value ? 'flex min-w-0 flex-wrap items-center gap-2' : 'truncate', props.ui?.title]
}))
</script>

<template>
  <UPageHeader
    data-testid="atrium-page-header"
    :headline="props.overline ?? undefined"
    :title="props.title ?? undefined"
    :description="props.description ?? undefined"
    :links="props.links"
    :ui="ui"
  >
    <template v-if="$slots.headline" #headline>
      <slot name="headline" />
    </template>
    <template v-if="composed" #title>
      <slot name="leading">
        <UButton
          v-if="props.back"
          :to="props.back"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          square
          :aria-label="props.backLabel ?? t('atrium.page_header.back')"
          data-testid="atrium-page-header-back"
        />
      </slot>
      <slot name="title">
        <span class="truncate">{{ props.title }}</span>
      </slot>
    </template>
    <template v-if="$slots.meta || $slots.description" #description>
      <slot name="description">
        <p v-if="props.description">{{ props.description }}</p>
      </slot>
      <slot name="meta" />
    </template>
    <template v-if="$slots.default" #links>
      <slot />
    </template>
  </UPageHeader>
</template>
