VERDICT: PASS

Gate (worktree Atrium--2026-10-25-0120-stop-unserialize-search-registry):
- composer test: passed (phpstan 0 errors, pint, pest 347/347, 100% coverage)
- composer lint:check: passed
- ringside check: passed

Criteria
1. tests/ArchTest.php "nothing is revived with unserialize()" (expect('unserialize')->not->toBeUsed)
2. tests/ArchTest.php arch()->preset()->security() with no ignoring
3. SearchTest "brings every field of a result back from a child process"
4. SearchTest "leaves the optional fields empty for a bare result from a child process"
5. SearchTest "keeps results in order within and across child processes"
6. SearchTest "starts each child with atrium's own command"; InvokeSearchSourceCommandTest "writes exactly the results envelope when the closure hands back its rows"
7. SearchTest "drops malformed rows from a child and keeps the rest in order"
8. SearchTest "reports a source that throws in its child as a failed source"; "reports a child that fails as a failed source and keeps the others"; InvokeSearchSourceCommandTest "names the source when it fails"
9. SearchTest "reports a source that runs past its own timeout as timed out and keeps the others"; InvokeSearchSourceCommandTest "names the source when it times out, as a failure"
10. Existing SearchTest cases (sync/fork/process) pass
11. InvokeSearchSourceCommandTest "registers the child command hidden from the command list"
12. composer test passes

Changed files: CHANGELOG.md, src/Domains/Search/Console/InvokeSearchSourceCommand.php, src/Domains/Search/Exceptions/SearchSourceFailedException.php, src/Domains/Search/Exceptions/SearchSourceTimedOutException.php, src/Domains/Search/SearchServiceProvider.php, src/Domains/Search/Services/SearchRegistry.php, src/Exceptions/AtriumException.php, tests/ArchTest.php, tests/Feature/InvokeSearchSourceCommandTest.php, tests/Feature/SearchTest.php
