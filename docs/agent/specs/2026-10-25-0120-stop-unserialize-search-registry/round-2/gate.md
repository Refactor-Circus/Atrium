VERDICT: PASS

Gate: composer test (phpstan, pint, pest 347 passed, 100% coverage), composer lint:check, ringside check all passed.

Criteria:
1. tests/ArchTest.php 'nothing is revived with unserialize()'
2. tests/ArchTest.php arch()->preset()->security() without ignoring
3. SearchTest 'brings every field of a result back from a child process'
4. SearchTest 'leaves the optional fields empty for a bare result from a child process'
5. SearchTest 'keeps results in order within and across child processes'
6. SearchTest 'starts each child with atrium's own command'; InvokeSearchSourceCommandTest 'writes exactly the results envelope...'
7. SearchTest 'drops malformed rows from a child and keeps the rest in order'
8. SearchTest 'reports a source that throws in its child...', 'reports a child that fails...'
9. SearchTest 'reports a source that runs past its own timeout as timed out and keeps the others'
10. Existing SearchTest cases pass
11. InvokeSearchSourceCommandTest 'registers the child command hidden from the command list'
12. composer test passes

Changed files: CHANGELOG.md, phpunit.xml.dist, SearchServiceProvider.php, InvokeSearchSourceCommand.php, SearchSourceFailedException.php, SearchSourceTimedOutException.php, SearchRegistry.php, AtriumException.php, tests/ArchTest.php, InvokeSearchSourceCommandTest.php, SearchTest.php, SearchSourceExceptionsTest.php
