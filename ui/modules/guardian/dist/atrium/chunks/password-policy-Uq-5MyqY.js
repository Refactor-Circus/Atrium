import { t as e } from "./GuardianState-DjXU16rU.js";
import { d as t, o as n } from "./guardian-Dugz84u2.js";
import { Fragment as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, createVNode as l, defineComponent as u, openBlock as d, renderList as f, toDisplayString as p, unref as m, withCtx as h } from "vue";
import { AtriumIntegrationScreen as g, useHead as _ } from "@refactor-circus/atrium";
import { UCard as v, UDashboardNavbar as y, UDashboardPanel as b } from "@refactor-circus/atrium/ui";
import { useI18n as x } from "vue-i18n";
// src/pages/password-policy/index.vue?vue&type=script&setup=true&lang.ts
var S = { class: "text-sm text-muted" }, C = { class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[16rem_1fr]" }, w = { class: "text-muted" }, T = { "data-testid": "guardian-password-length" }, E = { class: "text-muted" }, D = ["data-testid"], O = { class: "text-muted" }, k = { "data-testid": "guardian-password-uncompromised" }, A = { class: "text-muted" }, j = { "data-testid": "guardian-password-history" }, M = { class: "text-muted" }, N = { "data-testid": "guardian-password-max-age" }, P = /* @__PURE__ */ u({
	__name: "index",
	setup(u) {
		let { t: P } = x();
		_({ title: () => P("guardian.admin.password_policy.title") });
		let { data: F, pending: I, failed: L, status: R } = t(async (e) => n(await e.GET("/password-policy")).data), z = i(() => {
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
			let i = y, u = v, _ = g, x = b;
			return d(), a(x, null, {
				header: h(() => [l(i, { title: m(P)("guardian.admin.password_policy.title") }, null, 8, ["title"])]),
				body: h(() => [l(_, { "screen-key": "guardian.password-policy" }, {
					default: h(() => [l(e, {
						ready: !m(I) && m(F) !== null,
						failed: m(L),
						status: m(R)
					}, {
						default: h(() => [m(F) ? (d(), a(u, {
							key: 0,
							"data-testid": "guardian-password-policy"
						}, {
							header: h(() => [c("p", S, p(m(P)("guardian.admin.password_policy.read_only")), 1)]),
							default: h(() => [c("dl", C, [
								c("dt", w, p(m(P)("guardian.admin.password_policy.length")), 1),
								c("dd", T, p(m(P)("guardian.admin.password_policy.length_value", {
									min: m(F).min_length,
									max: m(F).max_length
								})), 1),
								(d(!0), s(r, null, f(m(z), (e) => (d(), s(r, { key: e.rule }, [c("dt", E, p(m(P)(`guardian.admin.password_policy.rules.${e.rule}`)), 1), c("dd", { "data-testid": `guardian-password-${e.rule}` }, p(B(e.on)), 9, D)], 64))), 128)),
								c("dt", O, p(m(P)("guardian.admin.password_policy.uncompromised")), 1),
								c("dd", k, p(m(F).uncompromised ? m(P)("guardian.admin.password_policy.uncompromised_on", { threshold: m(F).uncompromised_threshold }) : m(P)("guardian.admin.no")), 1),
								c("dt", A, p(m(P)("guardian.admin.password_policy.history")), 1),
								c("dd", j, p(m(F).history > 0 ? m(P)("guardian.admin.password_policy.history_value", { count: m(F).history }) : m(P)("guardian.admin.no")), 1),
								c("dt", M, p(m(P)("guardian.admin.password_policy.max_age")), 1),
								c("dd", N, p(m(F).max_age_days ? m(P)("guardian.admin.password_policy.max_age_value", { days: m(F).max_age_days }) : m(P)("guardian.admin.never")), 1)
							])]),
							_: 1
						})) : o("", !0)]),
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
