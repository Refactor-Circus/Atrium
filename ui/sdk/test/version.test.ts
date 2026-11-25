import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compareApiVersion } from '../src/utils/atriumVersion'
import layer from '../package.json'
import { ATRIUM_SDK_VERSION, AtriumVersionBanner, useAtriumShellStore } from '../src/index'
import { mountSuspended, shell, withSetup } from '../src/testing/index'

describe('compareApiVersion()', () => {
  it('compares major.minor only', () => {
    expect(compareApiVersion('2.0', '2.0.0')).toBe('equal')
    expect(compareApiVersion('2.0', '2.0.7')).toBe('equal')
    expect(compareApiVersion('2.1', '2.0.0')).toBe('minor')
    expect(compareApiVersion('2.0', '2.3.1')).toBe('minor')
    expect(compareApiVersion('3.0', '2.0.0')).toBe('major')
    expect(compareApiVersion('1.4', '2.0.0')).toBe('major')
  })

  it('treats a missing or malformed version as a major mismatch', () => {
    expect(compareApiVersion(undefined, '2.0.0')).toBe('major')
    expect(compareApiVersion('two', '2.0.0')).toBe('major')
  })
})

describe('AtriumVersionBanner', () => {
  let warn: ReturnType<typeof vi.spyOn>

  async function mountWith(apiVersion: string) {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell({ api_version: apiVersion })

    return mountSuspended(AtriumVersionBanner)
  }

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('knows its own version from ui/sdk/package.json', () => {
    expect(ATRIUM_SDK_VERSION).toBe(layer.version)
  })

  it('shows nothing when the API and the layer match', async () => {
    const wrapper = await mountWith('2.0')

    expect(wrapper.find('[data-testid="atrium-version-banner"]').exists()).toBe(false)
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns, in the console and a banner, on a minor mismatch', async () => {
    const wrapper = await mountWith('2.1')

    expect(wrapper.find('[data-testid="atrium-version-banner"]').text()).toContain('2.1')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('2.1'))
  })

  it('warns, in the console and a banner, on a major mismatch', async () => {
    const wrapper = await mountWith('3.0')

    expect(wrapper.find('[data-testid="atrium-version-banner"]').text()).toContain('3.0')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('3.0'))
  })

  it('can be dismissed, and never blocks the app', async () => {
    const wrapper = await mountWith('3.0')

    await wrapper.find('[data-testid="atrium-version-dismiss"]').trigger('click')

    expect(wrapper.find('[data-testid="atrium-version-banner"]').exists()).toBe(false)
  })
})
