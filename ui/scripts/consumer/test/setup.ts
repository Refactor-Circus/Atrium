import { afterEach, expect, vi } from 'vitest'
import { useTestModule } from '@refactor-circus/atrium/testing'
import Consumer from '../src/atrium'

useTestModule(Consumer)

// An unresolved `<AtriumScreen>` or `<UAlert>` is only a Vue warning; here it fails the test.
const warnings: string[] = []

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  warnings.push(args.map(String).join(' '))
})

afterEach(() => {
  expect(warnings.splice(0).filter(warning => warning.includes('Failed to resolve component'))).toEqual([])
})
