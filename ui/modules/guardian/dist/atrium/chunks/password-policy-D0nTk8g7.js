import { t as e } from "./GuardianState-DytBr9ih.js";
import { d as t, o as n } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as r, useHead as i } from "@refactor-circus/atrium";
import { Fragment as a, computed as o, createBlock as s, createCommentVNode as c, createElementBlock as l, createElementVNode as u, createVNode as d, defineComponent as f, openBlock as p, renderList as m, toDisplayString as h, unref as g, withCtx as _ } from "vue";
import { UCard as v, UDashboardNavbar as y, UDashboardPanel as b } from "@refactor-circus/atrium/ui";
import { useI18n as x } from "vue-i18n";
// src/pages/password-policy/index.vue?vue&type=script&setup=true&lang.ts
var S = { class: "text-sm text-muted" }, C = { class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[16rem_1fr]" }, w = { class: "text-muted" }, T = { "data-testid": "guardian-password-length" }, E = { class: "text-muted" }, D = ["data-testid"], O = { class: "text-muted" }, k = { "data-testid": "guardian-password-uncompromised" }, A = { class: "text-muted" }, j = { "data-testid": "guardian-password-history" }, M = { class: "text-muted" }, N = { "data-testid": "guardian-password-max-age" }, P = /* @__PURE__ */ f({
	__name: "index",
	setup(f) {
		let { t: P } = x();
		i({ title: () => P("guardian.admin.password_policy.title") });
		let { data: F, pending: I, failed: L, status: R } = t(async (e) => n(await e.GET("/password-policy")).data), z = o(() => {
			let e = F.value;
			return e ? [
				"letters",
				"mixed_case",
				"numbers",
				"symbols"
			].map((t) => ({
				rule: t,
				on: e[t]
			})) : [];
		});
		function B(e) {
			return P(e ? "guardian.admin.yes" : "guardian.admin.no");
		}
		return (t, n) => {
			let i = y, o = v, f = r, x = b;
			return p(), s(x, null, {
				header: _(() => [d(i, { title: g(P)("guardian.admin.password_policy.title") }, null, 8, ["title"])]),
				body: _(() => [d(f, { "screen-key": "guardian.password-policy" }, {
					default: _(() => [d(e, {
						ready: !g(I) && g(F) !== null,
						failed: g(L),
						status: g(R)
					}, {
						default: _(() => [g(F) ? (p(), s(o, {
							key: 0,
							"data-testid": "guardian-password-policy"
						}, {
							header: _(() => [u("p", S, h(g(P)("guardian.admin.password_policy.read_only")), 1)]),
							default: _(() => [u("dl", C, [
								u("dt", w, h(g(P)("guardian.admin.password_policy.length")), 1),
								u("dd", T, h(g(P)("guardian.admin.password_policy.length_value", {
									min: g(F).min_length,
									max: g(F).max_length
								})), 1),
								(p(!0), l(a, null, m(g(z), (e) => (p(), l(a, { key: e.rule }, [u("dt", E, h(g(P)(`guardian.admin.password_policy.rules.${e.rule}`)), 1), u("dd", { "data-testid": `guardian-password-${e.rule}` }, h(B(e.on)), 9, D)], 64))), 128)),
								u("dt", O, h(g(P)("guardian.admin.password_policy.uncompromised")), 1),
								u("dd", k, h(g(F).uncompromised ? g(P)("guardian.admin.password_policy.uncompromised_on", { threshold: g(F).uncompromised_threshold }) : g(P)("guardian.admin.no")), 1),
								u("dt", A, h(g(P)("guardian.admin.password_policy.history")), 1),
								u("dd", j, h(g(F).history > 0 ? g(P)("guardian.admin.password_policy.history_value", { count: g(F).history }) : g(P)("guardian.admin.no")), 1),
								u("dt", M, h(g(P)("guardian.admin.password_policy.max_age")), 1),
								u("dd", N, h(g(F).max_age_days ? g(P)("guardian.admin.password_policy.max_age_value", { days: g(F).max_age_days }) : g(P)("guardian.admin.never")), 1)
							])]),
							_: 1
						})) : c("", !0)]),
						_: 1
					}, 8, [
						"ready",
						"failed",
						"status"
					])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { P as default };
