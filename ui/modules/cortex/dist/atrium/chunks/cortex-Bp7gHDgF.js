import { AtriumIntegrationError as e, atriumStatus as t, useAtriumIntegration as n } from "@refactor-circus/atrium";
import { ref as r, shallowRef as i } from "vue";
// src/components/cortex.ts
function a() {
	return n("cortex").client;
}
function o(t) {
	if (!t.response.ok) throw new e(t.response.status, t.error);
	return t.data;
}
function s(e) {
	return e;
}
function c(e) {
	let n = a(), o = i(null), s = r(!0), c = r(!1), l = r(null);
	async function u() {
		if (!n) s.value = !1;
		else {
			s.value = o.value === null;
			try {
				o.value = await e(n), c.value = !1, l.value = null;
			} catch (e) {
				c.value = !0, l.value = t(e);
			} finally {
				s.value = !1;
			}
		}
	}
	return u(), {
		client: n,
		data: o,
		pending: s,
		failed: c,
		status: l,
		reload: u
	};
}
function l() {
	let n = r({}), i = r(null), a = r(!1), o = r(!1);
	async function s(r) {
		o.value = !0, n.value = {}, i.value = null, a.value = !1;
		try {
			return await r(), !0;
		} catch (r) {
			let o = t(r), s = r instanceof e ? r.body : null;
			return o === 403 ? a.value = !0 : o === 422 && s?.errors ? n.value = s.errors : i.value = typeof s?.message == "string" ? s.message : r instanceof Error ? r.message : String(r), !1;
		} finally {
			o.value = !1;
		}
	}
	function c(e) {
		let t = n.value[e]?.[0];
		if (t) return t;
		let r = Object.keys(n.value).find((t) => t.startsWith(`${e}.`));
		return r ? n.value[r]?.[0] : void 0;
	}
	return {
		errors: n,
		message: i,
		forbidden: a,
		busy: o,
		run: s,
		error: c
	};
}
export { c as a, l as i, s as n, a as r, o as t };
