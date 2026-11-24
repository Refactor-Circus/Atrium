import { pageOrigin as e, resolveIntegrationBase as t, runResponseHandlers as n, signRequest as r, useAtrium as i, useAtriumBoot as a, useAtriumShellStore as o } from "@refactor-circus/atrium";
import s from "openapi-fetch";
function c(e, n, r, i) {
	return t(e || n || "/guardian", r, i);
}
function l() {
	let t = i(), l = a(), u = o().integration("guardian")?.api_base;
	return s({
		baseUrl: c(u, l.integrations.guardian?.api_base, l.api_base, e()),
		fetch: async (e) => {
			let i = await r(e), a = await globalThis.fetch(i);
			return await n(a, i), a.status === 401 && await t.auth().onUnauthorized?.(), a;
		}
	});
}
export { l as t };
