import { a as e, i as t, t as n } from "./cortex-Bp7gHDgF.js";
import { t as r } from "./CortexActionError-BnFnixGr.js";
import { t as i } from "./CortexLoad-Bz-c2t3K.js";
import { t as a } from "./CortexPage-CtJD4yvP.js";
import { UButton as o, UCard as s, UFormField as c, UTextarea as l } from "@refactor-circus/atrium/ui";
import { Fragment as u, computed as d, createBlock as f, createCommentVNode as p, createElementBlock as m, createElementVNode as h, createVNode as g, defineComponent as _, isRef as v, openBlock as y, ref as b, renderList as x, shallowRef as S, toDisplayString as C, unref as w, vModelSelect as T, withCtx as E, withDirectives as ee, withModifiers as te } from "vue";
import { useI18n as ne } from "vue-i18n";
import { useRoute as D } from "vue-router";
// src/pages/run.vue?vue&type=script&setup=true&lang.ts
var O = { class: "flex max-w-2xl flex-col gap-5" }, k = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "cortex-no-runnable-agents"
}, A = {
	value: "",
	disabled: ""
}, j = ["value"], M = { class: "font-medium" }, N = {
	class: "overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs",
	"data-testid": "cortex-run-text"
}, P = {
	key: 0,
	class: "mt-4"
}, F = { class: "mb-2 text-sm font-semibold" }, I = {
	class: "w-full text-sm",
	"data-testid": "cortex-run-usage"
}, L = { class: "divide-y divide-default" }, R = { class: "py-1" }, z = { class: "py-1 text-right tabular-nums" }, B = /* @__PURE__ */ _({
	__name: "run",
	setup(_) {
		let { t: B } = ne(), V = D(), H = t(), { client: U, data: W, pending: G, failed: K, status: q } = e(async (e) => n(await e.GET("/runnable-agents")).data), J = d(() => W.value ?? []);
		function Y(e) {
			return `${e.type === "concrete_agent" ? "concrete" : "virtual"}:${e.key}`;
		}
		let X = b(typeof V.query.agent == "string" ? V.query.agent : ""), Z = b(""), Q = S(null), $ = d(() => {
			let e = Q.value?.usage;
			return e && typeof e == "object" ? Object.entries(e).map(([e, t]) => ({
				key: e,
				value: typeof t == "object" ? JSON.stringify(t) : String(t)
			})) : [];
		});
		async function re() {
			let [e, t] = X.value.split(/:(.*)/s);
			U && t && (Q.value = null, await H.run(async () => {
				let r = e === "concrete" ? await U.POST("/concrete-agents/{agent}/run", {
					params: { path: { agent: t } },
					body: { input: Z.value }
				}) : await U.POST("/virtual-agents/{agent}/run", {
					params: { path: { agent: t } },
					body: { input: Z.value }
				});
				Q.value = n(r).data;
			}));
		}
		return (e, t) => {
			let n = c, d = l, _ = o, b = s;
			return y(), f(a, {
				title: w(B)("cortex.run.title"),
				"screen-key": "cortex.run"
			}, {
				default: E(() => [g(i, {
					ready: !w(G),
					failed: w(K),
					status: w(q)
				}, {
					default: E(() => [h("div", O, [w(J).length === 0 ? (y(), m("p", k, C(w(B)("cortex.run.none")), 1)) : (y(), f(b, { key: 1 }, {
						default: E(() => [h("form", {
							class: "flex flex-col gap-4",
							"data-testid": "cortex-run-form",
							onSubmit: te(re, ["prevent"])
						}, [
							g(r, {
								forbidden: w(H).forbidden.value,
								message: w(H).message.value
							}, null, 8, ["forbidden", "message"]),
							g(n, {
								label: w(B)("cortex.run.agent"),
								error: w(H).error("agent"),
								required: ""
							}, {
								default: E(() => [ee(h("select", {
									"onUpdate:modelValue": t[0] ||= (e) => v(X) ? X.value = e : null,
									class: "w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
									"data-testid": "cortex-run-agent-select"
								}, [h("option", A, C(w(B)("cortex.run.select_agent")), 1), (y(!0), m(u, null, x(w(J), (e) => (y(), m("option", {
									key: Y(e),
									value: Y(e)
								}, C(e.name), 9, j))), 128))], 512), [[T, w(X)]])]),
								_: 1
							}, 8, ["label", "error"]),
							g(n, {
								label: w(B)("cortex.run.input"),
								error: w(H).error("input"),
								required: ""
							}, {
								default: E(() => [g(d, {
									modelValue: w(Z),
									"onUpdate:modelValue": t[1] ||= (e) => v(Z) ? Z.value = e : null,
									rows: 6,
									class: "w-full",
									"data-testid": "cortex-run-input"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]),
							h("div", null, [g(_, {
								type: "submit",
								icon: "i-lucide-play",
								label: w(B)("cortex.run.run"),
								loading: w(H).busy.value,
								disabled: w(X) === "",
								"data-testid": "cortex-run"
							}, null, 8, [
								"label",
								"loading",
								"disabled"
							])])
						], 32)]),
						_: 1
					})), w(Q) ? (y(), f(b, {
						key: 2,
						"data-testid": "cortex-run-result"
					}, {
						header: E(() => [h("h3", M, C(w(B)("cortex.run.response")), 1)]),
						default: E(() => [h("pre", N, C(w(Q).text), 1), w($).length ? (y(), m("div", P, [h("h4", F, C(w(B)("cortex.run.usage")), 1), h("table", I, [h("tbody", L, [(y(!0), m(u, null, x(w($), (e) => (y(), m("tr", { key: e.key }, [h("td", R, C(e.key), 1), h("td", z, C(e.value), 1)]))), 128))])])])) : p("", !0)]),
						_: 1
					})) : p("", !0)])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, ["title"]);
		};
	}
});
export { B as default };
