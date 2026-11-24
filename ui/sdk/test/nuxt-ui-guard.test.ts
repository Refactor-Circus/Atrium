import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { rawHtmlElements, rawHtmlIn, vueFilesIn } from '../src/testing/index'

/*
 * Atrium's components compose Nuxt UI (D-091): no SDK component, layout or
 * core page renders a raw interactive element Nuxt UI provides. Buttons are
 * <UButton>, fields <UInput>/<USelect>/<UTextarea>, tables <UTable>,
 * disclosures <UCollapsible> and links <UButton to>, <ULink> or, for an API
 * link that may be external, <AtriumLink> (the one file allowed an <a href>).
 * The same check every module runs over its own `src` with `rawHtmlIn()`
 * (D-093).
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url
const ui = fileURLToPath(new URL('../../', here))

describe('Atrium components compose Nuxt UI', () => {
  it('finds the SDK components, layouts and core pages', () => {
    expect(vueFilesIn(join(ui, 'sdk/src')).length + vueFilesIn(join(ui, 'app/src')).length).toBeGreaterThan(30)
  })

  it('renders no raw interactive element in the SDK (but <AtriumLink>\'s <a href>)', () => {
    expect(rawHtmlIn(join(ui, 'sdk/src'), { 'components/AtriumLink.vue': ['<a href>'] })).toEqual([])
  })

  it('renders no raw interactive element in the app', () => {
    expect(rawHtmlIn(join(ui, 'app/src'))).toEqual([])
  })

  it('catches each raw element it guards against', () => {
    expect(rawHtmlElements('<template><button type="button">x</button></template>')).toEqual(['<button>'])
    expect(rawHtmlElements('<input v-model="q"><select></select><textarea />')).toEqual(['<input>', '<select>', '<textarea>'])
    expect(rawHtmlElements('<table><tr /></table> <details><summary>x</summary></details>')).toEqual(['<table>', '<details>'])
    expect(rawHtmlElements('<a :href="url">x</a>')).toEqual(['<a href>'])
    expect(rawHtmlElements('<a :href="url">x</a>', ['<a href>'])).toEqual([])
    expect(rawHtmlElements('<UButton to="/x" /><UInput /><UTable /><abbr>x</abbr>')).toEqual([])
    expect(rawHtmlElements('<template><!-- <button> --><UButton /></template>')).toEqual([])
  })

  it('reports each offending file of a folder, relative to it, with what it may keep', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atrium-guard-'))

    try {
      mkdirSync(join(dir, 'pages'))
      writeFileSync(join(dir, 'pages/index.vue'), '<template><table /><UButton /></template>')
      writeFileSync(join(dir, 'Link.vue'), '<template><a :href="to">x</a></template>')
      writeFileSync(join(dir, 'Clean.vue'), '<script setup lang="ts">const button = "<button>"</script><template><UInput /></template>')

      expect(rawHtmlIn(dir)).toEqual([
        { file: 'Link.vue', elements: ['<a href>'] },
        { file: 'pages/index.vue', elements: ['<table>'] }
      ])
      expect(rawHtmlIn(dir, { 'Link.vue': ['<a href>'] })).toEqual([{ file: 'pages/index.vue', elements: ['<table>'] }])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
