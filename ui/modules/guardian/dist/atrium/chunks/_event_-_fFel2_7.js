import { i as e } from "./admin-_cLX5Zre.js";
import { u as t } from "./access-Dcd3BQGu.js";
import { t as n } from "./GuardianState-DjXU16rU.js";
import { d as r, i, o as a } from "./guardian-Dugz84u2.js";
import { Fragment as o, computed as s, createBlock as c, createCommentVNode as ee, createElementBlock as l, createElementVNode as u, createTextVNode as d, createVNode as f, defineComponent as p, openBlock as m, renderList as h, resolveComponent as g, toDisplayString as _, unref as v, withCtx as y } from "vue";
import { AtriumIntegrationScreen as b, useHead as x } from "@refactor-circus/atrium";
import { useRoute as S } from "vue-router";
import { UButton as C, UCard as w, UDashboardNavbar as T, UDashboardPanel as E } from "@refactor-circus/atrium/ui";
import { useI18n as D } from "vue-i18n";
// src/pages/security-events/[event].vue?vue&type=script&setup=true&lang.ts
var O = {
	key: 0,
	class: "space-y-4",
	"data-testid": "guardian-security-event"
}, k = { class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]" }, A = { class: "text-muted" }, j = {
	class: "font-mono",
	"data-testid": "guardian-event-type"
}, M = { class: "text-muted" }, N = { "data-testid": "guardian-event-user" }, P = { key: 1 }, F = { class: "text-muted" }, I = { class: "text-muted" }, L = { class: "break-all" }, R = { class: "text-muted" }, z = { class: "break-all font-mono text-xs" }, B = { class: "text-muted" }, V = { class: "font-semibold" }, H = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-event-context-empty"
}, U = {
	key: 1,
	class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]",
	"data-testid": "guardian-event-context"
}, W = { class: "font-mono text-muted" }, G = ["data-testid"], K = /* @__PURE__ */ p({
	__name: "[event]",
	setup(p) {
		let { t: K } = D(), q = S(), J = s(() => String(q.params.event)), { data: Y, pending: X, failed: Z, status: Q } = r(async (e) => a(await e.GET("/security-events/{event}", { params: { path: { event: J.value } } })).data, J), $ = s(() => Object.entries(Y.value?.context ?? {}));
		return x({ title: () => Y.value?.type ?? K("guardian.admin.event.title") }), (r, a) => {
			let s = C, p = T, x = g("RouterLink"), S = w, D = b, q = E;
			return m(), c(q, null, {
				header: y(() => [f(p, { title: v(Y)?.type ?? v(K)("guardian.admin.event.title") }, {
					leading: y(() => [f(s, {
						to: "/guardian/security-events",
						variant: "ghost",
						icon: "i-lucide-arrow-left",
						"aria-label": v(K)("guardian.admin.events.title"),
						"data-testid": "guardian-event-back"
					}, null, 8, ["aria-label"])]),
					_: 1
				}, 8, ["title"])]),
				body: y(() => [f(D, {
					"screen-key": "guardian.security-event",
					record: v(J)
				}, {
					default: y(() => [f(n, {
						ready: !v(X) && v(Y) !== null,
						failed: v(Z),
						status: v(Q),
						"not-found": v(K)("guardian.admin.event.not_found")
					}, {
						default: y(() => [v(Y) ? (m(), l("div", O, [f(S, null, {
							default: y(() => [u("dl", k, [
								u("dt", A, _(v(K)("guardian.admin.events.fields.type")), 1),
								u("dd", j, _(v(Y).type), 1),
								u("dt", M, _(v(K)("guardian.admin.events.fields.user")), 1),
								u("dd", N, [v(Y).user_id ? (m(), c(x, {
									key: 0,
									to: v(t)(v(Y).user_id),
									class: "hover:underline"
								}, {
									default: y(() => [d(_(v(Y).user_id), 1)]),
									_: 1
								}, 8, ["to"])) : (m(), l("span", P, "—"))]),
								u("dt", F, _(v(K)("guardian.admin.events.fields.ip")), 1),
								u("dd", null, _(v(Y).ip ?? "—"), 1),
								u("dt", I, _(v(K)("guardian.admin.event.user_agent")), 1),
								u("dd", L, _(v(Y).user_agent ?? "—"), 1),
								u("dt", R, _(v(K)("guardian.admin.event.identifier_hash")), 1),
								u("dd", z, _(v(Y).identifier_hash ?? "—"), 1),
								u("dt", B, _(v(K)("guardian.admin.events.fields.occurred_at")), 1),
								u("dd", null, _(v(i)(v(Y).occurred_at)), 1)
							])]),
							_: 1
						}), f(S, null, {
							header: y(() => [u("h2", V, _(v(K)("guardian.admin.event.context")), 1)]),
							default: y(() => [v($).length === 0 ? (m(), l("p", H, _(v(K)("guardian.admin.event.no_context")), 1)) : (m(), l("dl", U, [(m(!0), l(o, null, h(v($), ([t, n]) => (m(), l(o, { key: t }, [u("dt", W, _(t), 1), u("dd", {
								class: "break-all",
								"data-testid": `guardian-event-context-${t}`
							}, _(v(e)(n)), 9, G)], 64))), 128))]))]),
							_: 1
						})])) : ee("", !0)]),
						_: 1
					}, 8, [
						"ready",
						"failed",
						"status",
						"not-found"
					])]),
					_: 1
				}, 8, ["record"])]),
				_: 1
			});
		};
	}
});
export { K as default };
