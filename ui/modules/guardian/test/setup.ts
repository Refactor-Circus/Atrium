import { useTestModule } from '@refactor-circus/atrium/testing'
import Guardian from '../src/atrium'

// Guardian's registrations, strings and routes, in every test file's app.
useTestModule(Guardian)
