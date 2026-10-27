# Post-mortem: Stop using unserialize in SearchRegistry

## Summary

Spec 2026-10-25-0120-stop-unserialize-search-registry (issue #6, PR #7) was merged. `SearchRegistry` no longer calls `unserialize()`. Child processes now run a hidden Atrium command, `atrium:search-source`, which wraps the framework's `invoke-serialized-closure` and writes a JSON envelope. The parent decodes the envelope and drops malformed rows. The code was done after groups 1 and 2 (`949b7c9`, `a79bd1d`). Most of the elapsed work, four runs over two days, went on one environment problem: the `ringside check` gate could not run in the job worktree. Review found one minor issue. No human PR review comments were recorded.

## Metrics

- Rounds: 2 review rounds in the final run. The gate went red in rounds 1 to 3 of the earlier runs, all for the same reason.
- Runs: 4 factory runs (`wf_0dc550c6-3dc` twice, `wf_0088f0e6-06a`, `wf_9c350efd-a53`). Two escalations, one needs-decision, one approval.
- Decisions: 11 (D-001 to D-011). 10 came before build and 1 (D-011) was a build-time environment decision. Escalations: 3 (build agent returned no result, ringside missing, gate denied by the runner).
- Deviations: 4 recorded in group 1 and 2 in group 2, plus the unrequested `phpunit.xml.dist` edit.
- Findings: 1 minor (testing/test-layers). Plus 3 nits: the `AGENTS.md` drift, the test-time `testbench.yaml` rewrite and the uncommitted `docs/` edit.
- Final state: 347 tests (876 assertions), phpstan 0 errors, pint clean, 100% type coverage, `ringside check` passed.
- Empty commits: 3 (`7bcf656`, `707ea80` and `bf63f11`) that only record reruns.

## What went well

- The spec was well settled before build. `spec-review.md` closed the design gaps (exception hierarchy, final vs non-final failure class, how malformed rows are tested), and D-005 to D-009 answered the rest. No design question reappeared during build.
- All 12 acceptance criteria were mapped to named tests in the round-1 gate (`round-1/gate.md`).
- The build agent found real design consequences and recorded them as deviations. The most important: `task()` needed a `bool $throw` parameter. Without it, a source that threw in the child would be `report()`ed where the parent never sees it, so criterion 8 would be unmeetable.
- The output-buffering guard in the command (`ob_start()`/`ob_end_clean()` around the inner call) protects the stdout-only-envelope guarantee. It has a test.
- The `unserialize` guard is strong: the security preset has no `ignoring(...)` left, and an explicit `expect('unserialize')->not->toBeUsed()` was added.
- The final review round was clean from all four reviewers (code, security, standards, compat).

## What cost rounds

1. **Group 2 build agent returned no result** (run 1, round 0). The work was in the worktree but uncommitted. A later run reviewed it against tasks 2.1 to 2.4, verified it and committed it as it was. The cost was one escalation and a resume.
2. **`ringside check` could not run in the worktree** (run 1, round 1). The worktree was installed from the committed `composer.json`, which does not list `refactor-circus/ringside` or `refactor-circus/standards`. They live in the gitignored `composer.local.json` and are only present in the main checkout. This needed D-011.
3. **The runner denied the gate command** (run 3, rounds 1 to 3, `round-3/gate.md`). Even after D-011, the permission system refused the absolute-path `vendor/bin/ringside check`. A relative path ran against the main checkout instead, because the shell cwd resets. The gate reported CHANGES with "NOT RUN" three times. The only working form was `composer --working-dir=<worktree> exec ringside check`. The output was green by hand each time, so the rework rounds had no code change.
4. **A user note ended the loop**: "all blockers were push, go back and try again". Group 3 was an empty rerun, and then the four reviewers finally ran.
5. **One minor finding** (`3045384`): test placement under testing/test-layers. The command test moved to `tests/Feature/Console/`, and the exception tests moved to a new `tests/Unit/` suite. That meant a `phpunit.xml.dist` edit that was not in the finding.

## Root causes

- **tooling**: the worktree is created from committed `composer.json`, so `vendor/bin/ringside` is absent until the runner installs from `composer.local.json` (D-011). The permission layer then denied the gate command by absolute path. This caused most of the wasted rounds. Evidence: `build.md` "Rework round 1" and "Rework round 2"; meta.yml runs 2 and 3; `round-3/gate.md` Blockers.
- **tooling**: the build agent returned no result for group 2 and left uncommitted work, which forced an escalation. Evidence: meta.yml run 1.
- **tooling**: the ringside plugin install modifies `AGENTS.md` in the worktree. It was left uncommitted in every round and appeared as a nit in review.
- **standards_gap**: `testing/test-layers` places console tests under `tests/Feature/Console/` and pure-class tests under `tests/Unit/`. The repo had a flat `tests/Feature/` layout and no `tests/Unit/`. The standard and the repo disagreed, and the tasks followed the repo layout. Evidence: `build.md` group 1 deviation "Test location".
- **spec_gap**: the spec and tasks named `tests/Feature/InvokeSearchSourceCommandTest.php` and did not reconcile it with test-layers, even though D-004 selected that standard. The spec also did not mention the `sourceKey` property that errors/exceptions asks for, or the `bool $throw` parameter that criterion 8 needed. The agent resolved both correctly, but they were found at build time.
- **spec_gap**: the `docs/agent/standards/atrium/domains.md` update (exceptions and console folders) was not in the spec. The `docs/` folder is untracked, so the edit could not ship on the branch.
- **implementer_error**: the group 1 test location did not follow test-layers. This is minor, and the reviewer caught it.
- **reviewer_noise**: none. The one finding was valid.

## What human review caught

Nothing. There were no PR review comments or other review output from people, so there is no gap evidence for the standards, the reviewers or the gate in this job.

## Proposed follow-ups

- Make the worktree runner install from `composer.local.json` by default (D-011 as a standing behaviour), and allow `composer --working-dir=<worktree> exec ringside check` explicitly. Have the gate agent use that form so the gate cannot stay "NOT RUN".
- Let the gate tell "denied by the runner" apart from "failed", and escalate it once instead of looping three rounds.
- Make the ringside install not touch `AGENTS.md` in worktrees, or have the runner restore it afterwards.
- Reconcile the repo's flat `tests/Feature/` layout with testing/test-layers. Either add a `tests/Unit/` suite and a `Console/` convention to the repo's own standards, or note the exception in the standard. The `phpunit.xml.dist` Unit suite from this job is a start.
- Make `write-spec` check the test paths in tasks against the selected testing standards (D-004).
- Have the factory warn when a job needs to edit untracked `docs/` files, or put them in the branch.
- Open the downstream refresh jobs from D-005 (Cortex, Impex, Keen, PennantPlus, Polycart, Roster, Showroom) and drop the Cortex D-058 workaround.
- Replace the `useProcessDriver()` rewrite of the skeleton `bootstrap/cache/testbench.yaml` with something that cannot leave the file changed after a killed run.

## Pending proposals

Post-mortem workflow `wf_c58a5615-56c` (2026-10-26) produced these. The run was unattended, so none has been accepted, edited or rejected yet. Full proposed text is in the workflow output (`/private/tmp/claude-501/-Users-jay-Projects-packages-Atrium/722937b2-0792-4af5-9fc7-3460c476aed9/tasks/wpzs0u2yb.output`, `result.proposals`); rerunning the workflow with `resumeFromRunId: wf_c58a5615-56c` replays it from cache.

1. **testing/test-layers** (architectural, amend, target `global` → `docs/agent/standards-proposals/global/testing/test-layers.md`). Adds a Unit row (pure logic, exception factories) and a Console row (`tests/Feature/Console/`, hidden commands too); says a repo's first `tests/Unit/` test also adds the `Unit` testsuite to `phpunit.xml.dist`; new tests go in their layer folder even in a flat legacy `tests/Feature/`; specs that select this standard name matching test paths. Evidence: build.md group 1 "Test location" deviation, rework round 1 minor finding (`3045384`), tasks.md line 5, D-004.
2. **errors/exceptions** (architectural, amend, target `global` → `docs/agent/standards-proposals/global/errors/exceptions.md`). Resolves the final-vs-hierarchy contradiction: leaves are `final`, a general exception a specialised one extends is neither final nor abstract, `{Package}Exception` stays abstract; the example shows context carried as a `public readonly` property set by the named constructor; specs name exception constructors and properties. Evidence: spec-review.md line 14, D-006/D-007, build.md group 1 "sourceKey" deviation, exceptions.md lines 9-11 vs 32.
3. **tooling/ringside-gate** (tooling, add, target `project` → `docs/agent/standards/tooling/ringside-gate.md`). `ringside check` runs from the worktree as `composer --working-dir=<worktree> exec ringside check`; worktrees install through `composer.local.json` (D-011); a gate that cannot run reports "not run" and escalates once instead of sending back rework; the generated `AGENTS.md` block is committed on `main`, never on a job branch. Evidence: D-011, round-3/gate.md blockers, build.md rework rounds 1-2, empty commits `7bcf656`, `707ea80`, `bf63f11`.

Still to do once these are answered (post-mortem step 6): comment the metrics and this file on issue #6, set `status: closed`, run `vendor/bin/ringside cleanup --remove 2026-10-25-0120-stop-unserialize-search-registry`.
