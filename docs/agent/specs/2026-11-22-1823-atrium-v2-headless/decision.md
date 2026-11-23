# Factory decision

- Status: approved (run wf_d73cf5ed-97f, round 2, 2026-11-23). Gate green, no findings left, no nits.
- Brief: brief.md (Risk: high).
- After approval: `composer test:nuxt` was not part of the gate. It was run by hand and failed in the consumer build, because D-017 had not been applied. It was fixed by pinning `@nuxt/icon` 2.6.3, `@nuxt/fonts` 0.11.4, `@nuxtjs/color-mode` 3.5.2 and `tailwindcss` 4.3.5 in `nuxt/layer`. Both `composer test` and `composer test:nuxt` now pass.

## Breaks (impact check)

Every consumer failed against this job, and that is expected: v2 removes the Blade UI they use.
- Foundry: 44 tests fail with `Route [atrium.foundry.*] not defined`, because Atrium no longer registers Blade page routes.
- Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom: the install failed at `testbench package:purge-skeleton` while booting against v2. This is not diagnosed per package. The most likely cause is that their providers call removed v1 APIs.
- Guardian: Composer could not resolve its locked keystone version. This is an environment issue, not caused by this job.
- RingMaster: the impact check could not create a worktree (`invalid reference: main`). This is an environment issue.

The seven suite packages already have planned follow-up specs (shape.md). Foundry and Guardian are also Atrium consumers and need the same migration.
