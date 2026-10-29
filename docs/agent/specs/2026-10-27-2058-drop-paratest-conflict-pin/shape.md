# Drop the paratest conflict pin — Shaping Notes

## Scope

- Remove the `conflict` entry `"brianium/paratest": ">=7.26.1"` from `composer.json` (the `conflict` key goes too, as it is then empty).
- Raise `pestphp/pest` in `require-dev` from `^5.3.1` to `^5.3.4`, which needs `paratest ^7.27.4`.
- `composer update` for pest and paratest only, then `composer test` including `--parallel`.
- Out of scope: any other file or dependency change. Other packages in campaign #1 are separate jobs.

## Decisions

- D-001: ticket created as drafted (Atrium issue #10).
- No design questions: the brief is explicit and mirrors Keystone's PR #8.

## Context

- Ticket: https://github.com/Refactor-Circus/Atrium/issues/10
- Atrium is first in the campaign; dependants follow once this PR merges. No runtime code or public API changes, so nothing they use is affected.
- No product docs involved, no UI surface, no visuals.

## Standards

- `architecture/dependencies`: governs what Atrium's `composer.json` requires; the change only touches a dev dependency and a conflict constraint.
