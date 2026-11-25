import { atriumModule } from '@refactor-circus/atrium/vite'

// The workbench app's own module: `pnpm build` writes dist/atrium (committed).
export default atriumModule({ key: 'demo', inputs: ['src', 'package.json', 'vite.config.ts', '../sdk/css', '../sdk/vite'] })
