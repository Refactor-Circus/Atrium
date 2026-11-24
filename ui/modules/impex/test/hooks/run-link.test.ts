import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import ImpexRunLink from '../../src/components/hooks/ImpexRunLink.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mountIntegration, resetPackageApis, watchPackageApis } from '@refactor-circus/atrium/testing'

/*
 * The Impex run link (AC 66): in `showroom.transfers`' `row.actions`, a link
 * to the row's run at `/impex/runs/:id`, with no request to Impex.
 */

enableAutoUnmount(afterEach)

describe('the Impex run-link hook', () => {
  afterEach(() => resetPackageApis())

  it('links to the row\'s run', async () => {
    const calls = watchPackageApis(['impex'])

    const wrapper = await mountIntegration(ImpexRunLink, 'impex', { props: { data: {}, record: '01JD7Z5K3W' } })
    await settle()

    expect(wrapper.find('[data-testid="hooks-impex-run-link"]').attributes('href')).toBe('/impex/runs/01JD7Z5K3W')
    expect(wrapper.text()).toContain('Run')
    expect(calls).toEqual([])
  })

  it('encodes the run id and takes a numeric one', async () => {
    const wrapper = await mountIntegration(ImpexRunLink, 'impex', { props: { data: {}, record: 12 } })

    expect(wrapper.find('[data-testid="hooks-impex-run-link"]').attributes('href')).toBe('/impex/runs/12')

    const odd = await mountIntegration(ImpexRunLink, 'impex', { props: { data: {}, record: 'a/b' } })

    expect(odd.find('[data-testid="hooks-impex-run-link"]').attributes('href')).toBe('/impex/runs/a%2Fb')
  })

  it('renders nothing outside a row', async () => {
    const wrapper = await mountIntegration(ImpexRunLink, 'impex', { props: { data: {}, record: null } })

    expect(wrapper.find('[data-testid="hooks-impex-run-link"]').exists()).toBe(false)
  })
})
