VERDICT: CHANGES

Security review, round 1.

Reviewed: Authorize and the 401/403 path, ClientPath, JsonData, the layout/widget/screen requests, plugin routes, the workbench token guard, and the layer link guard and public invitation page.

Findings
- minor: nuxt/layer/app/pages/roster/users/[user].vue startImpersonation() passes the url from the API response straight to navigateTo(url, {external: true}). It skips the atriumLink guard that every other server-supplied URL goes through. Fix: accept only an absolute http(s) URL (reuse the isFollowable check from nuxt/layer/app/utils/atriumLink.ts) and add a Vitest case for a javascript: or data: URL.

Checked and fine
- Authorize answers 401 JSON for guests and fails closed outside local.
- ClientPath rejects the listed bypass forms.
- JsonData walks with a depth limit and a cycle guard, and refuses Htmlable.
- Layout uuids are scoped to the dashboard, and the widget route is scoped and 404s for orphans.
- The workbench token guard is local-only and lives under workbench/.
- The invitation page keeps the token out of the title, logs and storage.
