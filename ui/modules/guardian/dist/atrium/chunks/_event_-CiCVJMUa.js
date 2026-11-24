import { i as e } from "./admin-_cLX5Zre.js";
import { u as t } from "./access-CMUXpA7X.js";
import { t as n } from "./GuardianState-DytBr9ih.js";
import { d as r, i, o as a } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as o, useHead as s } from "@refactor-circus/atrium";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as ee, createVNode as m, defineComponent as h, openBlock as g, renderList as _, resolveComponent as v, toDisplayString as y, unref as b, withCtx as x } from "vue";
import { UButton as S, UCard as C, UDashboardNavbar as w, UDashboardPanel as T } from "@refactor-circus/atrium/ui";
import { useI18n as E } from "vue-i18n";
import { useRoute as D } from "vue-router";
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
}, W = { class: "font-mono text-muted" }, G = ["data-testid"], K = /* @__PURE__ */ h({
	__name: "[event]",
	setup(h) {
		let { t: K } = E(), q = D(), J = l(() => String(q.params.event)), { data: Y, pending: X, failed: Z, status: Q } = r(async (e) => a(await e.GET("/security-events/{event}", { params: { path: { event: J.value } } })).data, J), $ = l(() => Object.entries(Y.value?.context ?? {}));
		return s({ title: () => Y.value?.type ?? K("guardian.admin.event.title") }), (r, a) => {
			let s = S, l = w, h = v("RouterLink"), E = C, D = o, q = T;
			return g(), u(q, null, {
				header: x(() => [m(l, { title: b(Y)?.type ?? b(K)("guardian.admin.event.title") }, {
					leading: x(() => [m(s, {
						to: "/guardian/security-events",
						variant: "ghost",
						icon: "i-lucide-arrow-left",
						"aria-label": b(K)("guardian.admin.events.title"),
						"data-testid": "guardian-event-back"
					}, null, 8, ["aria-label"])]),
					_: 1
				}, 8, ["title"])]),
				body: x(() => [m(D, {
					"screen-key": "guardian.security-event",
					record: b(J)
				}, {
					default: x(() => [m(n, {
						ready: !b(X) && b(Y) !== null,
						failed: b(Z),
						status: b(Q),
						"not-found": b(K)("guardian.admin.event.not_found")
					}, {
						default: x(() => [b(Y) ? (g(), f("div", O, [m(E, null, {
							default: x(() => [p("dl", k, [
								p("dt", A, y(b(K)("guardian.admin.events.fields.type")), 1),
								p("dd", j, y(b(Y).type), 1),
								p("dt", M, y(b(K)("guardian.admin.events.fields.user")), 1),
								p("dd", N, [b(Y).user_id ? (g(), u(h, {
									key: 0,
									to: b(t)(b(Y).user_id),
									class: "hover:underline"
								}, {
									default: x(() => [ee(y(b(Y).user_id), 1)]),
									_: 1
								}, 8, ["to"])) : (g(), f("span", P, "—"))]),
								p("dt", F, y(b(K)("guardian.admin.events.fields.ip")), 1),
								p("dd", null, y(b(Y).ip ?? "—"), 1),
								p("dt", I, y(b(K)("guardian.admin.event.user_agent")), 1),
								p("dd", L, y(b(Y).user_agent ?? "—"), 1),
								p("dt", R, y(b(K)("guardian.admin.event.identifier_hash")), 1),
								p("dd", z, y(b(Y).identifier_hash ?? "—"), 1),
								p("dt", B, y(b(K)("guardian.admin.events.fields.occurred_at")), 1),
								p("dd", null, y(b(i)(b(Y).occurred_at)), 1)
							])]),
							_: 1
						}), m(E, null, {
							header: x(() => [p("h2", V, y(b(K)("guardian.admin.event.context")), 1)]),
							default: x(() => [b($).length === 0 ? (g(), f("p", H, y(b(K)("guardian.admin.event.no_context")), 1)) : (g(), f("dl", U, [(g(!0), f(c, null, _(b($), ([t, n]) => (g(), f(c, { key: t }, [p("dt", W, y(t), 1), p("dd", {
								class: "break-all",
								"data-testid": `guardian-event-context-${t}`
							}, y(b(e)(n)), 9, G)], 64))), 128))]))]),
							_: 1
						})])) : d("", !0)]),
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
