# Decisions

## D-001 — Create the GitHub ticket as drafted?

- **Question:** Create this GitHub ticket as drafted? Title: 'Drop the paratest conflict pin'.
- **Choice:** Create as drafted
- **Rationale:** none given (answered in RingMaster)
- **Date:** 2026-10-27
- **Raised by:** ticket

## D-002 — Approve the spec 'Drop the paratest conflict pin' with its five acceptance criteria as written?

- **Question:** Approve the spec 'Drop the paratest conflict pin' with its five acceptance criteria as written?
- **Choice:** Approve as written
- **Rationale:** none given (answered in RingMaster)
- **Date:** 2026-10-28
- **Raised by:** approval

## D-003 — composer test:browser exits 1 with PlaywrightNotInstalledException (Playwright is not installed in the job worktree). How should the build proceed?

- **Question:** composer test:browser exits 1 with PlaywrightNotInstalledException (Playwright is not installed in the job worktree). How should the build proceed?
- **Choice:** Install Playwright in the worktree (npm install then npx playwright install) and rerun composer test:browser
- **Rationale:** none given (answered in RingMaster)
- **Date:** 2026-10-28
- **Raised by:** build

## D-004 — vendor/bin/pest --parallel exits 1 with the same PlaywrightNotInstalledException. How should the build proceed?

- **Question:** vendor/bin/pest --parallel exits 1 with the same PlaywrightNotInstalledException. How should the build proceed?
- **Choice:** Install Playwright in the worktree and rerun vendor/bin/pest --parallel
- **Rationale:** none given (answered in RingMaster)
- **Date:** 2026-10-28
- **Raised by:** build

## D-005 — Task 1.4 needs the unit suite to pass after `composer update --prefer-lowest`. Under the lowest versions, 12 of 347 tests fail (process-driver tests in tests/Feature/SearchTest.php). How should the job treat 1.4?

- **Question:** Task 1.4 needs the unit suite to pass after `composer update --prefer-lowest`. Under the lowest versions, 12 of 347 tests fail: the process-driver tests in tests/Feature/SearchTest.php. PHP 8.5 deprecation notices from amphp/dns v2.0.0 and symfony/translation v6.4.0 break the child-process output, and neither package comes through pest or paratest. How should the job treat 1.4?
- **Choice:** Accept 1.4 on the paratest-floor evidence (pest 5.3.4 requires paratest ^7.27.4, and prefer-lowest installs paratest v7.27.4). Record the SearchTest failures under lowest versions as an existing issue outside this spec, and propose a separate follow-up job for them.
- **Rationale:** none given (answered in RingMaster)
- **Date:** 2026-10-28
- **Raised by:** build
