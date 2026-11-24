import { t as e } from "./ImpexState-Mg53d6po.js";
import { f as t, g as n, n as r, x as i } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as a, integrationData as o } from "@refactor-circus/atrium";
import { UButton as s, UInput as c, USelect as l } from "@refactor-circus/atrium/ui";
import { Fragment as u, computed as d, createBlock as f, createCommentVNode as p, createElementBlock as m, createElementVNode as h, createTextVNode as g, createVNode as _, defineComponent as v, openBlock as y, reactive as b, renderList as x, resolveComponent as S, toDisplayString as C, unref as w, watch as T, withCtx as E, withModifiers as D } from "vue";
import { useI18n as O } from "vue-i18n";
import { useRoute as k, useRouter as A } from "vue-router";
// src/pages/messages/index.vue?vue&type=script&setup=true&lang.ts
var j = {
	class: "space-y-4",
	"data-testid": "impex-messages"
}, M = { class: "text-xl font-semibold" }, N = { class: "space-y-4" }, P = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "impex-messages-empty"
}, F = {
	key: 1,
	class: "w-full text-left text-sm"
}, I = { class: "text-muted" }, L = { class: "py-2 pr-3 font-medium" }, R = { class: "py-2 pr-3 font-medium" }, z = { class: "py-2 pr-3 font-medium" }, ee = { class: "py-2 pr-3 font-medium" }, B = { class: "py-2 font-medium" }, V = { class: "divide-y divide-default" }, H = ["data-testid"], U = { class: "py-2 pr-3" }, W = { class: "py-2 pr-3" }, G = { class: "max-w-xs truncate py-2 pr-3 font-mono text-xs" }, K = { class: "py-2 pr-3" }, q = { class: "py-2" }, J = /* @__PURE__ */ v({
	__name: "index",
	setup(v) {
		let { t: J } = O(), Y = k(), X = A(), Z = d(() => ({
			direction: n(Y.query.direction),
			channel: n(Y.query.channel)
		})), Q = b({ ...Z.value });
		T(Z, (e) => {
			Object.assign(Q, e);
		});
		let $ = i(async (e, t) => o(await e.GET("/messages", { params: { query: {
			...Z.value,
			cursor: t
		} } })), Z), te = d(() => r.map((e) => ({
			label: J(`impex.directions.${e}`),
			value: e
		})));
		function ne() {
			X.replace({ query: {
				...Y.query,
				direction: Q.direction || void 0,
				channel: Q.channel || void 0
			} });
		}
		function re() {
			X.replace({ query: {
				...Y.query,
				direction: void 0,
				channel: void 0
			} });
		}
		return (n, r) => {
			let i = l, o = c, d = s, v = S("RouterLink"), b = a;
			return y(), m("div", j, [h("h1", M, C(w(J)("impex.messages.title")), 1), _(b, { "screen-key": "impex.messages" }, {
				default: E(() => [h("div", N, [h("form", {
					class: "atrium-querybar",
					"data-testid": "impex-messages-filters",
					onSubmit: D(ne, ["prevent"])
				}, [
					_(i, {
						modelValue: w(Q).direction,
						"onUpdate:modelValue": r[0] ||= (e) => w(Q).direction = e,
						items: w(te),
						placeholder: w(J)("impex.messages.all_directions"),
						class: "w-44",
						"aria-label": w(J)("impex.messages.direction")
					}, null, 8, [
						"modelValue",
						"items",
						"placeholder",
						"aria-label"
					]),
					_(o, {
						modelValue: w(Q).channel,
						"onUpdate:modelValue": r[1] ||= (e) => w(Q).channel = e,
						name: "channel",
						placeholder: w(J)("impex.messages.channel"),
						class: "w-48"
					}, null, 8, ["modelValue", "placeholder"]),
					_(d, {
						type: "submit",
						icon: "i-lucide-filter",
						"data-testid": "impex-messages-filter"
					}, {
						default: E(() => [g(C(w(J)("impex.common.filter")), 1)]),
						_: 1
					}),
					_(d, {
						variant: "ghost",
						"data-testid": "impex-messages-clear",
						onClick: re
					}, {
						default: E(() => [g(C(w(J)("impex.common.clear")), 1)]),
						_: 1
					})
				], 32), _(e, {
					error: w($).error.value,
					ready: !w($).pending.value || w($).rows.value.length > 0
				}, {
					default: E(() => [w($).rows.value.length === 0 ? (y(), m("p", P, C(w(J)("impex.messages.empty")), 1)) : (y(), m("table", F, [h("thead", I, [h("tr", null, [
						h("th", L, C(w(J)("impex.messages.direction")), 1),
						h("th", R, C(w(J)("impex.messages.channel")), 1),
						h("th", z, C(w(J)("impex.messages.endpoint")), 1),
						h("th", ee, C(w(J)("impex.messages.status_code")), 1),
						h("th", B, C(w(J)("impex.messages.when")), 1)
					])]), h("tbody", V, [(y(!0), m(u, null, x(w($).rows.value, (e) => (y(), m("tr", {
						key: e.id,
						"data-testid": `impex-message-row-${e.id}`
					}, [
						h("td", U, [_(v, {
							to: `/impex/messages/${encodeURIComponent(e.id)}`,
							class: "font-medium hover:underline"
						}, {
							default: E(() => [g(C(w(J)(`impex.directions.${e.direction}`)), 1)]),
							_: 2
						}, 1032, ["to"])]),
						h("td", W, C(e.channel), 1),
						h("td", G, C(e.method) + " " + C(e.endpoint), 1),
						h("td", K, C(e.status_code ?? w(J)("impex.common.none")), 1),
						h("td", q, C(w(t)(e.occurred_at)), 1)
					], 8, H))), 128))])])), w($).nextCursor.value ? (y(), f(d, {
						key: 2,
						variant: "outline",
						loading: w($).pending.value,
						"data-testid": "impex-load-more",
						onClick: w($).loadMore
					}, {
						default: E(() => [g(C(w(J)("impex.common.load_more")), 1)]),
						_: 1
					}, 8, ["loading", "onClick"])) : p("", !0)]),
					_: 1
				}, 8, ["error", "ready"])])]),
				_: 1
			})]);
		};
	}
});
export { J as default };
