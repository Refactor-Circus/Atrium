# Decisions

## D-001

- **Question:** Create the GitHub issue as drafted in ticket-draft.md, or redraft it?
- **Choice:** Create as drafted
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** ticket

## D-002

- **Question:** How should the --prefer-lowest process-driver failures be fixed?
- **Choice:** Raise require-dev floors past the releases that emit the notices
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** shape

## D-003

- **Question:** Confirm the standards for this spec: architecture/dependencies and testing/test-layers?
- **Choice:** Confirm both
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** shape

## D-004

- **Question:** If a require-dev constraint cannot lift symfony/translation (a Laravel runtime dependency) past the notice-emitting release, may Atrium add a conflict entry that also constrains host applications?
- **Choice:** No: use only require-dev floors (raise nesbot/carbon or Laravel dev floors if needed); stop and escalate if that cannot work
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** spec-review

## D-005

- **Question:** Should a lowest-dependency CI job be added to guard against regression?
- **Choice:** Rely on the existing prefer-lowest entry in the .github/workflows/tests.yml matrix; no workflow change
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** spec-review

## D-006

- **Question:** Approve the spec for Fix SearchTest process-driver failures under --prefer-lowest as written?
- **Choice:** Approve as written
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** approval

## D-007

- **Question:** The lowest resolution has a third PHP 8.5 notice source, amphp/socket v2.2.0, which criterion 6 does not list. Accept a require-dev floor of amphp/socket ^2.3.1?
- **Choice:** Accept the amphp/socket require-dev floor and amend criterion 6
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build

## D-008

- **Question:** Commit or stash these main changes before the build?
- **Choice:** Commit them on main first, then build
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build

## D-009

- **Question:** Commit or stash these main changes before the build?
- **Choice:** Neither: relaunch the build
- **Rationale:** Prepare no longer counts other jobs spec folders as dirty (Ringside PR #6), so the folder it found does not block the build. Commit or stash nothing; relaunch the factory.
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build

## D-010

- **Question:** Ringside PR #6 is still open, so the installed factory still blocks on another job's spec folder. How should this build get past it?
- **Choice:** Merge Ringside PR #6 and run composer update in Atrium, then relaunch
- **Rationale:** PR #6 was already merged (2026-10-28T05:13:33Z); `composer update refactor-circus/ringside` moved Ringside to 61d8674.
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build

## D-011

- **Question:** The factory workflow script fails to launch: the Workflow tool rejects import() at ring-master-factory.js line 32. How should this build proceed?
- **Choice:** Fix the factory script in Ringside (no dynamic import), then composer update and relaunch
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build

## D-012

- **Question:** The fix (the require-dev floors) already landed on main in fba14da, so this job branch has no code diff, only an empty verification commit. How should this job finish?
- **Choice:** Close the spec as already satisfied on main (fba14da), with the verification recorded in build.md, and open no PR
- **Rationale:** none given
- **Date:** 2026-10-28 (answered in RingMaster)
- **Raised by:** build
