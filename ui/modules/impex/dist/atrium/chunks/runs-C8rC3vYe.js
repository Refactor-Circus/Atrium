import { t as e } from "./ImpexState-Mg53d6po.js";
import { t } from "./ImpexStatusBadge-ePLj75gE.js";
import { _ as n, a as r, f as i, g as a, o, x as s } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as c, integrationData as l } from "@refactor-circus/atrium";
import { UButton as u, UInput as d, USelect as ee } from "@refactor-circus/atrium/ui";
import { Fragment as te, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as y, openBlock as b, reactive as ne, renderList as x, resolveComponent as S, toDisplayString as C, unref as w, watch as T, withCtx as E, withModifiers as D } from "vue";
import { useI18n as O } from "vue-i18n";
import { useRoute as k, useRouter as A } from "vue-router";
// src/pages/runs/index.vue?vue&type=script&setup=true&lang.ts
var j = {
	class: "space-y-4",
	"data-testid": "impex-runs"
}, M = { class: "text-xl font-semibold" }, N = { class: "space-y-4" }, P = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "impex-runs-empty"
}, F = {
	key: 1,
	class: "w-full text-left text-sm"
}, I = { class: "text-muted" }, re = { class: "py-2 pr-3 font-medium" }, L = { class: "py-2 pr-3 font-medium" }, R = { class: "py-2 pr-3 font-medium" }, z = { class: "py-2 pr-3 font-medium" }, B = { class: "py-2 font-medium" }, V = { class: "divide-y divide-default" }, H = ["data-testid"], U = { class: "py-2 pr-3" }, W = { class: "py-2 pr-3" }, G = { class: "py-2 pr-3" }, K = { class: "py-2 pr-3" }, q = { class: "py-2" }, J = /* @__PURE__ */ y({
	__name: "index",
	setup(y) {
		let { t: J } = O(), Y = k(), X = A(), Z = f(() => ({
			status: a(Y.query.status),
			trigger: a(Y.query.trigger),
			flow: a(Y.query.flow)
		})), Q = ne({ ...Z.value });
		T(Z, (e) => {
			Object.assign(Q, e);
		});
		let $ = s(async (e, t) => l(await e.GET("/runs", { params: { query: {
			...Z.value,
			cursor: t
		} } })), Z), ie = f(() => r.map((e) => ({
			label: J(`impex.statuses.${e}`),
			value: e
		}))), ae = f(() => o.map((e) => ({
			label: e,
			value: e
		})));
		function oe() {
			X.replace({ query: {
				...Y.query,
				status: Q.status || void 0,
				trigger: Q.trigger || void 0,
				flow: Q.flow || void 0
			} });
		}
		function se() {
			X.replace({ query: {
				...Y.query,
				status: void 0,
				trigger: void 0,
				flow: void 0
			} });
		}
		return (r, a) => {
			let o = ee, s = d, l = u, f = S("RouterLink"), y = c;
			return b(), h("div", j, [g("h1", M, C(w(J)("impex.runs.title")), 1), v(y, { "screen-key": "impex.runs" }, {
				default: E(() => [g("div", N, [g("form", {
					class: "atrium-querybar",
					"data-testid": "impex-runs-filters",
					onSubmit: D(oe, ["prevent"])
				}, [
					v(o, {
						modelValue: w(Q).status,
						"onUpdate:modelValue": a[0] ||= (e) => w(Q).status = e,
						items: w(ie),
						placeholder: w(J)("impex.runs.all_statuses"),
						class: "w-44",
						"aria-label": w(J)("impex.runs.status")
					}, null, 8, [
						"modelValue",
						"items",
						"placeholder",
						"aria-label"
					]),
					v(o, {
						modelValue: w(Q).trigger,
						"onUpdate:modelValue": a[1] ||= (e) => w(Q).trigger = e,
						items: w(ae),
						placeholder: w(J)("impex.runs.all_triggers"),
						class: "w-40",
						"aria-label": w(J)("impex.runs.trigger")
					}, null, 8, [
						"modelValue",
						"items",
						"placeholder",
						"aria-label"
					]),
					v(s, {
						modelValue: w(Q).flow,
						"onUpdate:modelValue": a[2] ||= (e) => w(Q).flow = e,
						name: "flow",
						placeholder: w(J)("impex.runs.flow"),
						class: "w-48"
					}, null, 8, ["modelValue", "placeholder"]),
					v(l, {
						type: "submit",
						icon: "i-lucide-filter",
						"data-testid": "impex-runs-filter"
					}, {
						default: E(() => [_(C(w(J)("impex.common.filter")), 1)]),
						_: 1
					}),
					v(l, {
						variant: "ghost",
						"data-testid": "impex-runs-clear",
						onClick: se
					}, {
						default: E(() => [_(C(w(J)("impex.common.clear")), 1)]),
						_: 1
					})
				], 32), v(e, {
					error: w($).error.value,
					ready: !w($).pending.value || w($).rows.value.length > 0
				}, {
					default: E(() => [w($).rows.value.length === 0 ? (b(), h("p", P, C(w(J)("impex.runs.empty")), 1)) : (b(), h("table", F, [g("thead", I, [g("tr", null, [
						g("th", re, C(w(J)("impex.runs.flow")), 1),
						g("th", L, C(w(J)("impex.runs.status")), 1),
						g("th", R, C(w(J)("impex.runs.trigger")), 1),
						g("th", z, C(w(J)("impex.runs.started")), 1),
						g("th", B, C(w(J)("impex.runs.finished")), 1)
					])]), g("tbody", V, [(b(!0), h(te, null, x(w($).rows.value, (e) => (b(), h("tr", {
						key: e.id,
						"data-testid": `impex-run-row-${e.id}`
					}, [
						g("td", U, [v(f, {
							to: w(n)(e.id),
							class: "font-medium hover:underline"
						}, {
							default: E(() => [_(C(e.flow), 1)]),
							_: 2
						}, 1032, ["to"])]),
						g("td", W, [v(t, { status: e.status }, null, 8, ["status"])]),
						g("td", G, C(e.trigger), 1),
						g("td", K, C(w(i)(e.started_at) ?? w(J)("impex.common.none")), 1),
						g("td", q, C(w(i)(e.finished_at) ?? w(J)("impex.common.none")), 1)
					], 8, H))), 128))])])), w($).nextCursor.value ? (b(), p(l, {
						key: 2,
						variant: "outline",
						loading: w($).pending.value,
						"data-testid": "impex-load-more",
						onClick: w($).loadMore
					}, {
						default: E(() => [_(C(w(J)("impex.common.load_more")), 1)]),
						_: 1
					}, 8, ["loading", "onClick"])) : m("", !0)]),
					_: 1
				}, 8, ["error", "ready"])])]),
				_: 1
			})]);
		};
	}
});
export { J as default };
