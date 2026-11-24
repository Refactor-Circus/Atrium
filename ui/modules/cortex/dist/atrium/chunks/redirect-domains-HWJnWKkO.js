import { a as e, i as t, t as n } from "./cortex-Bp7gHDgF.js";
import { t as r } from "./CortexActionError-BnFnixGr.js";
import { t as i } from "./CortexLoad-Bz-c2t3K.js";
import { t as a } from "./CortexPage-CtJD4yvP.js";
import { UBadge as o, UButton as s, UCard as c, UFormField as l, UInput as u } from "@refactor-circus/atrium/ui";
import { Fragment as d, computed as f, createBlock as p, createElementBlock as m, createElementVNode as h, createTextVNode as ee, createVNode as g, defineComponent as _, isRef as v, openBlock as y, ref as b, renderList as te, toDisplayString as x, unref as S, withCtx as C, withModifiers as w } from "vue";
import { useI18n as T } from "vue-i18n";
// src/pages/redirect-domains.vue?vue&type=script&setup=true&lang.ts
var E = { class: "flex flex-col gap-4" }, D = { class: "font-medium" }, O = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "cortex-empty"
}, k = {
	key: 1,
	class: "w-full text-sm",
	"data-testid": "cortex-redirect-domains"
}, A = { class: "text-left text-muted" }, j = { class: "py-2" }, M = { class: "py-2" }, N = { class: "py-2" }, P = { class: "py-2 text-right" }, F = { class: "divide-y divide-default" }, ne = ["data-testid"], I = { class: "py-2" }, L = { class: "text-xs" }, R = { class: "py-2" }, z = { key: 0 }, B = { class: "text-xs text-muted" }, V = { class: "py-2" }, H = { class: "py-2 text-right" }, U = /* @__PURE__ */ _({
	__name: "redirect-domains",
	setup(_) {
		let { t: U } = T(), W = t(), G = W.busy, K = b(""), { client: q, data: J, pending: Y, failed: X, status: Z, reload: Q } = e(async (e) => n(await e.GET("/redirect-domains")).data), $ = f(() => J.value ?? []);
		async function re() {
			q && await W.run(async () => n(await q.POST("/redirect-domains", { body: { domain: K.value } }))) && (K.value = "", await Q());
		}
		async function ie(e) {
			q && await W.run(async () => n(await q.DELETE("/redirect-domains/{domain}", { params: { path: { domain: e.id } } }))) && await Q();
		}
		return (e, t) => {
			let n = u, f = l, _ = s, b = c, T = o;
			return y(), p(a, {
				title: S(U)("cortex.redirect_domains.title"),
				"screen-key": "cortex.redirect-domains",
				description: S(U)("cortex.redirect_domains.description")
			}, {
				default: C(() => [g(i, {
					ready: !S(Y),
					failed: S(X),
					status: S(Z)
				}, {
					default: C(() => [h("div", E, [
						g(r, {
							forbidden: S(W).forbidden.value,
							message: S(W).message.value
						}, null, 8, ["forbidden", "message"]),
						g(b, null, {
							header: C(() => [h("h3", D, x(S(U)("cortex.redirect_domains.add")), 1)]),
							default: C(() => [h("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "cortex-add-domain-form",
								onSubmit: w(re, ["prevent"])
							}, [g(f, {
								label: S(U)("cortex.redirect_domains.domain"),
								hint: S(U)("cortex.redirect_domains.domain_hint"),
								error: S(W).error("domain"),
								class: "w-80",
								required: ""
							}, {
								default: C(() => [g(n, {
									modelValue: S(K),
									"onUpdate:modelValue": t[0] ||= (e) => v(K) ? K.value = e : null,
									placeholder: "https://claude.ai",
									class: "w-full",
									"data-testid": "cortex-domain"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, [
								"label",
								"hint",
								"error"
							]), g(_, {
								type: "submit",
								icon: "i-lucide-plus",
								label: S(U)("cortex.redirect_domains.add"),
								loading: S(G),
								"data-testid": "cortex-add-domain"
							}, null, 8, ["label", "loading"])], 32)]),
							_: 1
						}),
						S($).length === 0 ? (y(), m("p", O, x(S(U)("cortex.redirect_domains.empty")), 1)) : (y(), m("table", k, [h("thead", A, [h("tr", null, [
							h("th", j, x(S(U)("cortex.redirect_domains.domain")), 1),
							h("th", M, x(S(U)("cortex.redirect_domains.source")), 1),
							h("th", N, x(S(U)("cortex.redirect_domains.created")), 1),
							h("th", P, x(S(U)("cortex.actions")), 1)
						])]), h("tbody", F, [(y(!0), m(d, null, te(S($), (e) => (y(), m("tr", {
							key: e.id,
							"data-testid": `cortex-domain-${e.id}`
						}, [
							h("td", I, [h("code", L, x(e.domain), 1)]),
							h("td", R, [e.owner_type ? (y(), m("span", z, [ee(x(e.owner_id) + " ", 1), h("span", B, x(e.owner_type), 1)])) : (y(), p(T, {
								key: 1,
								color: "neutral",
								variant: "subtle",
								label: S(U)("cortex.redirect_domains.global")
							}, null, 8, ["label"]))]),
							h("td", V, x(e.created_at ?? "—"), 1),
							h("td", H, [g(_, {
								size: "xs",
								color: "neutral",
								variant: "ghost",
								icon: "i-lucide-trash",
								label: S(U)("cortex.redirect_domains.remove"),
								"data-testid": `cortex-remove-domain-${e.id}`,
								onClick: (t) => ie(e)
							}, null, 8, [
								"label",
								"data-testid",
								"onClick"
							])])
						], 8, ne))), 128))])]))
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, ["title", "description"]);
		};
	}
});
export { U as default };
