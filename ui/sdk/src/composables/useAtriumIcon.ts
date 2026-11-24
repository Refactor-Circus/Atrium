import { atriumIconOptions, iconInstalled } from '../runtime/icons'

/** Atrium's icon names: Iconify names in the `i-{collection}-{icon}` form. */
const ICONIFY_NAME = /^i-[a-z0-9]+(-[a-z0-9]+)+$/

/**
 * Icons from the API are Iconify names (`i-lucide-house`). One renders when
 * its collection is installed with the app (Lucide ships with Atrium;
 * modules and hosts add packs with `addAtriumIcons()`), or when the host
 * opted in to the Iconify API (`atrium.icons.remote`). Anything else - an
 * unknown collection, a v1 icon name, inline SVG - renders the fallback
 * icon instead of failing.
 */
export function useAtriumIcon() {
  function isKnown(icon: string): boolean {
    if (!ICONIFY_NAME.test(icon)) {
      return false
    }

    return atriumIconOptions().remote || iconInstalled(icon)
  }

  /** The name to render for an icon: itself when known, else the fallback. */
  function resolve(icon: string | null | undefined): string | undefined {
    if (!icon) {
      return undefined
    }

    return isKnown(icon) ? icon : atriumIconOptions().fallback
  }

  return { isKnown, resolve }
}
