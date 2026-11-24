/*
 * The layer's Nuxt UI defaults: the compact "command deck" (D-077). Smaller
 * controls by default, tighter panels, uppercase micro-labels and monospace
 * badges; colours stay with the theme (atrium.css bridges a theme's tokens
 * to Nuxt UI's variables). Hosts override any of it in their own
 * app.config.ts, which Nuxt merges over this one.
 */
const compact = { defaultVariants: { size: 'sm' as const } }

export default defineAppConfig({
  atrium: {
    // Rendered in place of an icon no installed collection has. Hosts may
    // set another in their own app.config.ts.
    fallbackIcon: 'i-lucide-circle-help'
  },

  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'slate'
    },

    // Buttons and fields stay `md` (13px text) with tighter padding: 28px tall.
    button: {
      slots: {
        base: 'font-medium transition-[color,background-color,box-shadow] duration-150'
      },
      variants: {
        size: {
          xs: { base: 'px-1.5 py-0.5 text-xs gap-1', leadingIcon: 'size-3.5', trailingIcon: 'size-3.5' },
          sm: { base: 'px-2 py-1 text-xs gap-1.5', leadingIcon: 'size-3.5', trailingIcon: 'size-3.5' },
          md: { base: 'px-2.5 py-1 text-sm gap-1.5', leadingIcon: 'size-4', trailingIcon: 'size-4' }
        }
      },
      compoundVariants: [
        { color: 'primary', variant: 'solid', class: 'shadow-[0_0_14px_-6px_var(--ui-primary)] hover:shadow-[0_0_20px_-5px_var(--ui-primary)]' },
        { color: 'neutral', variant: 'outline', class: 'bg-(--atrium-field) ring-(color:--atrium-control-ring)' }
      ]
    },
    input: {
      variants: {
        size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
        variant: { outline: 'bg-(--atrium-field) ring-(color:--atrium-control-ring)' }
      }
    },
    textarea: {
      variants: {
        size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
        variant: { outline: 'bg-(--atrium-field) ring-(color:--atrium-control-ring)' }
      }
    },
    select: {
      variants: {
        size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
        variant: { outline: 'bg-(--atrium-field) ring-(color:--atrium-control-ring)' }
      }
    },
    selectMenu: {
      variants: {
        size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
        variant: { outline: 'bg-(--atrium-field) ring-(color:--atrium-control-ring)' }
      }
    },
    checkbox: compact,
    radioGroup: compact,
    switch: compact,
    fileUpload: compact,
    pinInput: compact,
    formField: {
      slots: {
        root: 'text-xs',
        label: 'font-medium text-toned text-xs',
        container: 'mt-1 relative',
        help: 'mt-1 text-muted',
        error: 'mt-1 text-error'
      }
    },
    kbd: {
      base: 'font-mono',
      defaultVariants: { size: 'sm' as const, variant: 'outline' as const }
    },
    badge: {
      slots: { base: 'font-mono font-medium tracking-[0.02em] rounded-[3px] whitespace-nowrap' },
      defaultVariants: { size: 'sm' as const, variant: 'subtle' as const }
    },
    avatar: compact,
    tabs: {
      slots: { trigger: 'font-medium', list: 'gap-1' },
      ...compact
    },
    dropdownMenu: compact,
    contextMenu: compact,
    tooltip: {
      slots: { content: 'h-6 px-2 text-xs ring-(--ui-border-accented) bg-elevated' }
    },
    card: {
      slots: {
        root: 'atrium-card rounded-[calc(var(--ui-radius)*1.5)] overflow-hidden',
        header: 'px-3 py-2 sm:px-3.5 min-h-9 flex items-center',
        body: 'p-3 sm:p-3.5',
        footer: 'px-3 py-2 sm:px-3.5'
      },
      variants: {
        variant: {
          outline: { root: 'bg-default ring-0 divide-y divide-default' }
        }
      }
    },
    alert: {
      slots: {
        root: 'rounded-[calc(var(--ui-radius)*1.5)] px-3 py-2.5 gap-2',
        title: 'text-sm font-medium',
        description: 'text-sm',
        icon: 'size-4 mt-px'
      }
    },
    modal: {
      slots: {
        overlay: 'bg-(--atrium-canvas)/70 backdrop-blur-sm',
        content: 'atrium-card ring-0 divide-y divide-default rounded-[calc(var(--ui-radius)*2)]',
        header: 'px-4 py-3 min-h-11',
        body: 'p-4',
        footer: 'px-4 py-3',
        title: 'text-sm font-semibold'
      }
    },
    slideover: {
      slots: {
        overlay: 'bg-(--atrium-canvas)/70 backdrop-blur-sm',
        content: 'ring-(--ui-border)'
      }
    },
    popover: {
      slots: { content: 'ring-(--ui-border-accented) shadow-xl shadow-black/20' }
    },
    commandPalette: {
      slots: {
        root: 'divide-(--ui-border)',
        input: '[&>input]:h-11 [&>input]:text-sm',
        label: 'atrium-label px-2 py-1.5',
        item: 'py-1.5 text-sm data-highlighted:before:bg-(--atrium-tint)',
        itemLeadingIcon: 'size-4',
        itemTrailingKbds: 'font-mono',
        empty: 'py-8 text-sm text-muted'
      }
    },
    skeleton: {
      base: 'rounded-(--ui-radius) bg-elevated'
    },
    separator: {
      slots: { border: 'border-default' }
    },
    dashboardPanel: {
      slots: {
        root: 'atrium-dashboard-panel relative flex flex-col min-w-0 min-h-0 flex-1 shrink',
        body: 'flex flex-col gap-3 flex-1 overflow-y-auto p-3.5 sm:px-4 lg:px-5 lg:py-4 pb-8'
      }
    },
    dashboardNavbar: {
      slots: {
        root: 'h-12 shrink-0 flex items-center justify-between border-b-0 px-3.5 sm:px-4 lg:px-5 pt-1 gap-1.5 bg-transparent',
        title: 'flex items-center gap-1.5 font-semibold text-[0.9375rem] tracking-tight text-highlighted truncate',
        toggle: 'hidden'
      }
    }
  }
})
