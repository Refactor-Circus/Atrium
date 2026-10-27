# Factory decision

- **Status:** approved
- **Run:** wf_9c350efd-a53, 2 review rounds (rework sent back from RingMaster: "all blockers were push, go back and try again")
- **Built:** group 1 (`949b7c9`), group 2 (`a79bd1d`), group 3 rerun (`bf63f11`, empty), review rework (`3045384`) on `ring-master/2026-10-25-0120-stop-unserialize-search-registry`. `7bcf656` and `707ea80` are empty commits from the earlier escalated run.

## Reasons

- Gate green both rounds: `ringside check` passed from the job worktree (`composer --working-dir=<worktree> exec ringside check`); `composer test` 347 passed (876 assertions), phpstan 0 errors, pint clean, type coverage 100%.
- All 12 acceptance criteria mapped to proving tests (round-1 gate).
- Round 1: one minor (standards, testing/test-layers) fixed in `3045384`: command test moved to `tests/Feature/Console/`, exception factory tests moved to a new `tests/Unit/` suite (Unit testsuite added to `phpunit.xml.dist`).
- Round 2: code, security, standards and compat reviewers returned no findings.

## Nits

- code: `useProcessDriver()` in `tests/Feature/SearchTest.php` rewrites the skeleton's `bootstrap/cache/testbench.yaml` and restores it in hooks; a killed run would leave it changed. Kept: Testbench's only alternative (`TESTBENCH_WORKING_PATH`) would boot workbench providers in the child.
- code: `AGENTS.md` change from the ringside plugin install is left out of the branch.
- standards: `docs/agent/standards/atrium/domains.md` now lists `Exceptions\AtriumException` and domain `Exceptions/` / `Console/` folders; edited in the main checkout (where `docs/` is untracked), not on the branch.
