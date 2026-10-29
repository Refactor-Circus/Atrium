# Build: Screen extensions registry

## Group 1 (salvaged)

**Found.** No index lock and no merge or rebase in progress. The previous build agent left every group 1 file in the worktree, uncommitted: the `Domains/Screens` domain (`ScreensServiceProvider`, `DefinesExtension`, `TabDefinition`, `SectionDefinition`, `Screen`, `ResolvedScreen`, `ScreenExtensions`, `ScreenVisibility`), `Testing\ResetsScreenExtensions`, the edits to `DomainServiceProvider`, `Atrium`, the facade and `tests/TestCase.php`, and all seven test files. It had ticked 1.1 to 1.3 in `tasks.md` but committed nothing and wrote no build note. `tests/Pest.php` needed no change and is untouched.

**Checked.** Read every file against criteria 1 to 8 and 11 and task 1.1's list: singleton and `Atrium::screens()`; setters, defaults, `Error` on writes and closure reads, view/component exclusivity, trailing `Screen`; key, slot and target validation with every D-026 reject; clone on register; `123`/`007` as strings through `?tab=`; duplicates per environment (local/testing throw, production reports once and keeps the first); cross-target precedence in all three pairings for tabs and sections; `snapshot()`/`restore()`/`flush()` and the trait's two-test behaviour; `Screen::make`/`standard()`; tab ordering, reserved keys (exact and `*`), `?tab=` string-only, unknown key 200, hidden key 403; the visibility matrix, throwing `authorize` reported and called once, memo by morph class plus key or the unsaved model itself, `forgetScopedInstances()` between viewers; `*` and `test.*` matching. All present. `php -l` passes on all 20 files. The suite was not run here; the gate runs it.

**Committed.** The 20 group 1 files listed above, plus 1.1 and 1.2 ticked in `tasks.md` and this note.

**Left.**
- 1.3 (`vendor/bin/pest` green) is unticked: there is no record that the previous agent ran the suite.
- Two related edits by the previous agent sit outside the group's file list and are left uncommitted in the worktree: `phpstan.neon.dist` adds `tests/TestCase.php` to the analysed paths, so PHPStan analyses the published `ResetsScreenExtensions` trait through its one user instead of reporting it unused; and `docs/agent/standards-feedback.md` records `Screen::kind()` taking a string (with `Screen::DETAIL`/`Screen::LIST`) rather than an enum, because the spec fixes `kind('detail'|'list')` and `standard(string $key, string $kind)`. `composer analyse` likely needs the `phpstan.neon.dist` change.
- `AGENTS.md` and the group 5 bullet reformat in `tasks.md` are not group 1 changes and are left as found.
