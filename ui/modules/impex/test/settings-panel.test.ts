import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SettingsPanel from '../src/components/SettingsPanel.vue'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { mockPackageApi, mountIntegration, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { callsTo, settingsSummary } from './support'
import { useAtrium } from '@refactor-circus/atrium'

/*
 * The `impex` settings panel (AC 61): it keeps its v1 key, is sent with
 * `data: {}`, and renders `impex.settings-summary.show` in the rows the v1
 * panel showed: retention, limits and artifact storage.
 */

describe('the impex settings panel', () => {
  beforeEach(() => {
    resetPackageApis()
  })

  afterEach(() => {
    resetPackageApis()
  })

  it('is registered under its v1 key', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.panels.get('impex')).toBe(SettingsPanel)
  })

  it('renders impex.settings-summary.show in v1\'s rows', async () => {
    const calls = mockPackageApi('impex', { 'GET /settings-summary': { data: settingsSummary } })

    const wrapper = await mountIntegration(SettingsPanel, 'impex', { props: { data: {} } })
    await settle()

    expect(callsTo(calls, 'GET', '/settings-summary')).toHaveLength(1)
    expect(wrapper.find('[data-testid="impex-settings-retention"] [data-row="completed_runs_days"]').text()).toContain('30 days')
    expect(wrapper.find('[data-testid="impex-settings-retention"] [data-row="failed_runs_days"]').text()).toContain('90 days')
    expect(wrapper.find('[data-testid="impex-settings-limits"] [data-row="max_step_seconds"]').text()).toContain('300 seconds')
    expect(wrapper.find('[data-testid="impex-settings-limits"] [data-row="max_resumptions"]').text()).toContain('50')
    expect(wrapper.find('[data-testid="impex-settings-artifacts"] [data-row="disk"]').text()).toContain('The default disk')
    expect(wrapper.find('[data-testid="impex-settings-artifacts"] [data-row="path"]').text()).toContain('impex/artifacts')
    expect(wrapper.find('[data-testid="impex-settings-artifacts"] [data-row="preview_bytes"]').text()).toContain('2048 bytes')
  })

  it('names the artifact disk when one is set', async () => {
    mockPackageApi('impex', { 'GET /settings-summary': { data: { ...settingsSummary, artifacts: { ...settingsSummary.artifacts, disk: 's3' } } } })

    const wrapper = await mountIntegration(SettingsPanel, 'impex', { props: { data: {} } })
    await settle()

    expect(wrapper.find('[data-row="disk"]').text()).toContain('s3')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /settings-summary': reply(403) })

    const wrapper = await mountIntegration(SettingsPanel, 'impex', { props: { data: {} } })
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
