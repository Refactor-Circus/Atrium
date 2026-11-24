import { atriumModule } from '@refactor-circus/atrium/vite'

// PennantPlus's Atrium module: `pnpm build` writes dist/atrium (committed), `pnpm test` runs Vitest.
export default atriumModule({ key: 'pennantplus', inputs: ['src', 'client', 'package.json', 'vite.config.ts', '../../sdk/css', '../../sdk/vite'], test: { setupFiles: ['test/setup.ts'] } })
