# Decisions

## D-001: How the JSON reaches the registry

- **Question:** Laravel's invoke-serialized-closure wraps the child's result in serialize(), so the parent still has to unserialize it. How should the JSON reach the registry?
- **Choice:** Own Atrium console command for the child that runs the closure and writes JSON
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** ticket (answered in RingMaster)

## D-002: Create the ticket

- **Question:** Create the GitHub issue from the draft in ticket.md as written?
- **Choice:** Create as drafted
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** ticket (answered in RingMaster)

## D-003: How the Atrium command gets the closure

- **Question:** D-001 gives the child an Atrium command, but that command still has to revive the SerializableClosure it is handed, which Laravel does with unserialize(). How should the Atrium command get the closure without unserialize in src/?
- **Choice:** Atrium command runs the framework's invoke-serialized-closure in-process (Artisan::call) with a wrapper closure that hands the results back as arrays, then writes them as JSON; the framework still does the unserialize
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** shape (answered in RingMaster)

## D-004: Standards for this spec

- **Question:** Use these standards for this spec?
- **Choice:** testing/arch-tests, architecture/service-providers, architecture/naming, atrium/domains, data/value-objects, errors/exceptions, testing/test-layers
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** shape (answered in RingMaster)

## D-005: Downstream SearchRegistry workarounds

- **Question:** Should this spec also remove the SearchRegistry workaround in downstream packages (Cortex D-058)?
- **Choice:** Yes, propose a follow-up job per downstream package from this one
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** spec-review (answered in RingMaster)

## D-006: Exception classes and base

- **Question:** Failure and timeout reports: new exception classes in this spec, and on which base?
- **Choice:** Add abstract RefactorCircus\Atrium\Exceptions\AtriumException on Keystone's PackageException, with the two Search exceptions extending it
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** spec-review (answered in RingMaster)

## D-007: Timeout exception hierarchy

- **Question:** Should the timeout exception extend the failure exception, or be its sibling?
- **Choice:** SearchSourceTimedOutException extends SearchSourceFailedException (catching failures catches timeouts)
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** spec-review (answered in RingMaster)

## D-008: How failures are reported and observed

- **Question:** How are failures and timeouts reported (criteria 8 and 9), and how do tests observe them?
- **Choice:** report() to the host's exception handler, as today; tests use Exceptions::fake() and assertReported()
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** spec-review (answered in RingMaster)

## D-009: How tests produce malformed rows

- **Question:** How do tests produce malformed rows for criterion 7?
- **Choice:** Feature-test decode() with a faked Process result carrying crafted JSON stdout
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** spec-review (answered in RingMaster)

## D-010: Approve the spec

- **Question:** Approve the spec (12 acceptance criteria in spec.md, with D-005 to D-009 applied) for task breakdown and build?
- **Choice:** Approve as is
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** approval (answered in RingMaster)

## D-011: Making the ringside check gate available in the job worktree

- **Question:** The ringside check gate cannot run in the job worktree because refactor-circus/ringside is not installed there. How should it be made available?
- **Choice:** Have the RingMaster runner install worktree dependencies from composer.local.json (ringside and standards linked from ../Ringside and ../Standards), the way the main checkout is set up, and allow that install command
- **Rationale:** (no note given)
- **Date:** 2026-10-25
- **Raised by:** build (answered in RingMaster)
