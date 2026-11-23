VERDICT: PASS

Compat review, round 1. Every break in the diff (routes, config keys, publish tags, Plugin route names, view() removal, Icons, Atrium::path/url, DashboardManager, controllers, action Data, migration) is mandated by the spec and decisions D-005, D-006, D-008, D-015, D-016, and is listed in the v2.0.0 CHANGELOG with a replacement. Action Data additions (version, uuid) are appended with defaults, so existing constructors keep working. No findings at minor or above.
