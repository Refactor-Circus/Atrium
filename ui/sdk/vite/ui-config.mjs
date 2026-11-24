/*
 * Atrium's Nuxt UI theme: the compact "command deck" (D-077, D-078, D-091).
 * Smaller controls by default, tighter panels, uppercase micro-labels and
 * monospace badges, glass panels with lit edges. Every Atrium* component is
 * composed from Nuxt UI components, so this file (slot classes, variants and
 * default variants per component) is where the deck's look lives; atrium.css
 * holds only the theme tokens these classes read (`--atrium-*`, bridged from
 * a theme's `--atrium-token-*`) and a little global styling.
 *
 * It is compiled into Atrium's build (Nuxt UI's Vite plugin bakes it into
 * the shared components), and into every module's test run, so a module's
 * tests render what the page renders. Modules never change it: Nuxt UI is
 * shared, one theme for the whole page.
 *
 * Tailwind reads the classes straight from this file (atrium.css has it as
 * a `@source`): write every class out in full, never build one from parts.
 */
const compact = { defaultVariants: { size: 'sm' } }

const tones = ['primary', 'secondary', 'success', 'info', 'warning', 'error']

/** A glass panel: translucent surface, a sheen along the top, a hairline ring and corner brackets. */
const glass = 'bg-(color:--atrium-glass) bg-(image:--atrium-sheen) backdrop-blur-(--atrium-blur) backdrop-saturate-130 shadow-(--atrium-panel-shadow) after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:[background:var(--atrium-brackets)]'

/** A ruler of ticks along a panel head's lower edge. */
const ruler = 'relative after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-px after:h-1 after:bg-(image:--atrium-ruler) after:mask-[linear-gradient(90deg,transparent,#000_60%)] after:opacity-80'

/** The deck's uppercase micro-label (section names, column heads, captions). */
const label = 'font-mono text-[0.65625rem] leading-4 font-medium tracking-[0.08em] uppercase text-muted'

/** A deck field: a recessed well with a hairline and a lit focus. */
const field = 'bg-(--atrium-field) ring-(color:--atrium-control-ring) shadow-[inset_0_-1px_0_var(--ui-border-accented)] focus-visible:shadow-[0_0_0_3px_var(--atrium-glow-soft),0_0_18px_-6px_var(--ui-primary)]'

// An error or warning alert reads as a fault line on the deck: a lit edge,
// scanlines and the tone's glow. `--tone` is set per colour below.
const fault = 'relative ps-3.5 text-highlighted bg-(image:--atrium-fault) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tone)_35%,transparent),0_0_24px_-16px_var(--tone)] before:absolute before:start-0 before:inset-y-1.5 before:w-0.5 before:bg-(--tone) before:shadow-[0_0_10px_var(--tone)]'
const faultTones = { error: '[--tone:var(--ui-error)]', warning: '[--tone:var(--ui-warning)]' }
const faults = Object.entries(faultTones).flatMap(([color, tone]) => ['subtle', 'soft', 'outline'].map(variant => ({ color, variant, class: { root: `${tone} ${fault}`, icon: 'text-(--tone)' } })))

// A coloured badge is a status: a glowing dot and a label, not a box (D-078).
const signal = 'gap-1.5 ps-0 pe-0.5 bg-transparent ring-0 shadow-none text-[0.6875rem] tracking-[0.04em] before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:shadow-[0_0_0_2px_color-mix(in_oklab,currentColor_18%,transparent),0_0_8px_currentColor]'
// `soft` stays a tinted chip (codes, deltas).
const signals = tones.flatMap(color => ['subtle', 'outline'].map(variant => ({ color, variant, class: signal })))

