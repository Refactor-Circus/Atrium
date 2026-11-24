import { createI18n, type Composer, type I18n } from 'vue-i18n'
import en from '../../locales/en.json'

/** Messages by locale: `{ en: { roster: { … } } }`. */
export type AtriumMessages = Record<string, Record<string, unknown>>

type AtriumI18n = I18n<Record<string, never>, Record<string, never>, Record<string, never>, string, false>

let i18n: AtriumI18n = make()

function make(): AtriumI18n {
  const options = {
    legacy: false as const,
    locale: 'en',
    fallbackLocale: 'en',
    // Atrium's strings, then each module's (addAtriumMessages). A host
    // locale missing some of them falls back to English.
    messages: { en } as unknown as Record<string, never>,
    missingWarn: false,
    fallbackWarn: false
  }

  return createI18n(options) as unknown as AtriumI18n
}

/** The page's vue-i18n instance: the app installs it, modules add to it. */
export function atriumI18n(): AtriumI18n {
  return i18n
}

/** A fresh instance with Atrium's own messages only, for tests. */
export function resetAtriumI18n(): AtriumI18n {
  i18n = make()

  return i18n
}

/**
 * The global composer (`t`, `te`, `locale`, …), usable anywhere: in a
 * search source or live resolver as well as a component, where
 * `useI18n()` returns the same composer.
 */
export function useAtriumI18n(): Composer {
  return i18n.global as unknown as Composer
}

/** Merges a module's messages into each locale they name. */
export function addAtriumMessages(messages: AtriumMessages): void {
  for (const [locale, tree] of Object.entries(messages)) {
    i18n.global.mergeLocaleMessage(locale, tree as never)
  }
}

/** The locales with messages, Atrium's `en` first. */
export function atriumLocales(): string[] {
  return [...i18n.global.availableLocales]
}

/** Switches to `locale` when there are messages for it; true when it did (or already was). */
export function setAtriumLocale(locale: string | null | undefined): boolean {
  if (!locale || !atriumLocales().includes(locale)) {
    return false
  }

  i18n.global.locale.value = locale

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }

  return true
}

/**
 * Deep-merges message trees, later ones winning: a module whose strings
 * are split over several files (`roster.en.json`, `roster-users.en.json`)
 * passes `{ en: mergeAtriumMessages(roster, rosterUsers) }`.
 */
export function mergeAtriumMessages(...trees: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}

  for (const tree of trees) {
    for (const [key, value] of Object.entries(tree)) {
      const current = merged[key]

      merged[key] = isTree(current) && isTree(value) ? mergeAtriumMessages(current, value) : value
    }
  }

  return merged
}

function isTree(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
