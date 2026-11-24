import { resolveIntegrationBase as e, runResponseHandlers as t, useAtrium as n, useAtriumShellStore as r } from "@refactor-circus/atrium";
import i from "openapi-fetch";
function a(t, n, r, i) {
	return e(t || n || "/guardian", r, i);
}
function o() {
	let e = useNuxtApp(), o = n(), s = useRuntimeConfig().public.atrium, c = r().integration("guardian")?.api_base, l = i({
		baseUrl: a(s.integrations?.guardian?.apiBase, c, s.apiBase, window.location.origin),
		fetch: (e) => globalThis.fetch(e)
	});
	return l.use({
		async onRequest({ request: e }) {
			let t = o.auth(), n = new Headers(e.headers);
			n.set("Accept", "application/json");
			for (let [e, r] of Object.entries(await t.headers?.() ?? {})) n.set(e, r);
			return new Request(e, {
				headers: n,
				...t.credentials ? { credentials: t.credentials } : {}
			});
		},
		async onResponse({ request: n, response: r }) {
			await t(e, r, n), r.status === 401 && await o.auth().onUnauthorized?.();
		}
	}), l;
}
export { o as t };
