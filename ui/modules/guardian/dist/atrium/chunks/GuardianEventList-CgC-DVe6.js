import { t as e } from "./GuardianState-DytBr9ih.js";
import { d as t, i as n, o as r } from "./guardian-D9MeowUD.js";
import { o as i } from "./admin-_cLX5Zre.js";
import { Fragment as a, computed as o, createBlock as s, createCommentVNode as c, createElementBlock as l, createElementVNode as u, createTextVNode as d, createVNode as f, defineComponent as p, openBlock as m, ref as h, renderList as g, resolveComponent as _, toDisplayString as v, unref as y, watch as b, withCtx as x } from "vue";
import { UButton as S } from "@refactor-circus/atrium/ui";
import { useI18n as C } from "vue-i18n";
// src/components/admin/GuardianEventList.vue?vue&type=script&setup=true&lang.ts
var w = ["data-testid"], T = ["data-testid"], E = {
	key: 1,
	class: "w-full text-left text-sm"
}, D = { class: "text-muted" }, O = { class: "py-2 pr-3 font-medium" }, k = { class: "py-2 pr-3 font-medium" }, A = { class: "py-2 pr-3 font-medium" }, j = { class: "py-2 font-medium" }, M = { class: "divide-y divide-default" }, N = ["data-testid"], P = { class: "py-2 pr-3" }, F = { class: "py-2 pr-3" }, I = { class: "py-2 pr-3 text-muted" }, L = { class: "py-2 text-muted" }, R = { class: "flex gap-2" }, z = /* @__PURE__ */ p({
	__name: "GuardianEventList",
	props: {
		filters: {},
		testid: {}
	},
	setup(p) {
		let z = p, { t: B } = C(), V = h(null), H = h([]), U = o(() => ({
			...Object.fromEntries(Object.entries(z.filters).filter(([, e]) => e !== null && e !== "")),
			per_page: 50,
			...V.value ? { cursor: V.value } : {}
		}));
		b(() => z.filters, () => {
			V.value = null, H.value = [];
		}, { deep: !0 });
		let { data: W, pending: G, failed: K, status: q } = t(async (e) => r(await e.GET("/security-events", { params: { query: U.value } })), U), J = o(() => W.value?.data ?? []);
		function Y() {
			let e = W.value?.meta?.next_cursor;
			e && (H.value = [...H.value, V.value], V.value = e);
		}
		function X() {
			V.value = H.value.at(-1) ?? null, H.value = H.value.slice(0, -1);
		}
		return (t, r) => {
			let o = _("RouterLink"), h = S;
			return m(), s(e, {
				ready: !y(G) && y(W) !== null,
				failed: y(K),
				status: y(q)
			}, {
				default: x(() => [u("div", {
					class: "space-y-3",
					"data-testid": p.testid
				}, [y(J).length === 0 ? (m(), l("p", {
					key: 0,
					class: "text-sm text-muted",
					"data-testid": `${p.testid}-empty`
				}, v(y(B)("guardian.admin.events.empty")), 9, T)) : (m(), l("table", E, [u("thead", D, [u("tr", null, [
					u("th", O, v(y(B)("guardian.admin.events.fields.type")), 1),
					u("th", k, v(y(B)("guardian.admin.events.fields.user")), 1),
					u("th", A, v(y(B)("guardian.admin.events.fields.ip")), 1),
					u("th", j, v(y(B)("guardian.admin.events.fields.occurred_at")), 1)
				])]), u("tbody", M, [(m(!0), l(a, null, g(y(J), (e) => (m(), l("tr", {
					key: e.id,
					"data-testid": `guardian-event-${e.id}`
				}, [
					u("td", P, [f(o, {
						to: y(i)(e.id),
						class: "font-mono hover:underline",
						"data-testid": "guardian-event-link"
					}, {
						default: x(() => [d(v(e.type), 1)]),
						_: 2
					}, 1032, ["to"])]),
					u("td", F, v(e.user_id ?? "—"), 1),
					u("td", I, v(e.ip ?? "—"), 1),
					u("td", L, v(y(n)(e.occurred_at)), 1)
				], 8, N))), 128))])])), u("div", R, [y(H).length > 0 ? (m(), s(h, {
					key: 0,
					size: "xs",
					color: "neutral",
					variant: "soft",
					"data-testid": `${p.testid}-newer`,
					onClick: X
				}, {
					default: x(() => [d(v(y(B)("guardian.admin.events.newer")), 1)]),
					_: 1
				}, 8, ["data-testid"])) : c("", !0), y(W)?.meta?.next_cursor ? (m(), s(h, {
					key: 1,
					size: "xs",
					color: "neutral",
					variant: "soft",
					"data-testid": `${p.testid}-older`,
					onClick: Y
				}, {
					default: x(() => [d(v(y(B)("guardian.admin.events.older")), 1)]),
					_: 1
				}, 8, ["data-testid"])) : c("", !0)])], 8, w)]),
				_: 1
			}, 8, [
				"ready",
				"failed",
				"status"
			]);
		};
	}
});
export { z as t };
