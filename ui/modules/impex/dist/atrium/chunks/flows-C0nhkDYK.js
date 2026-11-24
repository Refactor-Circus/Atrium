import { t as e } from "./ImpexFlash-BLiiWCOe.js";
import { t } from "./ImpexState-Mg53d6po.js";
import { S as n, _ as r, b as i, h as a, m as o } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as s, integrationData as c } from "@refactor-circus/atrium";
import { UBadge as l, UButton as u, UInput as d } from "@refactor-circus/atrium/ui";
import { Fragment as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, defineComponent as _, openBlock as v, reactive as y, renderList as b, toDisplayString as x, unref as S, withCtx as C, withModifiers as w } from "vue";
import { useI18n as T } from "vue-i18n";
import { useRouter as E } from "vue-router";
// src/pages/flows/index.vue?vue&type=script&setup=true&lang.ts
var D = {
	class: "space-y-4",
	"data-testid": "impex-flows"
}, O = { class: "text-xl font-semibold" }, k = { class: "space-y-4" }, A = {
	key: 0,
	class: "text-sm text-muted"
}, j = {
	key: 1,
	class: "w-full text-left text-sm"
}, M = { class: "text-muted" }, N = { class: "py-2 pr-3 font-medium" }, P = { class: "py-2 pr-3 font-medium" }, F = { class: "py-2 pr-3 font-medium" }, I = { class: "py-2 font-medium" }, L = { class: "divide-y divide-default" }, R = ["data-testid"], z = { class: "py-2 pr-3" }, B = { class: "font-medium" }, V = { class: "font-mono text-xs text-muted" }, H = { class: "py-2 pr-3 font-mono text-xs" }, U = { class: "py-2 pr-3" }, W = { class: "py-2" }, G = ["data-testid", "onSubmit"], K = /* @__PURE__ */ _({
	__name: "index",
	setup(_) {
		let { t: K } = T(), q = E(), J = n(async (e) => c(await e.GET("/flows")).data), Y = i(), X = y({});
		async function Z(e) {
			let t = J.client, n = a(X[e] ?? "");
			if (!t) return;
			let i = n && "value" in n ? n.value : void 0;
			if (n && (typeof i != "object" || !i)) {
				Y.invalid("arguments", K("impex.flows.arguments_invalid"));
				return;
			}
			let s = o(i === void 0 ? {} : { arguments: i });
			await Y.run(async () => c(await t.POST("/flows/{flow}/runs", {
				params: { path: { flow: e } },
				body: s
			})), async (t) => {
				X[e] = "", await q.push(r(t.data.id));
			});
		}
		return (n, r) => {
			let i = l, a = d, o = u, c = s;
			return v(), p("div", D, [m("h1", O, x(S(K)("impex.flows.title")), 1), g(c, { "screen-key": "impex.flows" }, {
				default: C(() => [m("div", k, [g(e, { action: S(Y) }, null, 8, ["action"]), g(t, {
					error: S(J).error.value,
					ready: S(J).data.value !== null
				}, {
					default: C(() => [(S(J).data.value ?? []).length === 0 ? (v(), p("p", A, x(S(K)("impex.flows.empty")), 1)) : (v(), p("table", j, [m("thead", M, [m("tr", null, [
						m("th", N, x(S(K)("impex.flows.slug")), 1),
						m("th", P, x(S(K)("impex.flows.schedule")), 1),
						m("th", F, x(S(K)("impex.flows.state")), 1),
						m("th", I, x(S(K)("impex.flows.run")), 1)
					])]), m("tbody", L, [(v(!0), p(f, null, b(S(J).data.value, (e) => (v(), p("tr", {
						key: e.slug,
						"data-testid": `impex-flow-row-${e.slug}`
					}, [
						m("td", z, [m("p", B, x(e.slug), 1), m("p", V, x(e.class), 1)]),
						m("td", H, x(e.schedule ?? S(K)("impex.common.none")), 1),
						m("td", U, [g(i, {
							color: e.enabled ? "success" : "neutral",
							variant: "subtle"
						}, {
							default: C(() => [h(x(e.enabled ? S(K)("impex.flows.enabled") : S(K)("impex.flows.disabled")), 1)]),
							_: 2
						}, 1032, ["color"])]),
						m("td", W, [m("form", {
							class: "flex items-center gap-2",
							"data-testid": `impex-flow-run-${e.slug}`,
							onSubmit: w((t) => Z(e.slug), ["prevent"])
						}, [g(a, {
							modelValue: S(X)[e.slug],
							"onUpdate:modelValue": (t) => S(X)[e.slug] = t,
							name: "arguments",
							placeholder: S(K)("impex.flows.arguments"),
							size: "sm",
							class: "w-56"
						}, null, 8, [
							"modelValue",
							"onUpdate:modelValue",
							"placeholder"
						]), g(o, {
							type: "submit",
							size: "sm",
							icon: "i-lucide-play",
							loading: S(Y).busy.value
						}, {
							default: C(() => [h(x(S(K)("impex.flows.run")), 1)]),
							_: 1
						}, 8, ["loading"])], 40, G)])
					], 8, R))), 128))])]))]),
					_: 1
				}, 8, ["error", "ready"])])]),
				_: 1
			})]);
		};
	}
});
export { K as default };
