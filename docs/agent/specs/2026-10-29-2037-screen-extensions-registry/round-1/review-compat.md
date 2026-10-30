VERDICT: CHANGES

minor: lang/en/atrium.php drops 24 audit_* translation keys (atrium::atrium.audit_*) which CHANGELOG.md upgrade note does not list. No sibling package uses them. Fix: name them in the upgrade note.

All other removals (history route, domain, views, audit components, Plugin::historyNavItem) are spec-mandated (D-009, D-014, D-016) and documented.
