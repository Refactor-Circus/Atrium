import { describe, expectTypeOf, it } from 'vitest'
import type {
  AtriumDashboardResponse,
  AtriumSettingsIndexResponse,
  AtriumSettingsPanelResponse,
  AtriumShellResponse
} from '../app/types/atrium'
import dashboard from './fixtures/dashboard.json'
import screen from './fixtures/screen.json'
import screenTab from './fixtures/screen-tab.json'
import settings from './fixtures/settings.json'
import shell from './fixtures/shell.json'

/*
 * The PHP suite writes these payloads from the API itself
 * (tests/Feature/Api/ContractFixturesTest.php). Each must satisfy the type
 * the layer reads it as, so a contract change fails here until the types
 * follow it.
 */

describe('the API contract fixtures', () => {
  it('shell.json is a shell response', () => {
    expectTypeOf(shell satisfies AtriumShellResponse).toExtend<AtriumShellResponse>()
  })

  it('dashboard.json is a dashboard response', () => {
    expectTypeOf(dashboard satisfies AtriumDashboardResponse).toExtend<AtriumDashboardResponse>()
  })

  it('screen.json and screen-tab.json are settings panel responses with their screen', () => {
    expectTypeOf(screen satisfies AtriumSettingsPanelResponse).toExtend<AtriumSettingsPanelResponse>()
    expectTypeOf(screenTab satisfies AtriumSettingsPanelResponse).toExtend<AtriumSettingsPanelResponse>()
  })

  it('settings.json is the settings list response with its screen', () => {
    expectTypeOf(settings satisfies AtriumSettingsIndexResponse).toExtend<AtriumSettingsIndexResponse>()
  })
})
