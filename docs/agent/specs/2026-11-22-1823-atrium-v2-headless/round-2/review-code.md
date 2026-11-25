VERDICT: PASS

Round 1 finding resolved: startImpersonation() in nuxt/layer/app/pages/roster/users/[user].vue now follows the API URL only when isExternalUrl() (exported from nuxt/layer/app/utils/atriumLink.ts, shared with atriumLink) accepts it. Otherwise it throws the localized unsafe_link error, which the impersonate card shows. The Vitest case in test/integrations/roster/users/user.test.ts covers javascript:, data:, //host, relative and empty URLs, asserting that navigateTo is not called and the error is shown. No findings.
