# Factory decision

- Status: approved (run wf_4d1ed09c-9a1, round 2, 2026-11-23). Gate green, no findings left, no nits. Brief: brief.md (Risk: high).
- Verified by hand after the run: `composer test` (phpstan, pint, type coverage, Pest 1357/1357) and `composer test:nuxt` (frozen install, client check, typecheck, build, Vitest 121 files / 1135 tests, consumer build) both green, with `ATRIUM_SUITE_PATH` pointing at the seven package v2 job worktrees (D-040).
- Not pushed (user: build locally, do not push).
- Release blockers: D-020, where the layer vendors the package client types instead of git dependencies on v2 tags (needs your review), and the package v2 tags, which don't exist yet.
