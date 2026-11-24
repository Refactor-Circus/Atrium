import { AtriumIntegrationError as e, atriumStatus as t, isInternalPath as n, useAtriumIntegration as r } from "@refactor-circus/atrium";
import { ref as i, shallowRef as a, watch as o } from "vue";
// src/components/two-factor/guardian.ts
var s = [
	"totp",
	"email",
	"sms",
	"passkey"
], c = "/guardian/two-factor/challenge", l = "/guardian/two-factor/setup";
function u(t) {
	if (!t.response.ok) throw new e(t.response.status, t.error);
	return t.data;
}
function d(t) {
	let n = t instanceof e ? t.body : null;
	return typeof n == "object" && n ? n : {};
}
function f(e) {
	return e;
}
function p(e) {
	let t = Array.isArray(e) ? e[0] : e;
	if (typeof t != "string" || !n(t)) return "/";
	let r = t.split(/[?#]/)[0];
	return r === "/guardian/two-factor/challenge" || r === "/guardian/two-factor/setup" ? "/" : t;
}
function m(e) {
	if (!e) return null;
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString();
}
function h(e) {
	return e?.required ? s.filter((t) => e.allowed_methods.includes(t)) : [...s];
}
function g(e) {
	return (e?.methods ?? []).filter((e) => e.confirmed_at !== null);
}
function _() {
	let e = i(!1), n = i(null), r = i(null), a = i({}), o = i(!1), s = i(null), c = i(null);
	function l() {
		n.value = null, r.value = null, a.value = {}, o.value = !1, s.value = null, c.value = null;
	}
	async function u(i) {
		e.value = !0, l();
		try {
			return await i(), !0;
		} catch (e) {
			let i = d(e);
			return n.value = t(e), r.value = typeof i.code == "string" ? i.code : null, n.value === 403 ? o.value = !0 : n.value === 422 && i.errors && Object.keys(i.errors).length > 0 ? a.value = i.errors : (s.value = n.value === 429 && typeof i.retry_after == "number" ? i.retry_after : null, c.value = typeof i.message == "string" ? i.message : e instanceof Error ? e.message : String(e)), !1;
		} finally {
			e.value = !1;
		}
	}
	function f(e) {
		return a.value[e]?.[0];
	}
	return {
		busy: e,
		status: n,
		code: r,
		errors: a,
		forbidden: o,
		retryAfter: s,
		message: c,
		run: u,
		error: f,
		reset: l
	};
}
function v() {
	return r("guardian").client;
}
function y(e, n, r = v()) {
	let s = a(null), c = i(!0), l = i(!1), u = i(null);
	async function d() {
		if (!r) c.value = !1;
		else {
			c.value = s.value === null;
			try {
				s.value = await e(r), l.value = !1, u.value = null;
			} catch (e) {
				l.value = !0, u.value = t(e);
			} finally {
				c.value = !1;
			}
		}
	}
	return n && o(n, () => void d(), { deep: !0 }), d(), {
		client: r,
		data: s,
		pending: c,
		failed: l,
		status: u,
		reload: d
	};
}
export { p as a, f as c, y as d, m as i, v as l, l as n, u as o, g as r, h as s, c as t, _ as u };
