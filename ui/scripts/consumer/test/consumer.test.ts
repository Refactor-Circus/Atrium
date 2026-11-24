import { describe, expect, it } from 'vitest'
import { AtriumScreen } from '@refactor-circus/atrium'
import { mountSuspended } from '@refactor-circus/atrium/testing'
import ConsumerPanel from '../src/components/ConsumerPanel.vue'

/*
 * The SDK installed as a module installs it (packed, under
 * node_modules/.pnpm/…/node_modules/@refactor-circus/atrium): its own
 * components render the `Atrium*` and `U*` components they use.
 */
describe('the installed SDK', () => {
  it('renders the module\'s tags and the SDK components\' own', async () => {
    const wrapper = await mountSuspended(ConsumerPanel)

    expect(wrapper.find('[data-testid="consumer-alert"]').text()).toContain('From the module')
    expect(wrapper.find('[data-testid="atrium-no-access"]').text()).toContain('Locked')
    expect(wrapper.find('[data-testid="atrium-state"]').text()).toContain('Nothing yet')
    expect(wrapper.html()).not.toMatch(/<(uicon|ualert|atrium[a-z-]*)[\s>]/i)
  })

  it('renders an SDK component imported from the package', async () => {
    const screen = await mountSuspended(AtriumScreen, { props: { screen: null } })

    expect(screen.html()).not.toMatch(/<(uskeleton|utabs|uicon|ualert|atrium[a-z-]*)[\s>]/i)
  })

  it('never reaches the network', async () => {
    await expect(fetch('/consumer/api/anything')).rejects.toThrow('tests never reach the network')
  })
})
