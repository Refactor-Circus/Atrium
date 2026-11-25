import { fileURLToPath } from 'node:url'
import { atriumTestConfig } from './vite/index.mjs'

// The SDK's own suite (and the app's, which it covers too), with the same
// config every module's suite uses. The package's specifiers point at its
// sources, as a module's resolve to them through its node_modules.
const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))
const config = atriumTestConfig({ include: ['test/**/*.test.ts'] })

export default {
  ...config,
  resolve: {
    ...config.resolve,
    alias: [
      { find: /^@refactor-circus\/atrium$/, replacement: src('index.ts') },
      { find: /^@refactor-circus\/atrium\/ui$/, replacement: src('ui.ts') },
      { find: /^@refactor-circus\/atrium\/testing$/, replacement: src('testing/index.ts') },
      { find: /^@refactor-circus\/atrium\/fixtures\/(.*)$/, replacement: fileURLToPath(new URL('./test/fixtures/$1', import.meta.url)) }
    ]
  }
}
