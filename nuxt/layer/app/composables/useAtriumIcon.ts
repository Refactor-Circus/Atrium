/** Atrium's icon names: Iconify names in the `i-{collection}-{icon}` form. */
const ICONIFY_NAME = /^i-[a-z0-9]+(-[a-z0-9]+)+$/

interface IconOptions {
  provider?: string | { server?: string, client?: string }
  fallbackToApi?: boolean | string
  collections?: string[] | null
}

/**
 * Icons from the API are Iconify names (`i-lucide-house`). One renders when
 * its collection is installed with the app (`@iconify-json/lucide` ships with
 * the layer; hosts add packs), or when the host opted in to the Iconify API
 * (`icon.fallbackToApi`). Anything else - an unknown collection, a v1 icon
 * name, inline SVG - renders the fallback icon instead of failing.
 */
export function useAtriumIcon() {
  const appConfig = useAppConfig()
  const iconOptions = (): IconOptions => (appConfig.icon ?? {}) as unknown as IconOptions

  function remote(): boolean {
    const options = iconOptions()
    const client = typeof options.provider === 'object' ? options.provider.client : options.provider

    return Boolean(options.fallbackToApi) || client === 'iconify'
  }

  function isKnown(icon: string): boolean {
    if (!ICONIFY_NAME.test(icon)) {
      return false
    }

    if (remote()) {
      return true
    }

    const collections = iconOptions().collections ?? []

    return collections.some(collection => icon.startsWith(`i-${collection}-`))
  }

  /** The name to render for an icon: itself when known, else the fallback. */
  function resolve(icon: string | null | undefined): string | undefined {
    if (!icon) {
      return undefined
    }

    return isKnown(icon) ? icon : appConfig.atrium.fallbackIcon
  }

  return { isKnown, resolve }
}
