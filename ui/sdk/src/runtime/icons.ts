import { _api, addCollection, iconLoaded, type IconifyJSON } from '@iconify/vue'
import lucide from '@iconify-json/lucide/icons.json'

export interface AtriumIconOptions {
  /** Rendered in place of an icon no installed collection has */
  fallback: string
  /** Fetch icons outside the installed collections from the Iconify API */
  remote: boolean
}

const options: AtriumIconOptions = {
  fallback: 'i-lucide-circle-help',
  remote: false
}

let installed = false

/**
 * Installs the icon collections the app bundles (Lucide, every icon, D-076)
 * and, unless the host opted in (`atrium.icons.remote`), cuts the Iconify
 * API off, so no icon request leaves the page. Idempotent.
 */
export function installAtriumIcons(overrides: Partial<AtriumIconOptions> = {}): void {
  Object.assign(options, overrides)

  if (!installed) {
    addCollection(lucide as IconifyJSON)
    installed = true
  }

  if (!options.remote) {
    _api.setFetch((() => Promise.reject(new Error('[atrium] The Iconify API is off (atrium.icons.remote).'))) as typeof fetch)
  }
}

/** Adds an icon collection (`@iconify-json/<set>/icons.json`), as a module or host bundles one. */
export function addAtriumIcons(collection: IconifyJSON): void {
  addCollection(collection)
}

export function atriumIconOptions(): Readonly<AtriumIconOptions> {
  return options
}

/** Whether an `i-{collection}-{icon}` name is in an installed collection. */
export function iconInstalled(icon: string): boolean {
  const parts = icon.replace(/^i-/, '').split('-')

  for (let split = 1; split < parts.length; split++) {
    if (iconLoaded(`${parts.slice(0, split).join('-')}:${parts.slice(split).join('-')}`)) {
      return true
    }
  }

  return false
}
