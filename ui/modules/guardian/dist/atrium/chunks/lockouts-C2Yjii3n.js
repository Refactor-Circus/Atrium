import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianEventList-CgC-DVe6.js";
import { t as n } from "./admin-_cLX5Zre.js";
import { c as r, l as i, o as a, u as o } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as s, useHead as c } from "@refactor-circus/atrium";
import { createBlock as l, createCommentVNode as u, createElementVNode as d, createTextVNode as f, createVNode as p, defineComponent as m, isRef as h, openBlock as g, ref as _, toDisplayString as v, unref as y, withCtx as b, withModifiers as x } from "vue";
import { UAlert as S, UButton as C, UCard as w, UDashboardNavbar as T, UDashboardPanel as E, UFormField as D, UInput as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
// src/pages/lockouts/index.vue?vue&type=script&setup=true&lang.ts
var A = {
	class: "space-y-4",
	"data-testid": "guardian-lockouts"
}, j = { class: "font-semibold" }, M = { class: "text-sm text-muted" }, N = { class: "mt-3" }, P = { class: "font-semibold" }, F = /* @__PURE__ */ m({
	__name: "index",
	setup(m) {
		let { t: F } = k(), I = i(), L = o();
		c({ title: () => F("guardian.admin.lockouts.title") });
		let R = _(""), z = _(null), B = { type: n };
		async function V() {
			let e = R.value.trim();
			z.value = null, I && e !== "" && window.confirm(F("guardian.admin.lockouts.confirm", { identifier: e })) && await L.run(async () => a(await I.DELETE("/lockouts", r({ body: { identifier: e } })))) && (z.value = e, R.value = "");
		}
		return (n, r) => {
			let i = T, a = O, o = D, c = C, m = S, _ = w, k = s, I = E;
			return g(), l(I, null, {
				header: b(() => [p(i, { title: y(F)("guardian.admin.lockouts.title") }, null, 8, ["title"])]),
				body: b(() => [p(k, { "screen-key": "guardian.lockouts" }, {
					default: b(() => [d("div", A, [p(_, null, {
						header: b(() => [d("h2", j, v(y(F)("guardian.admin.lockouts.clear")), 1), d("p", M, v(y(F)("guardian.admin.lockouts.hint")), 1)]),
						default: b(() => [
							d("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "guardian-lockout-form",
								onSubmit: x(V, ["prevent"])
							}, [p(o, {
								label: y(F)("guardian.admin.lockouts.identifier"),
								error: y(L).error("identifier"),
								required: ""
							}, {
								default: b(() => [p(a, {
									modelValue: y(R),
									"onUpdate:modelValue": r[0] ||= (e) => h(R) ? R.value = e : null,
									class: "w-72",
									autocomplete: "off",
									"data-testid": "guardian-lockout-identifier"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]), p(c, {
								type: "submit",
								icon: "i-lucide-lock-open",
								loading: y(L).busy.value,
								"data-testid": "guardian-lockout-submit"
							}, {
								default: b(() => [f(v(y(F)("guardian.admin.lockouts.submit")), 1)]),
								_: 1
							}, 8, ["loading"])], 32),
							y(z) ? (g(), l(m, {
								key: 0,
								class: "mt-3",
								color: "success",
								variant: "subtle",
								title: y(F)("guardian.admin.lockouts.cleared", { identifier: y(z) }),
								"data-testid": "guardian-lockout-cleared"
							}, null, 8, ["title"])) : u("", !0),
							d("div", N, [y(L).errors.value.identifier === void 0 ? (g(), l(e, {
								key: 0,
								action: y(L),
								testid: "guardian-lockout"
							}, null, 8, ["action"])) : u("", !0)])
						]),
						_: 1
					}), p(_, null, {
						header: b(() => [d("h2", P, v(y(F)("guardian.admin.lockouts.recent")), 1)]),
						default: b(() => [p(t, {
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
