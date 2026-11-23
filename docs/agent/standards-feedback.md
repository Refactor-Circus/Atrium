# Standards Feedback

Every time work has to break a standard, add a row. `/ring-master-discover-standards` reads this log, so changes to the shared standards are based on evidence.

| Date | Spec | Standard | Deviation | Why |
| --- | --- | --- | --- | --- |
| 2026-10-29 | 2026-10-29-2037-screen-extensions-registry | data/value-objects | `Screen::kind()` takes a string (`detail`/`list`, with `Screen::DETAIL`/`Screen::LIST` constants) instead of a string-backed enum | The spec fixes the public signatures `kind('detail'\|'list')` and `Screen::standard(string $key, string $kind)`; the constants follow `Theme::SIDEBAR`/`Theme::TOP` |
| 2026-11-23 | 2026-11-22-1823-atrium-v2-headless | http/authorization | `ShowShellRequest`, `IndexSearchResultRequest`, `IndexSettingsPanelRequest` and `ShowSettingsPanelRequest` inherit the base `authorize() => true` instead of asking a policy (D-018) | They read registries only (navigation, search sources, settings panels), so there is no model or policy to ask: the route group's `viewAtrium` gate decides, and each registry filters its entries for the user |
