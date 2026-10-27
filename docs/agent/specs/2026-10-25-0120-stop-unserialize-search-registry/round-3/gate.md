VERDICT: CHANGES

## Gate
- `composer test`: passed (phpstan 0 errors, pint passed, pest 347/347, 100% coverage).
- `composer lint:check`: passed.
- `vendor/bin/ringside check`: NOT RUN. The permission system denied the command in this session (don't-ask mode). The gate is incomplete until it is run.

## Criteria
1. tests/ArchTest.php 'nothing is revived with unserialize()' (`expect('unserialize')`), plus the security preset.
2. tests/ArchTest.php line 15, `arch()->preset()->security()` with no ignoring.
3. SearchTest 'brings every field of a result back from a child process'.
4. SearchTest 'leaves the optional fields empty for a bare result from a child process'.
5. SearchTest 'keeps results in order within and across child processes'.
6. SearchTest 'starts each child with atrium's own command'; InvokeSearchSourceCommandTest 'writes exactly the results envelope when the closure hands back its rows'.
7. SearchTest 'drops malformed rows from a child and keeps the rest in order'.
8. SearchTest 'reports a source that throws in its child as a failed source' and 'reports a child that fails as a failed source and keeps the others'; InvokeSearchSourceCommandTest 'names the source when it fails'.
9. SearchTest 'reports a source that runs past its own timeout as timed out and keeps the others'; InvokeSearchSourceCommandTest 'names the source when it times out, as a failure'.
10. Existing SearchTest cases pass (347/347).
11. InvokeSearchSourceCommandTest 'registers the child command hidden from the command list'.
12. `composer test` passes.

## Changed files
CHANGELOG.md, src/Domains/Search/Console/InvokeSearchSourceCommand.php, src/Domains/Search/Exceptions/SearchSourceFailedException.php, src/Domains/Search/Exceptions/SearchSourceTimedOutException.php, src/Domains/Search/SearchServiceProvider.php, src/Domains/Search/Services/SearchRegistry.php, src/Exceptions/AtriumException.php, tests/ArchTest.php, tests/Feature/InvokeSearchSourceCommandTest.php, tests/Feature/SearchTest.php

## Blockers
- `vendor/bin/ringside check` could not run (permission denied). Re-run it.
