/** How Atrium's API version relates to the layer's. */
export type AtriumVersionMatch = 'equal' | 'minor' | 'major'

/**
 * Compares the shell's `api_version` (major.minor) with the layer's package
 * version. Only major and minor count; a missing or malformed API version
 * counts as a major mismatch.
 */
export function compareApiVersion(api: string | null | undefined, layer: string): AtriumVersionMatch {
  const theirs = majorMinor(api)
  const ours = majorMinor(layer)

  if (!theirs || !ours || theirs[0] !== ours[0]) {
    return 'major'
  }

  return theirs[1] === ours[1] ? 'equal' : 'minor'
}

/** `2.0.3` and `2.0` as `2.0`. */
export function atriumMajorMinor(version: string | null | undefined): string | null {
  const parts = majorMinor(version)

  return parts ? parts.join('.') : null
}

function majorMinor(version: string | null | undefined): [number, number] | null {
  const match = /^(\d+)\.(\d+)/.exec(version ?? '')

  return match ? [Number(match[1]), Number(match[2])] : null
}
