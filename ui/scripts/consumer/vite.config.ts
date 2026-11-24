import { atriumModule } from '@refactor-circus/atrium/vite'

// A module as a package ships one, built and tested against the packed SDK.
export default atriumModule({ key: 'consumer', test: { setupFiles: ['test/setup.ts'] } })
