<script setup lang="ts">
import type Sortable from 'sortablejs'
import type { AtriumDashboard, AtriumGrid, AtriumLayoutWidget, AtriumWidgetDefinition } from '../../types/atrium'

/**
 * A dashboard's widgets on a 12-column grid. In edit mode widgets reorder by
 * drag, resize by width and height, and are added or removed; Save hands the
 * full layout payload (atriumLayout: kept placements by uuid, new ones
 * without) to `save`, which the dashboard page wires to useAtriumDashboard.
 * Orphaned placements stay on the dashboard but are never sent: the server
 * keeps them whatever the payload says.
 */
const props = defineProps<{
  dashboard: AtriumDashboard
  editable: boolean
  save: (widgets: AtriumLayoutWidget[]) => Promise<void>
}>()

interface DraftPlacement {
  id: string
  uuid: string | null
  key: string
  component: string | null
  title: string | null
  grid: AtriumGrid
  settings: Record<string, unknown>
}

const { t } = useI18n()
const toast = useToast()

const editing = ref(false)
const picking = ref(false)
const saving = ref(false)
const draft = ref<DraftPlacement[]>([])
const grid = useTemplateRef<HTMLElement>('grid')
let sortable: Sortable | null = null
let added = 0

const placed = computed(() => atriumOrdered(props.dashboard.widgets ?? []))
const byUuid = computed(() => new Map(placed.value.map(p => [p.uuid, p])))

const cells = computed<DraftPlacement[]>(() => editing.value
  ? draft.value
  : placed.value.map(p => ({ id: p.uuid, uuid: p.uuid, key: p.key, component: p.component, title: p.title, grid: p.grid, settings: p.settings })))

function span(grid: AtriumGrid) {
  const width = atriumWidth(grid)
  const height = atriumHeight(grid)

  return { gridColumn: `span ${width} / span ${width}`, gridRow: `span ${height} / span ${height}` }
}

async function edit() {
  // A deep copy that works on reactive proxies, which structuredClone refuses.
  draft.value = JSON.parse(JSON.stringify(cells.value)) as DraftPlacement[]
  editing.value = true

  await nextTick()

  if (!grid.value || !editing.value) {
    return
  }

  sortable = await draggable(grid.value)
}

/** Drag to reorder; the width, height and remove controls work without it. */
async function draggable(element: HTMLElement): Promise<Sortable | null> {
  try {
    const { default: factory } = await import('sortablejs')

    return editing.value ? createSortable(factory, element) : null
  } catch {
    return null
  }
}

function createSortable(factory: typeof Sortable, element: HTMLElement): Sortable {
  return factory.create(element, {
    handle: '[data-drag]',
    animation: 150,
    onEnd: ({ item, from, oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return
      }

      // Put the node back where Vue rendered it, and let Vue move it.
      from.removeChild(item)
      from.insertBefore(item, from.children[oldIndex] ?? null)

      const [moved] = draft.value.splice(oldIndex, 1)
      draft.value.splice(newIndex, 0, moved!)
    }
  })
}

function stop() {
  sortable?.destroy()
  sortable = null
  editing.value = false
}

function add(widget: AtriumWidgetDefinition) {
  draft.value.push({
    id: `new-${++added}`,
    uuid: null,
    key: widget.key,
    component: widget.component,
    title: widget.label,
    grid: { row: null, column: null, width: widget.default_size.width, height: widget.default_size.height },
    settings: {}
  })
}

function remove(index: number) {
  draft.value.splice(index, 1)
}

async function submit() {
  saving.value = true

  try {
    await props.save(atriumLayout(draft.value.filter(p => p.component !== null)))
    stop()
  } catch {
    toast.add({ title: t('atrium.dashboard.save_failed'), color: 'error' })
  } finally {
    saving.value = false
  }
}

function pick() {
  picking.value = true
}

function startPicking() {
  void edit()
  pick()
}

const widths = [3, 4, 6, 8, 12].map(n => ({ label: `${n}/12`, value: n }))
const heights = computed(() => [1, 2, 3, 4].map(n => ({ label: t('atrium.dashboard.rows', { count: n }, n), value: n })))

onBeforeUnmount(() => sortable?.destroy())
</script>

<template>
  <div>
    <div v-if="editable" class="mb-4 flex justify-end gap-2">
      <template v-if="editing">
        <UButton icon="i-lucide-plus" variant="outline" data-testid="atrium-add-widget" @click="pick">
          {{ t('atrium.dashboard.add') }}
        </UButton>
        <UButton variant="ghost" data-testid="atrium-cancel-layout" @click="stop">
          {{ t('atrium.dashboard.cancel') }}
        </UButton>
        <UButton icon="i-lucide-check" :loading="saving" data-testid="atrium-save-layout" @click="submit">
          {{ t('atrium.dashboard.save') }}
        </UButton>
      </template>
      <UButton v-else icon="i-lucide-layout-grid" variant="outline" data-testid="atrium-edit-layout" @click="edit">
        {{ t('atrium.dashboard.edit') }}
      </UButton>
    </div>

    <div v-if="!cells.length" class="atrium-empty">
      <p>{{ t('atrium.dashboard.empty') }}</p>
      <UButton v-if="editable && !editing" class="mt-3" variant="soft" @click="startPicking">
        {{ t('atrium.dashboard.add_first') }}
      </UButton>
    </div>

    <div ref="grid" class="atrium-grid grid auto-rows-[8rem] grid-cols-12 gap-3" data-testid="atrium-grid">
      <div v-for="(cell, index) in cells" :key="cell.id" :style="span(cell.grid)" class="relative min-w-0">
        <div v-if="editing" class="absolute inset-x-2 top-2 z-10 flex items-center gap-1 rounded-md bg-default/90 p-1 shadow">
          <UIcon name="i-lucide-grip-vertical" class="size-4 cursor-grab text-muted" data-drag />
          <span class="truncate text-xs font-medium">{{ cell.title ?? cell.key }}</span>
          <span class="flex-1" />
          <template v-if="cell.component !== null">
            <USelect
              :model-value="atriumWidth(cell.grid)"
              :items="widths"
              size="xs"
              class="w-20"
              @update:model-value="cell.grid.width = Number($event)"
            />
            <USelect
              :model-value="atriumHeight(cell.grid)"
              :items="heights"
              size="xs"
              class="w-24"
              @update:model-value="cell.grid.height = Number($event)"
            />
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="error"
              variant="ghost"
              :aria-label="t('atrium.dashboard.remove_widget')"
              data-testid="atrium-remove-widget"
              @click="remove(index)"
            />
          </template>
        </div>
        <AtriumWidget v-if="cell.uuid && byUuid.get(cell.uuid)" :dashboard-slug="dashboard.slug" :placement="byUuid.get(cell.uuid)!" />
        <UCard v-else class="h-full">
          <p class="text-sm text-muted">{{ t('atrium.dashboard.pending_widget', { title: cell.title ?? cell.key }) }}</p>
        </UCard>
      </div>
    </div>

    <AtriumWidgetPicker v-model:open="picking" @pick="add" />
  </div>
</template>
