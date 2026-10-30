# Standards Feedback

Every time work has to break a standard, add a row. `/ring-master-discover-standards` reads this log, so changes to the shared standards are based on evidence.

| Date | Spec | Standard | Deviation | Why |
| --- | --- | --- | --- | --- |
| 2026-10-29 | 2026-10-29-2037-screen-extensions-registry | data/value-objects | `Screen::kind()` takes a string (`detail`/`list`, with `Screen::DETAIL`/`Screen::LIST` constants) instead of a string-backed enum | The spec fixes the public signatures `kind('detail'\|'list')` and `Screen::standard(string $key, string $kind)`; the constants follow `Theme::SIDEBAR`/`Theme::TOP` |
