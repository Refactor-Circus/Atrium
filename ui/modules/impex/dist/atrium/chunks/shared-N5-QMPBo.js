import { atriumStatus as e, integrationData as t, useAtriumIntegration as n, useIntegrationQuery as r } from "@refactor-circus/atrium";
import { ref as i, shallowRef as a, watch as o } from "vue";
// src/components/shared.ts
var s = [
	"pending",
	"running",
	"waiting",
	"rolling_back",
	"completed",
	"failed",
	"cancelled"
], c = [
	"api",
	"mcp",
	"command",
	"schedule",
	"channel",
	"code",
	"child"
], l = [
	"http",
	"mail",
	"file"
], u = ["inbound", "outbound"], d = ["active", "disabled"], f = [
	"all",
	"failures",
	"none"
], p = [
	"active",
	"paused",
	"disabled"
];
function m(e) {
	switch (e) {
		case "completed":
		case "succeeded":
		case "active": return "success";
		case "failed":
		case "disabled": return "error";
		case "waiting":
		case "rolling_back":
		case "paused": return "warning";
		case "running":
		case "pending": return "info";
		default: return "neutral";
	}
}
function h(e) {
	return `/impex/runs/${encodeURIComponent(e)}`;
}
function g(e) {
	return `/impex/channels/${encodeURIComponent(e)}`;
}
function _(e) {
	return `/impex/subscriptions/${encodeURIComponent(e)}`;
}
function v(e) {
	if (typeof e != "object" || !e) return null;
	let { url: t, to: n } = e;
	return typeof t == "string" && t !== "" ? t : typeof n == "string" && n !== "" ? n : null;
}
function y(e) {
	return {
		transport: e?.transport ?? "http",
		status: e?.status ?? "active",
		body_policy: e?.body_policy ?? "all",
		signing_secret: "",
		options_json: JSON.stringify(e?.options ?? {}, null, 2)
	};
}
function b(e) {
	let t = w(e.options_json), n = t === void 0 ? {} : "value" in t ? t.value : null;
	return typeof n != "object" || !n || Array.isArray(n) ? null : {
		transport: e.transport,
		status: e.status,
		body_policy: e.body_policy,
		options: n,
		...e.signing_secret === "" ? {} : { credentials: { signing_secret: e.signing_secret } }
	};
}
function x(e) {
	if (!e) return null;
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString();
}
function S(e) {
	let t = Array.isArray(e) ? e[0] : e;
	return typeof t == "string" && t !== "" ? t : void 0;
}
function C(e) {
	return e === !0 || e === 1 || e === "1" || e === "true";
}
function w(e) {
	if (e.trim() !== "") try {
		return { value: JSON.parse(e) };
	} catch {
		return { invalid: !0 };
	}
}
function T(e) {
	return e;
}
function E(e, t) {
	let { client: r } = n("impex"), s = a(null), c = a(null), l = i(!1);
	async function u() {
		if (r) {
			l.value = !0, c.value = null;
			try {
				s.value = await e(r);
			} catch (e) {
				c.value = e;
			} finally {
				l.value = !1;
			}
		}
	}
	return t && o(t, () => void u()), u(), {
		client: r,
		data: s,
		error: c,
		pending: l,
		reload: u
	};
}
function D(e, t) {
	let { client: r } = n("impex"), s = a([]), c = i(null), l = a(null), u = i(!1);
	async function d(t) {
		if (r) {
			u.value = !0, l.value = null;
			try {
				let n = await e(r, t);
				s.value = t === void 0 ? n.data : [...s.value, ...n.data], c.value = n.meta?.next_cursor ?? null;
			} catch (e) {
				l.value = e;
			} finally {
				u.value = !1;
			}
		}
	}
	return t && o(t, () => void d(void 0), { deep: !0 }), d(void 0), {
		rows: s,
		nextCursor: c,
		error: l,
		pending: u,
		reload: () => d(void 0),
		loadMore: () => d(c.value ?? void 0)
	};
}
function O() {
	let t = i(!1), n = i({}), r = i(null), a = i(null), o = i(!1);
	function s() {
		n.value = {}, r.value = null, a.value = null, o.value = !1;
	}
	function c(e, t) {
		s(), n.value = { [e]: [t] };
	}
	async function l(i, c) {
		s(), t.value = !0;
		try {
			let e = await i(), t = await c?.(e);
			return typeof t == "string" && (r.value = t), !0;
		} catch (t) {
			let r = e(t), i = t.body;
			return r === 422 && typeof i?.errors == "object" && i.errors !== null ? n.value = i.errors : r === 403 ? o.value = !0 : a.value = typeof i?.message == "string" ? i.message : t instanceof Error ? t.message : String(t), !1;
		} finally {
			t.value = !1;
		}
	}
	return {
		busy: t,
		errors: n,
		notice: r,
		failure: a,
		forbidden: o,
		run: l,
		invalid: c,
		reset: s
	};
}
function k() {
	return r("impex", "impex.stats.show", async (e) => t(await e.GET("/stats")).data);
}
export { k as C, E as S, h as _, s as a, O as b, b as c, v as d, x as f, S as g, w as h, l as i, g as l, T as m, u as n, c as o, C as p, d as r, p as s, f as t, y as u, m as v, D as x, _ as y };
