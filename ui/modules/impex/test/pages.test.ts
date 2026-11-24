import type { Component } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteRecordNormalized } from 'vue-router'
import { screens } from '../src/atrium'
import fixture from '@refactor-circus/atrium/fixtures/integrations/impex.json'
import { settle } from '@refactor-circus/atrium/testing'
import { watchPackageApis } from '@refactor-circus/atrium/testing'
import { atriumApi, leaveImpex, resetImpex } from './support'
import { clearAtriumData, mockAtriumApi, mountSuspended, useRouter } from '@refactor-circus/atrium/testing'

/*
 * Impex's pages against what `ImpexIntegration` declares (AC 49, 56): the
 * PHP test writes the declarations to `fixtures/integrations/impex.json`;
 * every declared screen has a page at its declared path, `screens` maps each
 * key to that page's route, and each page asks `atrium.screens.show` with
 * its key, its record and the open tab.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

/** A route path as the declarations write it: `/impex/runs/:run`. */
function declaredPath(path: string): string {
  return path.replace(/\(\)/g, '')
}

function routeNamed(name: string): RouteRecordNormalized | undefined {
  return useRouter().getRoutes().find(route => route.name === name)
}

async function pageOf(route: RouteRecordNormalized): Promise<Component> {
  const component = route.components?.default

  // Nuxt loads page components lazily.
  return typeof component === 'function' && !('setup' in component || 'render' in component)
    ? ((await (component as () => Promise<{ default: Component }>)()).default)
    : component as Component
}

describe('the Impex pages', () => {
  it('declare ten screens, all of them mapped', () => {
    expect(fixture.screens).toHaveLength(10)
    expect(Object.keys(screens).sort()).toEqual(fixture.screens.map(screen => screen.key).sort())
  })

  it.each(fixture.screens)('render $key at $path', ({ key, path }) => {
    const route = routeNamed(screens[key]!)

    expect(route, `${key} has no page named ${screens[key]}`).toBeDefined()
    expect(declaredPath(route!.path)).toBe(path)
  })

  it('link every nav item to a declared screen', () => {
    const paths = fixture.screens.map(screen => screen.path)

    for (const item of fixture.navigation) {
      expect(paths).toContain(item.link.path)
    }
  })
})

describe('each Impex page\'s screen', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it.each(fixture.screens)('asks atrium.screens.show for $key with its record and tab', async ({ key, path }) => {
    watchPackageApis(['impex'])
    clearAtriumData()

    const param = path.match(/:(\w+)$/)?.[1]
    const record = param === undefined ? undefined : `${param}-1`
    const url = `${param === undefined ? path : path.replace(`:${param}`, record!)}?tab=keen.activity`

    const page = await pageOf(routeNamed(screens[key]!)!)

    await useRouter().push(url)
    const wrapper = await mountSuspended(page, { route: url } as Parameters<typeof mountSuspended>[1])
    await settle()

    expect(api).toHaveBeenCalledWith(`/screens/${key}`, { query: { record, tab: 'keen.activity' } })

    wrapper.unmount()
  })
})
