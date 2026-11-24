import { useTestModule } from '@refactor-circus/atrium/testing'
import Cortex from '../src/atrium'

// Cortex's registrations, strings and routes, in every test file's app.
useTestModule(Cortex)
