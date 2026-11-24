import { atriumModule } from '@refactor-circus/atrium/vite'

// Roster's Atrium module: `pnpm build` writes dist/atrium (committed), `pnpm test` runs Vitest.
export default atriumModule({ key: 'roster', inputs: ['src', 'client', 'package.json', 'vite.config.ts', '../../sdk/css', '../../sdk/vite'], test: { setupFiles: ['test/setup.ts'] } })
