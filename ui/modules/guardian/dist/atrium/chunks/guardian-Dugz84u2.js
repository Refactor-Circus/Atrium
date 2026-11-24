import { ref as e, shallowRef as t, watch as n } from "vue";
import { AtriumIntegrationError as r, atriumStatus as i, isInternalPath as a, useAtriumIntegration as o } from "@refactor-circus/atrium";
// src/components/two-factor/guardian.ts
var s = [
	"totp",
	"email",
	"sms",
	"passkey"
], c = "/guardian/two-factor/challenge", l = "/guardian/two-factor/setup";
function u(e) {
	if (!e.response.ok) throw new r(e.response.status, e.error);
	return e.data;
}
function d(e) {
	let t = e instanceof r ? e.body : null;
	return typeof t == "object" && t ? t : {};
}
function f(e) {
	return e;
}
function p(e) {
	let t = Array.isArray(e) ? e[0] : e;
	if (typeof t != "string" || !a(t)) return "/";
	let n = t.split(/[?#]/)[0];
	return n === "/guardian/two-factor/challenge" || n === "/guardian/two-factor/setup" ? "/" : t;
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
	let t = e(!1), n = e(null), r = e(null), a = e({}), o = e(!1), s = e(null), c = e(null);
	function l() {
		n.value = null, r.value = null, a.value = {}, o.value = !1, s.value = null, c.value = null;
	}
	async function u(e) {
		t.value = !0, l();
		try {
			return await e(), !0;
		} catch (e) {
			let t = d(e);
			return n.value = i(e), r.value = typeof t.code == "string" ? t.code : null, n.value === 403 ? o.value = !0 : n.value === 422 && t.errors && Object.keys(t.errors).length > 0 ? a.value = t.errors : (s.value = n.value === 429 && typeof t.retry_after == "number" ? t.retry_after : null, c.value = typeof t.message == "string" ? t.message : e instanceof Error ? e.message : String(e)), !1;
		} finally {
			t.value = !1;
		}
	}
	function f(e) {
		return a.value[e]?.[0];
	}
	return {
		busy: t,
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
	return o("guardian").client;
}
function y(r, a, o = v()) {
	let s = t(null), c = e(!0), l = e(!1), u = e(null);
	async function d() {
		if (!o) c.value = !1;
		else {
			c.value = s.value === null;
			try {
				s.value = await r(o), l.value = !1, u.value = null;
			} catch (e) {
				l.value = !0, u.value = i(e);
			} finally {
				c.value = !1;
			}
		}
	}
	return a && n(a, () => void d(), { deep: !0 }), d(), {
		client: o,
		data: s,
		pending: c,
		failed: l,
		status: u,
		reload: d
	};
}
export { p as a, f as c, y as d, m as i, v as l, l as n, u as o, g as r, h as s, c as t, _ as u };
