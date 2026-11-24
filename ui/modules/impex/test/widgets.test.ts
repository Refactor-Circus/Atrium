import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MessageVolumeWidget from '../src/components/MessageVolumeWidget.vue'
import RecentFailuresWidget from '../src/components/RecentFailuresWidget.vue'
import RunStatusWidget from '../src/components/RunStatusWidget.vue'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, mockPackageApi, mountIntegration, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { callsTo, failedRun, stats } from './support'
import { useAtrium } from '@refactor-circus/atrium'

/*
 * The Impex widgets (AC 60): `impex.run-status`, `impex.recent-failures` and
 * `impex.message-volume` keep their v1 keys, are sent with `data: {}`, and
 * read `impex.stats.show`: one request per dashboard load for all three
 * (D-029). A 403 renders the no-access card, any other failure the error
 * card, and `message-volume` renders nothing when `messages` is null.
 */

const Dashboard = defineComponent({
  setup: () => () => h('div', [
    h(RunStatusWidget, { data: {} }),
    h(RecentFailuresWidget, { data: {} }),
    h(MessageVolumeWidget, { data: {} })
  ])
})

type Wrapper = Awaited<ReturnType<typeof mountIntegration>>

let mounted: Wrapper[] = []

async function mountDashboard(): Promise<Wrapper> {
  const wrapper = await mountIntegration(Dashboard, 'impex')
  await settle()
  mounted.push(wrapper)

  return wrapper
}

describe('the Impex widgets', () => {
  beforeEach(() => {
    resetPackageApis()
  })

  afterEach(() => {
    // Leaving the dashboard lets the next load ask again.
    for (const wrapper of mounted) {
      wrapper.unmount()
    }

    mounted = []
    resetPackageApis()
  })

  it('are registered under their v1 keys', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.widgets.get('impex.run-status')).toBe(RunStatusWidget)
    expect(atrium.widgets.get('impex.recent-failures')).toBe(RecentFailuresWidget)
    expect(atrium.widgets.get('impex.message-volume')).toBe(MessageVolumeWidget)
  })

  it('share one impex.stats.show request for all three', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: stats } })

    await mountDashboard()

    expect(callsTo(calls, 'GET', '/stats')).toHaveLength(1)
  })

  it('ask again on the next dashboard load', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: stats } })

    const first = await mountDashboard()
    first.unmount()
    mounted = []
    await mountDashboard()

    expect(callsTo(calls, 'GET', '/stats')).toHaveLength(2)
  })

  it('show runs by status and how many are active', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: stats } })

    const wrapper = await mountDashboard()

    expect(wrapper.find('[data-testid="impex-run-status-running"]').text()).toContain('2')
    expect(wrapper.find('[data-testid="impex-run-status-failed"]').text()).toContain('3')
    expect(wrapper.find('[data-testid="impex-run-status-active"]').text()).toContain('3')
  })

  it('list recent failures, each linking to its run', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: stats } })

    const wrapper = await mountDashboard()

    expect(wrapper.find(`[data-testid="impex-failure-${failedRun.id}"]`).attributes('href')).toBe('/impex/runs/run-2')
  })

  it('show the message volume in and out', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: stats } })

    const wrapper = await mountDashboard()

    expect(wrapper.find('[data-testid="impex-message-volume-inbound"]').text()).toBe('12')
    expect(wrapper.find('[data-testid="impex-message-volume-outbound"]').text()).toBe('34')
  })

  it('hide the message volume when messages is null', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: { ...stats, messages: null } } })

    const wrapper = await mountDashboard()

    expect(wrapper.find('[data-testid="impex-message-volume"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="atrium-error-card"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="impex-run-status"]').text()).toContain('3')
  })

  it('render the no-access card on a 403', async () => {
    mockPackageApi('impex', { 'GET /stats': reply(403) })

    const wrapper = await mountDashboard()

    expect(wrapper.findAll('[data-testid="atrium-no-access"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="atrium-error-card"]').exists()).toBe(false)
  })

  it('render the error card on any other failure', async () => {
    mockPackageApi('impex', { 'GET /stats': reply(500) })

    const wrapper = await mountDashboard()

    expect(wrapper.findAll('[data-testid="atrium-error-card"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(false)
  })

  it('make no request while Impex is not active', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: stats } })

    const wrapper = await mountIntegration(Dashboard, 'impex', { integrations: [integrationEntry('impex', { active: false })] })
    await settle()
    mounted.push(wrapper)

    expect(calls).toEqual([])
  })
})
