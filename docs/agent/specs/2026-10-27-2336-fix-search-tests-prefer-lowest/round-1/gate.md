VERDICT: CHANGES

## Gate
- composer test: passed (phpstan 0 errors, pint passed, pest 347/347).
- composer lint:check: passed.
- composer exec ringside check: FAILED. "Generated files are stale or missing. Run: vendor/bin/ringside sync".

## Diff
`git diff main...ring-master/2026-10-27-2336-fix-search-tests-prefer-lowest` is empty. The branch is at fba14da, which is main's HEAD and already holds the composer.json floors (amphp/dns ^2.1.2, amphp/socket ^2.3.1, symfony/translation ^6.4.3 || ^7.0.3 || ^8.0). The worktree is clean.

## Criteria
1. Not re-run. The lowest resolution was not executed in this gate. The floors are in composer.json (line 25, 26, 40).
2. The floors are require-dev only and there is no conflict entry. Lowest-resolution versions were not re-verified here.
3. No diff against main, so nothing outside composer.json changed. The floor commit is already on main (fba14da).
4. Same as 3. The floors sit in require-dev.
5. composer test passes on the current resolution.
6. Not re-run (the update runs were not executed). There is no paratest conflict entry in composer.json now, because the earlier job removed it.