export const atriumUiConfig = {
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
      // Primary: a luminous solid with an inner highlight and a glow.
      { color: 'primary', variant: 'solid', class: 'bg-(image:--atrium-gloss) shadow-(--atrium-lit-button) hover:shadow-(--atrium-lit-button-hover) text-shadow-[0_1px_0_rgb(0_0_0/0.12)]' },
      // Secondary: a hairline ghost with corner accents.
      { color: 'primary', variant: 'outline', class: 'bg-(color:--atrium-field) bg-(image:--atrium-corners) ring-(color:--atrium-control-ring) text-highlighted hover:bg-(color:--atrium-tint)' },
      { color: 'neutral', variant: 'outline', class: 'bg-(color:--atrium-field) bg-(image:--atrium-corners) ring-(color:--atrium-control-ring) hover:bg-(color:--atrium-tint)' }
    ]
  },
  input: {
    variants: {
      size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
      variant: { outline: field }
    }
  },
  textarea: {
    variants: {
      size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
      variant: { outline: field }
    }
  },
  select: {
    variants: {
      size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
      variant: { outline: field }
    }
  },
  selectMenu: {
    variants: {
      size: { md: { base: 'px-2.5 py-1 text-sm gap-1.5' } },
      variant: { outline: field }
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
    defaultVariants: { size: 'sm', variant: 'outline' }
  },
  badge: {
    slots: { base: 'font-mono font-medium tracking-[0.02em] rounded-[3px] whitespace-nowrap' },
    compoundVariants: signals,
    defaultVariants: { size: 'sm', variant: 'subtle' }
  },
  chip: {
    slots: { base: 'ring-0' },
    defaultVariants: { size: 'sm' }
  },
  avatar: compact,
  user: compact,
  tabs: {
    slots: {
      trigger: 'font-mono text-[0.6875rem] uppercase tracking-[0.1em]',
      list: 'gap-1',
      indicator: 'shadow-[0_0_10px_var(--ui-primary)]'
    },
    ...compact
  },
  dropdownMenu: compact,
  contextMenu: compact,
  tooltip: {
    slots: { content: `h-6 px-2 ring-(--ui-border-accented) bg-elevated border-s-2 border-primary shadow-[0_8px_24px_-8px_rgb(0_0_0/0.5),-6px_0_14px_-8px_var(--atrium-glow)] ${label} text-highlighted` }
  },
  card: {
    slots: {
      root: `atrium-panel relative rounded-[calc(var(--ui-radius)*1.5)] ${glass}`,
      header: `${ruler} px-3 py-2 sm:px-3.5 min-h-9 flex items-center`,
      body: 'p-3 sm:p-3.5',
      footer: 'px-3 py-2 sm:px-3.5'
    },
    variants: {
      variant: {
        outline: { root: 'ring-0 divide-y divide-default' }
      }
    }
  },
  pageCard: {
    slots: {
      root: `atrium-panel rounded-[calc(var(--ui-radius)*1.5)] ${glass}`,
      container: 'p-3 sm:p-3.5 gap-y-2',
      leading: 'mb-0 grid size-9 place-items-center rounded-(--ui-radius) bg-(image:--atrium-socket) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-primary)_35%,transparent)]',
      leadingIcon: 'size-5',
      title: 'text-sm font-medium',
      description: 'text-xs'
    },
    variants: {
      variant: {
        outline: { root: 'ring-0' },
        subtle: { root: 'ring-0' }
      }
    }
  },
  pageGrid: {
    base: 'gap-3 lg:grid-cols-3 xl:grid-cols-4'
  },
  pageHeader: {
    slots: {
      root: 'border-b-0 py-0',
      wrapper: 'lg:items-start gap-3',
      headline: `${label} mb-0.5`,
      title: 'text-[1.1875rem] leading-[1.625rem] font-semibold tracking-[-0.022em]',
      description: 'text-sm',
      links: 'gap-1.5'
    },
    variants: {
      title: { true: { description: 'mt-0.5' } }
    }
  },
  empty: {
    slots: {
      root: 'gap-3 rounded-[calc(var(--ui-radius)*1.5)] bg-(image:--atrium-grid-paper) border border-dashed border-accented',
      avatar: 'bg-(image:--atrium-socket) text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-primary)_35%,transparent),0_0_24px_-10px_var(--atrium-glow)]',
      title: 'font-semibold',
      description: 'text-muted'
    },
    variants: {
      variant: {
        outline: { root: 'ring-0 bg-(color:--atrium-glass)' }
      }
    },
    defaultVariants: { size: 'sm' }
  },
  alert: {
    compoundVariants: faults,
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
      content: `ring-0 divide-y divide-default rounded-[calc(var(--ui-radius)*2)] ${glass}`,
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
      input: '[&>input]:h-11 [&>input]:text-sm [&>input]:caret-primary',
      label: `${label} px-2 py-1.5`,
      item: 'py-1.5 text-sm data-highlighted:before:bg-(--atrium-tint)',
      itemLeadingIcon: 'size-4',
      itemTrailingKbds: 'font-mono',
      empty: 'py-8 text-sm text-muted'
    }
  },
  // ⌘K: a heads-up overlay with a lit top edge.
  dashboardSearch: {
    slots: {
      modal: 'sm:max-w-2xl sm:h-[min(30rem,72vh)] top-[12vh] sm:top-[14vh] translate-y-0 ring-0 bg-(color:--atrium-hud) backdrop-blur-xl backdrop-saturate-140 shadow-(--atrium-hud-shadow) before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,var(--ui-primary),transparent)] before:shadow-[0_0_12px_var(--atrium-glow)]'
    }
  },
  dashboardSearchButton: {
    slots: {
      base: 'h-7 ps-2 pe-1 text-muted',
      trailing: 'flex'
    }
  },
  skeleton: {
    base: 'relative overflow-hidden rounded-(--ui-radius) bg-elevated/70 animate-none shadow-[inset_0_0_0_1px_var(--ui-border)] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--ui-primary)_18%,transparent),transparent)] after:animate-[atrium-scan_1.4s_var(--atrium-ease)_infinite]'
  },
  separator: {
    slots: { border: 'border-default' }
  },
  // Module tables read as the deck (D-093): tracked mono caps for heads, 34px
  // rows, a lit edge on the first column and on the hovered row, links in
  // cells highlighted. What atrium.css once did for raw `<table>`s.
  table: {
    slots: {
      base: 'text-[0.78125rem] leading-[1.125rem] tabular-nums',
      th: 'h-7.5 px-2.5 py-1.5 font-mono text-[0.625rem] leading-4 font-medium tracking-[0.12em] uppercase whitespace-nowrap text-start text-muted bg-[color-mix(in_oklab,var(--ui-bg)_92%,var(--atrium-canvas))] first:shadow-[inset_2px_0_0_color-mix(in_oklab,var(--ui-primary)_70%,transparent)]',
      td: 'h-8.5 px-2.5 py-1.25 text-[0.78125rem] leading-[1.125rem] align-middle [&_a:not(.inline-flex)]:text-highlighted [&_a:not(.inline-flex):hover]:text-primary [&_a:not(.inline-flex):hover]:[text-shadow:0_0_12px_var(--atrium-glow-soft)]',
      tbody: '[&>tr]:transition-colors [&>tr]:duration-150 [&>tr:hover]:bg-(--atrium-row-hover) [&>tr:hover>td:first-child]:shadow-[inset_2px_0_0_var(--ui-primary)] [&>tr]:data-[selectable=true]:focus-visible:outline-primary',
      separator: 'bg-(--atrium-control-ring)',
      empty: 'py-6 text-center font-mono text-[0.71875rem] tracking-[0.04em] text-muted'
    }
  },
  navigationMenu: {
    slots: {
      link: 'text-[0.8125rem] font-normal text-toned',
      linkLeadingIcon: 'size-3.5 opacity-80',
      linkTrailingBadge: 'h-4 min-w-4.5 px-1 py-0 justify-center rounded-[3px] ring font-mono text-[0.625rem] tabular-nums text-primary bg-(--atrium-tint) ring-[color-mix(in_oklab,var(--ui-primary)_35%,transparent)]',
      linkTrailingIcon: 'size-3.5',
      label: label
    },
    compoundVariants: [
      { orientation: 'vertical', collapsed: false, class: { link: 'min-h-7 px-2 py-1', childList: 'ms-3 ps-0', childItem: 'ps-1.5' } },
      // The open page: a lit bar on its edge, the primary wash behind it.
      { orientation: 'vertical', active: true, class: { link: 'text-highlighted before:bg-(image:--atrium-active) after:absolute after:start-0 after:inset-y-1.5 after:w-0.5 after:rounded-full after:bg-primary after:shadow-[0_0_10px_var(--atrium-glow)]', linkLeadingIcon: 'text-primary opacity-100' } }
    ]
  },
  breadcrumb: {
    slots: {
      link: 'text-[0.8125rem]',
      separatorIcon: 'size-3 text-dimmed'
    }
  },
  dashboardGroup: {
    base: 'bg-(--atrium-canvas) bg-(image:--atrium-canvas-image) isolate'
  },
  // The navigation's sidebar: a rail spine and the section panel beside it.
  dashboardSidebar: {
    slots: {
      root: 'min-w-0 border-e-0 bg-transparent',
      body: 'flex-row gap-0 p-0 overflow-hidden',
      content: 'w-auto max-w-[calc(100vw-3rem)]'
    },
    variants: {
      // The slideover holds the rail and panel alone: no header row above them.
      menu: { true: { header: 'hidden', body: 'p-0 sm:p-0' } }
    }
  },
  dashboardPanel: {
    slots: {
      root: 'atrium-dashboard-panel relative flex flex-col min-w-0 min-h-0 flex-1 shrink lg:not-last:border-e-0',
      body: 'flex flex-col gap-3 sm:gap-3 flex-1 overflow-y-auto p-3.5 sm:p-3.5 sm:px-4 lg:px-5 lg:py-4 pb-8'
    }
  },
  dashboardNavbar: {
    slots: {
      root: 'h-12 shrink-0 flex items-center justify-between border-b-0 px-3.5 sm:px-4 lg:px-5 pt-1 gap-1.5 bg-transparent',
      title: 'flex items-center gap-1.5 font-semibold text-[0.9375rem] tracking-tight text-highlighted truncate',
      toggle: 'hidden'
    }
  },
  dashboardToolbar: {
    slots: {
      root: 'min-h-10 px-3.5 sm:px-4 lg:px-5 border-default'
    }
  }
}
