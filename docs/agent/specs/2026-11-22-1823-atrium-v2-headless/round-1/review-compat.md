VERDICT: PASS

Compat review, round 1. Every public-surface break in the diff (removed config keys, routes and route names, Blade views, publish tags, Icons, StyleRegistry, Atrium::path/url, view(), loadDashboardRoutesFrom, the DashboardCrudController and AuthorizesScreens removals, the Data and event changes, the new migration, the archive rules) is settled by the spec, D-005, D-006, D-008, D-015 and D-016, and is listed in the CHANGELOG v2.0.0 upgrade guide. The migration reads atrium.tables and has a down(). No unspecified break found.
