// Fails `composer test:ui` early when the API contract fixtures are missing.
// The PHP suite writes them (tests/Feature/Api/ContractFixturesTest.php), and
// Vitest checks the SDK's types and components against them, so without
// them the front end would be tested against nothing.

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('./fixtures/', import.meta.url))
const fixtures = ['shell.json', 'dashboard.json', 'screen.json', 'screen-tab.json', 'settings.json']
const missing = fixtures.filter(name => !existsSync(directory + name))

if (missing.length > 0) {
  console.error(`The API contract fixtures are missing from ui/sdk/test/fixtures: ${missing.join(', ')}.`)
  console.error('Write them with: UPDATE_FIXTURES=1 vendor/bin/pest tests/Feature/Api/ContractFixturesTest.php')
  process.exit(1)
}

console.log(`API contract fixtures present: ${fixtures.join(', ')}.`)
