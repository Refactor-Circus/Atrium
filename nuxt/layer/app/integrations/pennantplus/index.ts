// Not ported (D-032):
// - The "needs a Pennant store that uses the database driver" notice: no v2
//   route reports whether the store can list stored values, so on another
//   driver `values.index` simply answers an empty list.
// - The `row.actions` section slot on each stored value: `atrium.screens.show`
//   loads no records, so a stored value is not a row other packages can
//   extend. The screen's tabs and its `header.actions`, `before` and `after`
//   sections still render.

import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'

/**
 * PennantPlus (refactor-circus/pennantplus): one screen, the stored feature
 * flag values, at `/pennantplus/features`. It declares no widget, settings
 * panel, search source or live nav resolver, so it registers nothing on the
 * registry; its page calls PennantPlus's API through
 * `useAtriumIntegration('pennantplus')`.
 */
export const screens: Record<string, string> = {
  'pennantplus.features': 'pennantplus-features'
}

export default defineAtriumIntegration(() => {})
