# Drop the paratest conflict pin

Ticket: [#10](https://github.com/Refactor-Circus/Atrium/issues/10)

## Goal

Remove the temporary `brianium/paratest` conflict pin from Atrium's `composer.json` and require a Pest release that works with current paratest, so maintainers and CI install the latest tooling.

## Acceptance criteria

1. `composer.json` has no `conflict` key at all. Check: `composer validate --strict` passes, and a JSON read of `composer.json` finds no `conflict` key.
2. `composer.json` requires `pestphp/pest` `^5.3.4` in `require-dev`. Check: the JSON read of `require-dev.pestphp/pest` equals `^5.3.4`.
3. `composer.lock` is gitignored (`.gitignore` line 6) and untracked, so it is not part of the PR. A fresh `composer update` resolves with no conflict, and `composer show pestphp/pest brianium/paratest` reports pest >= 5.3.4 and paratest >= 7.27.4. `composer why-not brianium/paratest 7.27.4` reports nothing blocking. CI is expected to be green on the PR, since it resolves fresh.
4. `git diff --name-only main` lists only `composer.json` and files under this spec folder, and `composer.json` changes only the pest constraint and the removal of the `conflict` block. Transitive changes in the untracked lock are acceptable.
5. On a fresh `composer update` (not only a warm `vendor/`), `composer test` exits 0 and `vendor/bin/pest --parallel` exits 0. `composer test` covers lint, analyse, the type-coverage gate (`--min=100`) and the unit suite; the Browser suite is excluded from `--parallel` and is checked with `composer test:browser`, which must also exit 0.

## Design

Edit `composer.json` only (raise the pest constraint to `^5.3.4`, delete the `conflict` block), then run `composer update pestphp/pest brianium/paratest --with-dependencies`. No source, config or API changes. Follows `architecture/dependencies`; no departures.

Since there is no tracked lock, the `^5.3.4` floor is the only thing keeping a resolver off the broken paratest range (>=7.26.1) the pin guarded against. Before finishing, confirm that pest 5.3.4 itself requires paratest `^7.27.4` or later (`composer show pestphp/pest --all`, or `composer why-not brianium/paratest 7.26.1`), and that a `composer update --prefer-lowest` run installs a working paratest and passes the unit suite.

## Out of scope

Other packages in campaign #1, and any unrelated dependency bumps.

## Risks and open questions

- A pest/paratest update may pull transitive bumps; they only touch the untracked lock, so keep them to what the resolver requires.
- The other pest plugins (`pest-plugin-browser ^5.1.2`, `pest-plugin-laravel ^5.0.1`, `pest-plugin-type-coverage ^5.0.3`) may constrain pest or phpunit. If they block resolution, record which plugin floors must rise and raise only those. Confirm the type-coverage 100% gate and the Browser suite still pass after the update.
