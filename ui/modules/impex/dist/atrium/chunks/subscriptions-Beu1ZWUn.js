import { t as e } from "./ImpexState-Mg53d6po.js";
import { t } from "./ImpexStatusBadge-ePLj75gE.js";
import { d as n, f as ee, g as r, s as i, x as a, y as o } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as s, integrationData as c } from "@refactor-circus/atrium";
import { UButton as te, UInput as ne, USelect as re } from "@refactor-circus/atrium/ui";
import { Fragment as ie, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, openBlock as _, reactive as v, renderList as y, resolveComponent as b, toDisplayString as x, unref as S, watch as C, withCtx as w, withModifiers as T } from "vue";
import { useI18n as E } from "vue-i18n";
import { useRoute as D, useRouter as O } from "vue-router";
// src/pages/subscriptions/index.vue?vue&type=script&setup=true&lang.ts
var k = {
	class: "space-y-4",
	"data-testid": "impex-subscriptions"
}, A = { class: "text-xl font-semibold" }, j = { class: "space-y-4" }, M = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "impex-subscriptions-empty"
}, N = {
	key: 1,
	class: "w-full text-left text-sm"
}, P = { class: "text-muted" }, ae = { class: "py-2 pr-3 font-medium" }, F = { class: "py-2 pr-3 font-medium" }, I = { class: "py-2 pr-3 font-medium" }, L = { class: "py-2 pr-3 font-medium" }, R = { class: "py-2 pr-3 font-medium" }, z = { class: "py-2 font-medium" }, B = { class: "divide-y divide-default" }, V = ["data-testid"], H = { class: "py-2 pr-3" }, U = { class: "py-2 pr-3 font-mono text-xs" }, W = { class: "max-w-xs truncate py-2 pr-3" }, G = { class: "py-2 pr-3" }, K = { class: "py-2 pr-3 tabular-nums" }, q = { class: "py-2" }, J = /* @__PURE__ */ g({
	__name: "index",
	setup(g) {
		let { t: J } = E(), Y = D(), X = O(), Z = l(() => ({
			stream: r(Y.query.stream),
			status: r(Y.query.status)
		})), Q = v({ ...Z.value });
		C(Z, (e) => {
			Object.assign(Q, e);
		});
		let $ = a(async (e, t) => c(await e.GET("/subscriptions", { params: { query: {
			...Z.value,
			cursor: t
		} } })), Z), oe = l(() => i.map((e) => ({
			label: J(`impex.statuses.${e}`),
			value: e
		})));
		function se() {
			X.replace({ query: {
				...Y.query,
				stream: Q.stream || void 0,
				status: Q.status || void 0
			} });
		}
		function ce() {
			X.replace({ query: {
				...Y.query,
				stream: void 0,
				status: void 0
			} });
		}
		return (r, i) => {
			let a = ne, c = re, l = te, g = b("RouterLink"), v = s;
			return _(), f("div", k, [p("h1", A, x(S(J)("impex.subscriptions.title")), 1), h(v, { "screen-key": "impex.subscriptions" }, {
				default: w(() => [p("div", j, [p("form", {
					class: "atrium-querybar",
					"data-testid": "impex-subscriptions-filters",
					onSubmit: T(se, ["prevent"])
				}, [
					h(a, {
						modelValue: S(Q).stream,
						"onUpdate:modelValue": i[0] ||= (e) => S(Q).stream = e,
						name: "stream",
						placeholder: S(J)("impex.subscriptions.stream"),
						class: "w-48"
					}, null, 8, ["modelValue", "placeholder"]),
					h(c, {
						modelValue: S(Q).status,
						"onUpdate:modelValue": i[1] ||= (e) => S(Q).status = e,
						items: S(oe),
						placeholder: S(J)("impex.subscriptions.all_statuses"),
						class: "w-44",
						"aria-label": S(J)("impex.subscriptions.status")
					}, null, 8, [
						"modelValue",
						"items",
						"placeholder",
						"aria-label"
					]),
					h(l, {
						type: "submit",
						icon: "i-lucide-filter",
						"data-testid": "impex-subscriptions-filter"
					}, {
						default: w(() => [m(x(S(J)("impex.common.filter")), 1)]),
						_: 1
					}),
					h(l, {
						variant: "ghost",
						"data-testid": "impex-subscriptions-clear",
						onClick: ce
					}, {
						default: w(() => [m(x(S(J)("impex.common.clear")), 1)]),
						_: 1
					})
				], 32), h(e, {
					error: S($).error.value,
					ready: !S($).pending.value || S($).rows.value.length > 0
				}, {
					default: w(() => [S($).rows.value.length === 0 ? (_(), f("p", M, x(S(J)("impex.subscriptions.empty")), 1)) : (_(), f("table", N, [p("thead", P, [p("tr", null, [
						p("th", ae, x(S(J)("impex.subscriptions.stream")), 1),
						p("th", F, x(S(J)("impex.subscriptions.subscriber")), 1),
						p("th", I, x(S(J)("impex.subscriptions.endpoint")), 1),
						p("th", L, x(S(J)("impex.subscriptions.status")), 1),
						p("th", R, x(S(J)("impex.subscriptions.failures")), 1),
						p("th", z, x(S(J)("impex.subscriptions.last_delivered")), 1)
					])]), p("tbody", B, [(_(!0), f(ie, null, y(S($).rows.value, (e) => (_(), f("tr", {
						key: e.id,
						"data-testid": `impex-subscription-row-${e.id}`
					}, [
						p("td", H, [h(g, {
							to: S(o)(e.id),
							class: "font-medium hover:underline"
						}, {
							default: w(() => [m(x(e.stream), 1)]),
							_: 2
						}, 1032, ["to"])]),
						p("td", U, x(e.subscriber_id), 1),
						p("td", W, x(S(n)(e.endpoint) ?? S(J)("impex.subscriptions.feed_only")), 1),
						p("td", G, [h(t, { status: e.status }, null, 8, ["status"])]),
						p("td", K, x(e.failures), 1),
						p("td", q, x(S(ee)(e.last_delivered_at) ?? S(J)("impex.common.none")), 1)
					], 8, V))), 128))])])), S($).nextCursor.value ? (_(), u(l, {
						key: 2,
						variant: "outline",
						loading: S($).pending.value,
						"data-testid": "impex-load-more",
						onClick: S($).loadMore
					}, {
						default: w(() => [m(x(S(J)("impex.common.load_more")), 1)]),
						_: 1
					}, 8, ["loading", "onClick"])) : d("", !0)]),
					_: 1
				}, 8, ["error", "ready"])])]),
				_: 1
			})]);
		};
	}
});
export { J as default };
