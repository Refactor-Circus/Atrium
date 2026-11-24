import { afterEach, describe, expect, it } from 'vitest'
import CortexSettingsPanel from '../src/components/CortexSettingsPanel.vue'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { mockPackageApi, mountIntegration, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { cortexCalls, settingsSummary } from './support'
import { useAtrium } from '@refactor-circus/atrium'

/*
 * The `cortex` settings panel (AC 61): registered under its v1 key, it
 * renders Cortex's `settings-summary` endpoint as the v1 panel rows did,
 * and a 403 as no access.
 */

describe('the cortex settings panel', () => {
  afterEach(() => resetPackageApis())

  it('is registered under the cortex key', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.panels.get('cortex')).toBe(CortexSettingsPanel)
  })

  it('renders cortex.settings-summary.show: the counts and the cache', async () => {
    mockPackageApi('cortex', { 'GET /settings-summary': { data: settingsSummary } as never })

    const wrapper = await mountIntegration(CortexSettingsPanel, 'cortex', { props: { data: {} } })
    await settle()

    expect(cortexCalls('GET', '/settings-summary')).toHaveLength(1)
    expect(wrapper.find('[data-testid="cortex-stat-providers"]').text()).toContain('2')
    expect(wrapper.find('[data-testid="cortex-stat-tools"]').text()).toContain('9')
    expect(wrapper.find('[data-testid="cortex-stat-agents"]').text()).toContain('4')
    expect(wrapper.find('[data-testid="cortex-stat-servers"]').text()).toContain('1')
    expect(wrapper.find('[data-testid="cortex-cache"]').attributes('data-status')).toBe('enabled')
  })

  it('shows a disabled cache', async () => {
    mockPackageApi('cortex', { 'GET /settings-summary': { data: { ...settingsSummary, cache_enabled: false } } as never })

    const wrapper = await mountIntegration(CortexSettingsPanel, 'cortex', { props: { data: {} } })
    await settle()

    expect(wrapper.find('[data-testid="cortex-cache"]').attributes('data-status')).toBe('disabled')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /settings-summary': reply(403) })

    const wrapper = await mountIntegration(CortexSettingsPanel, 'cortex', { props: { data: {} } })
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
