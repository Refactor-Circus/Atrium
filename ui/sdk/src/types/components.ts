/*
 * Props shared by the SDK's Atrium* components, exported for modules.
 */

/** One fact of an <AtriumDetails> list. */
export interface AtriumDetailsItem {
  /** Names the item's slot and default test id. */
  key?: string
  label: string
  value?: string | number | boolean | null
  /** Monospaced, tabular figures (IDs, hashes, counts). */
  mono?: boolean
  /** Makes the value a link: a path or an http(s) URL. */
  href?: string | null
  /** Spans every column (with `columns` 2 or 3). */
  wide?: boolean
  /** The value's `data-testid` (on its `<dd>`); default `atrium-details-{key}`. */
  testid?: string
  /** The link's own `data-testid` when the item has an `href` (D-094). */
  linkTestid?: string
  /** Attributes for the item's row element, which carries `data-row` = `key` (D-094). */
  rowAttrs?: Record<string, string | number | boolean | undefined>
}
