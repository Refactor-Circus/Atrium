import type { AtriumLink } from '../types/atrium'

/** The link props a nav item or search result renders with. */
export interface AtriumLinkProps {
  to: string
  external?: true
  target?: '_blank'
  rel?: 'noopener noreferrer'
}

/**
 * Turns an API `link` into link props, or null for none. The server's
 * ClientPath already refuses unsafe URLs; this refuses them again, so the
 * layer only ever follows a path inside the SPA (`/…`, never `//host` or
 * `/\host`) or an absolute http(s) URL. External links open in a new tab
 * with `rel="noopener noreferrer"`.
 */
export function atriumLink(link: AtriumLink | null | undefined): AtriumLinkProps | null {
  if (!link || !isFollowable(link.path)) {
    return null
  }

  if (link.external) {
    return { to: link.path, external: true, target: '_blank', rel: 'noopener noreferrer' }
  }

  return { to: link.path }
}

function isFollowable(path: string): boolean {
  if (/^https?:\/\/[^/\\\s]/i.test(path)) {
    return true
  }

  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}
