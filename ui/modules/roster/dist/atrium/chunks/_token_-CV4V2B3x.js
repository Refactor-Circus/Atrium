import { l as e, r as t } from "./users-JqW-WBif.js";
import { AtriumErrorCard as n, AtriumIntegrationError as r, atriumStatus as i, resolveIntegrationBase as a, useAtrium as o, useAtriumShellStore as s, useHead as c } from "@refactor-circus/atrium";
import { UAlert as l, UButton as u, UCard as d, USkeleton as f } from "@refactor-circus/atrium/ui";
import { Fragment as p, createBlock as m, createCommentVNode as h, createElementBlock as g, createElementVNode as _, createTextVNode as v, createVNode as y, defineComponent as b, onMounted as x, openBlock as S, ref as C, shallowRef as w, toDisplayString as T, unref as E, withCtx as D } from "vue";
import { useI18n as O } from "vue-i18n";
import { useRoute as k } from "vue-router";
import A from "openapi-fetch";
function j(e, t, n, r) {
	return a(e || t || "/roster", n, r);
}
function M() {
	let e = o(), t = useRuntimeConfig().public.atrium, n = s().integration("roster")?.api_base, r = A({
		baseUrl: j(t.integrations?.roster?.apiBase, n, t.apiBase, window.location.origin),
		fetch: (e) => globalThis.fetch(e)
	});
	return r.use({ async onRequest({ request: t }) {
		let n = e.auth(), r = new Headers(t.headers);
		r.set("Accept", "application/json");
		for (let [e, t] of Object.entries(await n.headers?.() ?? {})) r.set(e, t);
		return new Request(t, {
			headers: r,
			...n.credentials ? { credentials: n.credentials } : {}
		});
	} }), r;
}
// src/pages/invitations/[token].vue?vue&type=script&setup=true&lang.ts
var N = {
	class: "text-lg font-semibold",
	"data-testid": "roster-invitation-heading"
}, P = {
	key: 6,
	class: "flex flex-col gap-4",
	"data-testid": "roster-invitation-details"
}, F = { class: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm" }, I = { class: "text-muted" }, L = { "data-testid": "roster-invitation-email" }, R = { class: "text-muted" }, z = { "data-testid": "roster-invitation-organization" }, B = { class: "text-muted" }, V = { "data-testid": "roster-invitation-teams" }, H = { class: "text-muted" }, U = { "data-testid": "roster-invitation-expires" }, W = { class: "flex flex-wrap gap-3" }, G = /* @__PURE__ */ b({
	__name: "[token]",
	setup(a) {
		let { t: s } = O(), b = k(), A = o(), j = M();
		c({ title: () => s("roster.organizations.invitation.title") });
		let G = C("loading"), K = w(null), q = C(!1), J = C(null);
		function Y() {
			return String(b.params.token ?? "");
		}
		function X(e) {
			switch (e) {
				case 404: return "unavailable";
				case 429: return "throttled";
				default: return null;
			}
		}
		async function Z() {
			G.value = "loading";
			try {
				K.value = e(await j.GET("/invitations/{token}", { params: { path: { token: Y() } } })).data, G.value = "ready";
			} catch (e) {
				let t = i(e);
				G.value = X(t) ?? (t === 422 ? "unavailable" : "failed");
			}
		}
		async function Q(t) {
			q.value = !0, J.value = null;
			try {
				let n = { token: Y() }, r = t === "accept" ? await j.POST("/invitations/{token}/accept", {
					params: { path: { token: Y() } },
					body: n
				}) : await j.POST("/invitations/{token}/decline", {
					params: { path: { token: Y() } },
					body: n
				});
				if (r.response.status === 401) {
					await A.auth().onUnauthorized?.();
					return;
				}
				e(r), G.value = t === "accept" ? "accepted" : "declined";
			} catch (e) {
				let t = X(i(e));
				if (t) {
					G.value = t;
					return;
				}
				let n = e instanceof r ? e.body : null, a = n?.errors ? Object.values(n.errors)[0]?.[0] : void 0;
				J.value = a ?? (typeof n?.message == "string" ? n.message : s("roster.organizations.invitation.answer_failed"));
			} finally {
				q.value = !1;
			}
		}
		return x(Z), (e, r) => {
			let i = f, a = l, o = n, c = u, b = d;
			return S(), m(b, { "data-testid": "roster-invitation" }, {
				header: D(() => [_("h1", N, T(E(K) && E(G) !== "unavailable" && E(G) !== "throttled" ? E(s)("roster.organizations.invitation.heading", { organization: E(K).organization.name }) : E(s)("roster.organizations.invitation.title")), 1)]),
				default: D(() => [E(G) === "loading" ? (S(), m(i, {
					key: 0,
					class: "h-24",
					"data-testid": "roster-invitation-loading"
				})) : E(G) === "unavailable" ? (S(), m(a, {
					key: 1,
					color: "neutral",
					variant: "subtle",
					icon: "i-lucide-mail-x",
					title: E(s)("roster.organizations.invitation.unavailable"),
					description: E(s)("roster.organizations.invitation.unavailable_hint"),
					"data-testid": "roster-invitation-unavailable"
				}, null, 8, ["title", "description"])) : E(G) === "throttled" ? (S(), m(a, {
					key: 2,
					color: "warning",
					variant: "subtle",
					icon: "i-lucide-timer",
					title: E(s)("roster.organizations.invitation.throttled"),
					description: E(s)("roster.organizations.invitation.throttled_hint"),
					"data-testid": "roster-invitation-throttled"
				}, null, 8, ["title", "description"])) : E(G) === "failed" ? (S(), m(o, {
					key: 3,
					message: E(s)("roster.organizations.invitation.failed")
				}, null, 8, ["message"])) : E(G) === "accepted" ? (S(), m(a, {
					key: 4,
					color: "success",
					variant: "subtle",
					icon: "i-lucide-check",
					title: E(s)("roster.organizations.invitation.accepted", { organization: E(K)?.organization.name ?? "" }),
					"data-testid": "roster-invitation-accepted"
				}, null, 8, ["title"])) : E(G) === "declined" ? (S(), m(a, {
					key: 5,
					color: "neutral",
					variant: "subtle",
					icon: "i-lucide-x",
					title: E(s)("roster.organizations.invitation.declined"),
					"data-testid": "roster-invitation-declined"
				}, null, 8, ["title"])) : E(K) ? (S(), g("div", P, [
					_("p", null, T(E(s)("roster.organizations.invitation.prompt", { organization: E(K).organization.name })), 1),
					_("dl", F, [
						_("dt", I, T(E(s)("roster.organizations.fields.email")), 1),
						_("dd", L, T(E(K).email), 1),
						_("dt", R, T(E(s)("roster.organizations.invitation.organization")), 1),
						_("dd", z, T(E(K).organization.name), 1),
						E(K).teams.length > 0 ? (S(), g(p, { key: 0 }, [_("dt", B, T(E(s)("roster.organizations.fields.teams")), 1), _("dd", V, T(E(K).teams.join(", ")), 1)], 64)) : h("", !0),
						_("dt", H, T(E(s)("roster.organizations.invitation.expires")), 1),
						_("dd", U, T(E(t)(E(K).expires_at)), 1)
					]),
					E(J) ? (S(), m(a, {
						key: 0,
						color: "error",
						variant: "subtle",
						title: E(J),
						"data-testid": "roster-invitation-error"
					}, null, 8, ["title"])) : h("", !0),
					_("div", W, [y(c, {
						icon: "i-lucide-check",
						loading: E(q),
						"data-testid": "roster-invitation-accept",
						onClick: r[0] ||= (e) => Q("accept")
					}, {
						default: D(() => [v(T(E(s)("roster.organizations.invitation.accept")), 1)]),
						_: 1
					}, 8, ["loading"]), y(c, {
						variant: "outline",
						icon: "i-lucide-x",
						loading: E(q),
						"data-testid": "roster-invitation-decline",
						onClick: r[1] ||= (e) => Q("decline")
					}, {
						default: D(() => [v(T(E(s)("roster.organizations.invitation.decline")), 1)]),
						_: 1
					}, 8, ["loading"])])
				])) : h("", !0)]),
				_: 1
			});
		};
	}
});
export { G as default };
