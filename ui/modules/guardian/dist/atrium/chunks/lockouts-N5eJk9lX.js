import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { t } from "./GuardianEventList-DFBFIdtO.js";
import { t as n } from "./admin-_cLX5Zre.js";
import { c as r, l as i, o as a, u as o } from "./guardian-Dugz84u2.js";
import { createBlock as s, createCommentVNode as c, createElementVNode as l, createTextVNode as u, createVNode as d, defineComponent as f, isRef as p, openBlock as m, ref as h, toDisplayString as g, unref as _, withCtx as v, withModifiers as y } from "vue";
import { AtriumIntegrationScreen as b, useHead as x } from "@refactor-circus/atrium";
import { UAlert as S, UButton as C, UCard as w, UDashboardNavbar as T, UDashboardPanel as E, UFormField as D, UInput as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
// src/pages/lockouts/index.vue?vue&type=script&setup=true&lang.ts
var A = {
	class: "space-y-4",
	"data-testid": "guardian-lockouts"
}, j = { class: "font-semibold" }, M = { class: "text-sm text-muted" }, N = { class: "mt-3" }, P = { class: "font-semibold" }, F = /* @__PURE__ */ f({
	__name: "index",
	setup(f) {
		let { t: F } = k(), I = i(), L = o();
		x({ title: () => F("guardian.admin.lockouts.title") });
		let R = h(""), z = h(null), B = { type: n };
		async function V() {
			let e = R.value.trim();
			z.value = null, I && e !== "" && window.confirm(F("guardian.admin.lockouts.confirm", { identifier: e })) && await L.run(async () => a(await I.DELETE("/lockouts", r({ body: { identifier: e } })))) && (z.value = e, R.value = "");
		}
		return (n, r) => {
			let i = T, a = O, o = D, f = C, h = S, x = w, k = b, I = E;
			return m(), s(I, null, {
				header: v(() => [d(i, { title: _(F)("guardian.admin.lockouts.title") }, null, 8, ["title"])]),
				body: v(() => [d(k, { "screen-key": "guardian.lockouts" }, {
					default: v(() => [l("div", A, [d(x, null, {
						header: v(() => [l("h2", j, g(_(F)("guardian.admin.lockouts.clear")), 1), l("p", M, g(_(F)("guardian.admin.lockouts.hint")), 1)]),
						default: v(() => [
							l("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "guardian-lockout-form",
								onSubmit: y(V, ["prevent"])
							}, [d(o, {
								label: _(F)("guardian.admin.lockouts.identifier"),
								error: _(L).error("identifier"),
								required: ""
							}, {
								default: v(() => [d(a, {
									modelValue: _(R),
									"onUpdate:modelValue": r[0] ||= (e) => p(R) ? R.value = e : null,
									class: "w-72",
									autocomplete: "off",
									"data-testid": "guardian-lockout-identifier"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]), d(f, {
								type: "submit",
								icon: "i-lucide-lock-open",
								loading: _(L).busy.value,
								"data-testid": "guardian-lockout-submit"
							}, {
								default: v(() => [u(g(_(F)("guardian.admin.lockouts.submit")), 1)]),
								_: 1
							}, 8, ["loading"])], 32),
							_(z) ? (m(), s(h, {
								key: 0,
								class: "mt-3",
								color: "success",
								variant: "subtle",
								title: _(F)("guardian.admin.lockouts.cleared", { identifier: _(z) }),
								"data-testid": "guardian-lockout-cleared"
							}, null, 8, ["title"])) : c("", !0),
							l("div", N, [_(L).errors.value.identifier === void 0 ? (m(), s(e, {
								key: 0,
								action: _(L),
								testid: "guardian-lockout"
							}, null, 8, ["action"])) : c("", !0)])
						]),
						_: 1
					}), d(x, null, {
						header: v(() => [l("h2", P, g(_(F)("guardian.admin.lockouts.recent")), 1)]),
						default: v(() => [d(t, {
							filters: B,
							testid: "guardian-lockout-events"
						})]),
						_: 1
					})])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { F as default };
