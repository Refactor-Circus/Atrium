VERDICT: PASS

Security review of the whole diff against main. No findings at or above minor.

Checked:
- Authorize: 401 JSON for guests, 403 on gate failure, fail closed outside local; runs before route binding.
- ForceJsonResponse: no redirect on a missing guard.
- Layout save: uuid validated as existing in this dashboard (422 otherwise); widget keys filtered by availability; optimistic version lock applied by one conditional update inside the transaction.
- Lazy widget show: scoped binding, dashboard id check, orphan 404, definition authorization.
- JsonData: Htmlable and closures rejected; depth and cycle guards; production isolation returns a generic message and reports the exception.
- ClientPath: rejects javascript:, data:, //host, backslash, control chars, userinfo, mixed-case schemes, and http:host; never throws.
- Layer: no v-html, external links carry rel noopener noreferrer, Iconify remote fetch off by default, token storage left to the host.
- Workbench token guard: workbench-only, local-only, labelled, export-ignored. CORS there has credentials off.
- Config banner documents the no-auth note, Authorize last, CORS and CSRF, and the local gate fallback.
- Removed-config-key warning does not inherit the old middleware key.
