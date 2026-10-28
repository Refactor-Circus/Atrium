Risk: medium

## What changed
- `composer.json` only: `require-dev` `pestphp/pest` rises from `^5.3.1` to `^5.3.4`, and the top-level `conflict` block (`brianium/paratest >=7.26.1`) is removed.
- No source, config, migration or contract changes. `composer.lock` is gitignored and untracked, so it is not in the diff.

## Why
Issue #10: the paratest conflict pin was temporary. Pest 5.3.4 requires paratest `^7.27.4`, so the `^5.3.4` floor now keeps resolvers off the broken paratest range and the pin can go. Decisions: D-002 approved the spec as written. D-003 and D-004 had Playwright installed in the worktree so the browser and parallel runs could be checked. D-005 accepted the prefer-lowest check on the paratest-floor evidence.

## Look at
- `composer.json:31`: the new pest floor. It is now the only guard against the broken paratest range, since there is no tracked lock.
- `composer.json:144`: the `conflict` block is gone, and the `repositories` array should still end cleanly.

## Tested
- AC1: `composer validate --strict` passes and the diff removes `conflict`.
- AC2: the diff shows `require-dev.pestphp/pest` at `^5.3.4`.
- AC3: a fresh update installed pest 5.3.4 and paratest 7.27.4, and `why-not` reports nothing blocking.
- AC4: the diff touches only `composer.json`.
- AC5: `composer test` passed on a fresh install (phpstan 0 errors, pint clean, type coverage 100%, 347 tests). The round-1 gate did not itself run `pest --parallel` or `test:browser`; the build stage ran them after Playwright was installed (D-003, D-004), but the gate report does not record the result.
- `ringside check` passed.

## Risks
- Dependency change in `composer.json`, so the risk is medium. Consumers are unaffected: it is dev-only and does not touch the runtime `require`.
- Under `--prefer-lowest`, 12 of 347 tests fail (process-driver tests in `tests/Feature/SearchTest.php`). The cause is PHP 8.5 deprecations from amphp/dns v2.0.0 and symfony/translation v6.4.0, not pest or paratest. This was accepted in D-005 and is out of scope. A follow-up job is to be proposed.
- Pest plugin floors were not raised, and the resolver accepted them.
- CI resolves fresh, so watch its first run.
- Nits: 0.
