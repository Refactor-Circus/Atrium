# Factory decision

Status: approved as is (escalated at review round 3: review rounds exhausted)

Accepted finding (minor, gate): the browser suite (criteria 17, 18) and the `public/atrium.css` rebuild (criterion 16) were not verified by the gate. They were verified by hand afterwards: `composer test:browser` passed 46/46 and `npm run build:css` left the file unchanged.

Nits: none.

Breaks: these consumer packages still use `x-atrium::audit*`, `historyNavItem()` or `atrium.history`, so they break until their specs land.
- Cortex: 6 files
- Impex: 6 files
- Keen: 5 files
- PennantPlus: 4 files
- Polycart: 5 files
- Roster: 6 files
- Showroom: 12 files
