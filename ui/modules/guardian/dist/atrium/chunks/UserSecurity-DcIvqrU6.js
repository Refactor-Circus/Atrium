import { t as e } from "./GuardianState-DytBr9ih.js";
import { d as t, i as n, l as r, o as i, u as a } from "./guardian-D9MeowUD.js";
import { t as o } from "./GuardianActionError-DKEMy_E4.js";
import { Fragment as s, computed as c, createBlock as l, createCommentVNode as u, createElementBlock as d, createElementVNode as f, createTextVNode as p, createVNode as m, defineComponent as h, openBlock as g, ref as _, renderList as v, resolveComponent as y, toDisplayString as b, unref as x, withCtx as S } from "vue";
import { UAlert as C, UButton as w, UCard as T } from "@refactor-circus/atrium/ui";
import { useI18n as E } from "vue-i18n";
// src/components/users/UserEvents.vue?vue&type=script&setup=true&lang.ts
var D = { class: "font-semibold" }, O = { class: "divide-y divide-default text-sm" }, k = ["data-testid"], A = { class: "text-muted" }, j = {
	key: 0,
	class: "py-2 text-muted"
}, M = /* @__PURE__ */ h({
	__name: "UserEvents",
	props: { user: {} },
	setup(r) {
		let a = r, { t: o } = E(), { data: c, pending: h, failed: _, status: C } = t(async (e) => i(await e.GET("/security-events", { params: { query: {
			user: a.user,
			per_page: 20
		} } })), () => a.user);
		return (t, r) => {
			let i = y("RouterLink"), a = T;
			return g(), l(a, { "data-testid": "guardian-user-events" }, {
				header: S(() => [f("h2", D, b(x(o)("guardian.access.user.events")), 1)]),
				default: S(() => [m(e, {
					ready: !x(h) && x(c) !== null,
					failed: x(_),
					status: x(C),
					compact: ""
				}, {
					default: S(() => [f("ul", O, [(g(!0), d(s, null, v(x(c)?.data ?? [], (e) => (g(), d("li", {
						key: e.id,
						class: "flex flex-wrap justify-between gap-2 py-2",
						"data-testid": `guardian-user-event-${e.id}`
					}, [m(i, {
						to: `/guardian/security-events/${encodeURIComponent(e.id)}`,
						class: "font-mono hover:underline"
					}, {
						default: S(() => [p(b(e.type), 1)]),
						_: 2
					}, 1032, ["to"]), f("span", A, b(e.ip ?? "—") + " · " + b(x(n)(e.occurred_at)), 1)], 8, k))), 128)), (x(c)?.data ?? []).length === 0 ? (g(), d("li", j, b(x(o)("guardian.access.user.no_events")), 1)) : u("", !0)])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			});
		};
	}
}), N = { class: "font-semibold" }, P = { class: "space-y-3" }, F = { class: "divide-y divide-default text-sm" }, I = ["data-testid"], L = { class: "text-muted" }, R = {
	key: 0,
	class: "py-2 text-muted"
}, z = /* @__PURE__ */ h({
	__name: "UserSessions",
	props: {
		user: {},
		name: {}
	},
	setup(r) {
		let c = r, { t: h } = E(), y = a(), D = _(null), { client: O, data: k, pending: A, failed: j, status: M, reload: z } = t(async (e) => i(await e.GET("/users/{user}/sessions", { params: {
			path: { user: c.user },
			query: { per_page: 50 }
		} })).data, () => c.user);
		async function B() {
			if (!O || !window.confirm(h("guardian.access.user.confirm_revoke_sessions", { user: c.name ?? c.user }))) return;
			let e = [];
			await y.run(async () => e.push(i(await O.DELETE("/users/{user}/sessions", { params: { path: { user: c.user } } })))) && (D.value = h("guardian.access.user.sessions_revoked", { count: e[0]?.revoked ?? 0 }), await z());
		}
		return (t, r) => {
			let i = C, a = w, c = T;
			return g(), l(c, { "data-testid": "guardian-user-sessions" }, {
				header: S(() => [f("h2", N, b(x(h)("guardian.access.user.sessions")), 1)]),
				default: S(() => [m(e, {
					ready: !x(A) && x(k) !== null,
					failed: x(j),
					status: x(M),
					compact: ""
				}, {
					default: S(() => [f("div", P, [
						x(D) ? (g(), l(i, {
							key: 0,
							color: "success",
							variant: "subtle",
							title: x(D),
							"data-testid": "guardian-user-sessions-notice"
						}, null, 8, ["title"])) : u("", !0),
						m(o, { action: x(y) }, null, 8, ["action"]),
						f("ul", F, [(g(!0), d(s, null, v(x(k) ?? [], (e) => (g(), d("li", {
							key: e.id,
							class: "py-2",
							"data-testid": `guardian-user-session-${e.id}`
						}, [f("strong", null, b(e.device_name ?? e.user_agent ?? "—"), 1), f("span", L, " · " + b(e.ip ?? "—") + " · " + b(x(n)(e.last_active_at)), 1)], 8, I))), 128)), (x(k) ?? []).length === 0 ? (g(), d("li", R, b(x(h)("guardian.access.user.no_sessions")), 1)) : u("", !0)]),
						m(a, {
							color: "error",
							variant: "soft",
							size: "sm",
							icon: "i-lucide-log-out",
							loading: x(y).busy.value,
							"data-testid": "guardian-user-sessions-revoke",
							onClick: B
						}, {
							default: S(() => [p(b(x(h)("guardian.access.user.revoke_sessions")), 1)]),
							_: 1
						}, 8, ["loading"])
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			});
		};
	}
}), B = { class: "font-semibold" }, V = { class: "space-y-3" }, H = { class: "divide-y divide-default text-sm" }, U = ["data-testid"], W = { class: "text-muted" }, G = {
	key: 0,
	class: "py-2 text-muted"
}, K = /* @__PURE__ */ h({
	__name: "UserTokens",
	props: {
		user: {},
		name: {}
	},
	setup(r) {
		let h = r, { t: _ } = E(), y = a(), { client: C, data: D, pending: O, failed: k, status: A, reload: j } = t(async (e) => i(await e.GET("/users/{user}/tokens", { params: { path: { user: h.user } } })).data, () => h.user), M = c(() => k.value && A.value === 501);
		async function N() {
			C && window.confirm(_("guardian.access.user.confirm_revoke_tokens", { user: h.name ?? h.user })) && await y.run(async () => i(await C.DELETE("/users/{user}/tokens", { params: { path: { user: h.user } } }))) && await j();
		}
		return (t, r) => {
			let i = w, a = T;
			return x(M) ? u("", !0) : (g(), l(a, {
				key: 0,
				"data-testid": "guardian-user-tokens"
			}, {
				header: S(() => [f("h2", B, b(x(_)("guardian.access.user.tokens")), 1)]),
				default: S(() => [m(e, {
					ready: !x(O) && x(D) !== null,
					failed: x(k),
					status: x(A),
					compact: ""
				}, {
					default: S(() => [f("div", V, [
						m(o, { action: x(y) }, null, 8, ["action"]),
						f("ul", H, [(g(!0), d(s, null, v(x(D) ?? [], (e) => (g(), d("li", {
							key: e.id,
							class: "py-2",
							"data-testid": `guardian-user-token-${e.id}`
						}, [f("strong", null, b(e.name), 1), f("span", W, " · " + b(e.abilities.join(", ")) + " · " + b(x(n)(e.last_used_at) ?? x(_)("guardian.access.user.never_used")), 1)], 8, U))), 128)), (x(D) ?? []).length === 0 ? (g(), d("li", G, b(x(_)("guardian.access.user.no_tokens")), 1)) : u("", !0)]),
						m(i, {
							color: "error",
							variant: "soft",
							size: "sm",
							icon: "i-lucide-key-round",
							loading: x(y).busy.value,
							"data-testid": "guardian-user-tokens-revoke",
							onClick: N
						}, {
							default: S(() => [p(b(x(_)("guardian.access.user.revoke_tokens")), 1)]),
							_: 1
						}, 8, ["loading"])
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}));
		};
	}
}), q = { class: "font-semibold" }, J = { class: "space-y-3" }, Y = { class: "text-sm text-muted" }, X = /* @__PURE__ */ h({
	__name: "UserTwoFactorReset",
	props: {
		user: {},
		name: {}
	},
	setup(e) {
		let t = e, { t: n } = E(), s = r(), c = a(), d = _(!1);
		async function h() {
			s && window.confirm(n("guardian.access.user.confirm_reset_two_factor", { user: t.name ?? t.user })) && (d.value = await c.run(async () => i(await s.DELETE("/users/{user}/two-factor", { params: { path: { user: t.user } } }))));
		}
		return (e, t) => {
			let r = C, i = w, a = T;
			return g(), l(a, { "data-testid": "guardian-user-two-factor" }, {
				header: S(() => [f("h2", q, b(x(n)("guardian.access.user.two_factor")), 1)]),
				default: S(() => [f("div", J, [
					f("p", Y, b(x(n)("guardian.access.user.reset_two_factor_hint")), 1),
					x(d) ? (g(), l(r, {
						key: 0,
						color: "success",
						variant: "subtle",
						title: x(n)("guardian.access.user.two_factor_reset"),
						"data-testid": "guardian-user-two-factor-done"
					}, null, 8, ["title"])) : u("", !0),
					m(o, { action: x(c) }, null, 8, ["action"]),
					m(i, {
						color: "error",
						variant: "soft",
						size: "sm",
						icon: "i-lucide-shield-off",
						loading: x(c).busy.value,
						"data-testid": "guardian-user-two-factor-reset",
						onClick: h
					}, {
						default: S(() => [p(b(x(n)("guardian.access.user.reset_two_factor")), 1)]),
						_: 1
					}, 8, ["loading"])
				])]),
				_: 1
			});
		};
	}
}), Z = {
	class: "grid gap-4 lg:grid-cols-2",
	"data-testid": "guardian-user-security"
}, Q = /* @__PURE__ */ h({
	__name: "UserSecurity",
	props: {
		user: {},
		name: {}
	},
	setup(e) {
		return (t, n) => (g(), d("div", Z, [
			m(z, {
				user: e.user,
				name: e.name
			}, null, 8, ["user", "name"]),
			m(K, {
				user: e.user,
				name: e.name
			}, null, 8, ["user", "name"]),
			m(M, { user: e.user }, null, 8, ["user"]),
			m(X, {
				user: e.user,
				name: e.name
			}, null, 8, ["user", "name"])
		]));
	}
});
export { Q as t };
