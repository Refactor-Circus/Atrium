# Spec review

## Round 1

Changes to spec.md, and why:

- Criterion 3: composer.lock is gitignored, so the "if tracked" wording was dead. It now says the lock is untracked and verifies a fresh `composer update` resolves pest >= 5.3.4 and paratest >= 7.27.4 with `composer show` and `composer why-not`. It also says CI is expected to be green.
- Criteria 1 and 2: added concrete checks (`composer validate --strict`, a JSON read of `conflict` and `require-dev.pestphp/pest`). Criterion 1 now says no `conflict` key at all.
- Criterion 4: reworded to a checkable diff, `git diff --name-only main` lists only `composer.json` and the spec folder, and `composer.json` changes only the pest constraint and the conflict removal. The lock was dropped from the allowed-changes list.
- Criterion 5: names the exact commands (`composer test`, `vendor/bin/pest --parallel`, `composer test:browser`), requires a fresh update, and says what `composer test` covers and that Browser is excluded from `--parallel`.
- Design: gave the exact update command, and added a check that pest 5.3.4 requires a safe paratest, plus a `--prefer-lowest` run, because the floor is the only enforcement without a lock.
- Risks: added the pest plugin constraint risk, with the type-coverage gate and the Browser suite re-checks.

Open questions were empty and were not touched.
