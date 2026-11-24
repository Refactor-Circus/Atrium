import { c as e, d as t, i as n, l as r, n as i, o as a, t as o, u as s } from "./chunks/guardian-Dugz84u2.js";
import { t as c } from "./chunks/GuardianAssignments-9aTtwmtc.js";
import { i as l, s as u } from "./chunks/access-Dcd3BQGu.js";
import { t as d } from "./chunks/GuardianErrors-DOoU5vfA.js";
import { t as f } from "./chunks/GuardianPager-DnfHQ8Kk.js";
import { t as p } from "./chunks/GuardianState-DjXU16rU.js";
import { c as m, i as h, r as g, s as _, t as v } from "./chunks/SsoConnectionFields-BBomoNqB.js";
import { t as y } from "./chunks/UserSecurity-Y8OMCnA5.js";
import { Fragment as b, computed as x, createBlock as S, createCommentVNode as C, createElementBlock as w, createElementVNode as T, createTextVNode as E, createVNode as D, defineComponent as O, onBeforeUnmount as k, openBlock as A, reactive as j, ref as M, renderList as N, resolveComponent as P, shallowRef as F, toDisplayString as I, unref as L, vModelSelect as R, withCtx as z, withDirectives as ee, withModifiers as te } from "vue";
import { AtriumNoAccess as B, defineAtriumModule as V, mergeAtriumMessages as H, navigateTo as U, useAsyncData as W, useAtrium as G, useAtriumApi as K, useAtriumIntegration as ne } from "@refactor-circus/atrium";
import { useRouter as q } from "vue-router";
import { UAlert as re, UBadge as J, UButton as Y, UCard as X, UFormField as ie, UInput as ae } from "@refactor-circus/atrium/ui";
import { useI18n as Z } from "vue-i18n";
// src/components/two-factor/handler.ts
var oe = "guardian.two-factor", se = "Guardian-Two-Factor-Deadline", ce = "guardian.two-factor-deadline", le = {
	two_factor_challenge_required: o,
	two_factor_enrollment_required: i
}, Q = !1;
function ue(e) {
	return e === "/guardian/two-factor/challenge" || e === "/guardian/two-factor/setup";
}
async function de(e) {
	if (!(e.headers.get("content-type") ?? "").includes("json")) return null;
	try {
		let t = await e.json();
		return typeof t?.code == "string" ? t.code : null;
	} catch {
		return null;
	}
}
function fe(e) {
	return async (t) => {
		let r = q(), i = t.headers.get(se);
		if (i && e.notify(ce, {
			id: i,
			message: "guardian.two_factor.deadline.notice",
			params: { deadline: n(i) ?? i },
			link: {
				to: "/guardian/security",
				label: "guardian.two_factor.deadline.link"
			},
			color: "warning"
		}), t.status !== 403 || Q || ue(r.currentRoute.value.path)) return;
		let a = le[await de(t) ?? ""] ?? null;
		if (!(a === null || Q || ue(r.currentRoute.value.path))) {
			Q = !0;
			try {
				await r.push({
					path: a,
					query: { redirect: r.currentRoute.value.fullPath }
				});
			} finally {
				Q = !1;
			}
		}
	};
}
// src/components/hooks/hooks.ts
function $(e) {
	return typeof e == "number" && Number.isFinite(e) ? String(e) : typeof e == "string" && e !== "" ? e : null;
}
function pe(e) {
	return typeof e == "string" && e !== "" ? e : null;
}
function me(e, t) {
	let n = $(t);
	if (n === null) return null;
	let r = pe(e.scope_type);
	return r === null ? { user: n } : {
		scopeType: r,
		scopeId: n
	};
}
// src/components/hooks/GuardianAccessTab.vue?vue&type=script&setup=true&lang.ts
var he = {
	key: 0,
	"data-testid": "hooks-guardian-access"
}, ge = /* @__PURE__ */ O({
	__name: "GuardianAccessTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = K(), i = r(), a = x(() => me(t.data, t.record)), { data: o } = W("guardian-hook-scope-types", async () => {
			try {
				return await n("/screens/guardian.role-assignments");
			} catch {
				return null;
			}
		}, { server: !1 }), s = x(() => u(o.value?.data.options));
		return (e, t) => L(a) && L(i) ? (A(), w("div", he, ["user" in L(a) ? (A(), S(c, {
			key: L(a).user,
			user: L(a).user,
			"scope-types": L(s)
		}, null, 8, ["user", "scope-types"])) : (A(), S(c, {
			key: `${L(a).scopeType}:${L(a).scopeId}`,
			"scope-type": L(a).scopeType,
			"scope-id": L(a).scopeId,
			"scope-types": L(s)
		}, null, 8, [
			"scope-type",
			"scope-id",
			"scope-types"
		]))])) : C("", !0);
	}
}), _e = {
	class: "space-y-4",
	"data-testid": "guardian-scim-tokens"
}, ve = { class: "flex flex-wrap items-center gap-2" }, ye = {
	class: "break-all font-mono text-sm",
	"data-testid": "guardian-scim-plain-token"
}, be = { class: "font-medium" }, xe = {
	class: "break-all font-mono text-sm",
	"data-testid": "guardian-scim-base-url"
}, Se = { class: "space-y-4" }, Ce = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-scim-empty"
}, we = {
	key: 1,
	class: "w-full text-left text-sm"
}, Te = { class: "text-muted" }, Ee = { class: "py-2 pr-3 font-medium" }, De = { class: "py-2 pr-3 font-medium" }, Oe = { class: "py-2 pr-3 font-medium" }, ke = { class: "py-2 pr-3 font-medium" }, Ae = { class: "divide-y divide-default" }, je = ["data-testid"], Me = { class: "py-2 pr-3" }, Ne = { class: "flex flex-wrap items-center gap-2" }, Pe = { class: "py-2 pr-3" }, Fe = { class: "py-2 pr-3 text-muted" }, Ie = { class: "py-2 pr-3 text-muted" }, Le = { class: "py-2 text-right" }, Re = { class: "font-medium" }, ze = { value: "" }, Be = ["value"], Ve = { class: "mt-3" }, He = /* @__PURE__ */ O({
	__name: "GuardianScimTokens",
	props: {
		organization: {},
		scimPath: { default: null },
		client: { default: void 0 }
	},
	setup(e) {
		let r = e, { t: i } = Z(), o = s(), c = s(), { apiBase: u } = ne("guardian"), m = x(() => _(u, r.scimPath, r.organization)), h = M(1), g = x(() => ({
			per_page: 25,
			...h.value > 1 ? { page: h.value } : {}
		})), { client: v, data: y, pending: O, failed: P, status: B, reload: V } = t(async (e) => a(await e.GET("/organizations/{organization}/scim-tokens", { params: {
			path: { organization: r.organization },
			query: g.value
		} })), () => [r.organization, g.value], r.client === void 0 ? void 0 : r.client), H = F([]);
		v && v.GET("/organizations/{organization}/sso-connections", { params: {
			path: { organization: r.organization },
			query: { per_page: 100 }
		} }).then((e) => H.value = a(e).data).catch(() => H.value = []);
		let U = x(() => y.value?.data ?? []), W = x(() => l(y.value)), G = j({
			name: "",
			expires_in_days: "",
			sso_connection: ""
		}), K = M(null), q = M(!1);
		k(() => {
			K.value = null;
		});
		function oe(e) {
			let t = Number(e);
			return e === "" || !Number.isFinite(t) ? null : Math.trunc(t);
		}
		async function se() {
			if (!v) return;
			K.value = null, q.value = !1;
			let e = { token: null };
			await o.run(async () => {
				e.token = a(await v.POST("/organizations/{organization}/scim-tokens", {
					params: { path: { organization: r.organization } },
					body: {
						name: G.name.trim(),
						expires_in_days: oe(G.expires_in_days),
						sso_connection: G.sso_connection === "" ? null : G.sso_connection
					}
				})).token;
			}) && (K.value = e.token, Object.assign(G, {
				name: "",
				expires_in_days: "",
				sso_connection: ""
			}), await V());
		}
		async function ce() {
			K.value && (await navigator.clipboard?.writeText(K.value), q.value = !0);
		}
		async function le(e) {
			v && window.confirm(i("guardian.sso.scim.confirm_revoke", { name: e.name })) && await c.run(async () => a(await v.DELETE("/scim-tokens/{token}", { params: { path: { token: e.id } } }))) && await V();
		}
		function Q(e) {
			h.value = e;
		}
		return (e, t) => {
			let r = Y, a = re, s = X, l = J, u = ae, h = ie;
			return A(), w("div", _e, [
				L(K) ? (A(), S(a, {
					key: 0,
					color: "warning",
					variant: "subtle",
					title: L(i)("guardian.sso.scim.created"),
					"data-testid": "guardian-scim-plain"
				}, {
					description: z(() => [T("div", ve, [T("code", ye, I(L(K)), 1), D(r, {
						size: "xs",
						variant: "soft",
						icon: "i-lucide-copy",
						"data-testid": "guardian-scim-copy",
						onClick: ce
					}, {
						default: z(() => [E(I(L(q) ? L(i)("guardian.sso.copied") : L(i)("guardian.sso.copy")), 1)]),
						_: 1
					})])]),
					_: 1
				}, 8, ["title"])) : C("", !0),
				D(s, null, {
					header: z(() => [T("h3", be, I(L(i)("guardian.sso.scim.base_url")), 1)]),
					default: z(() => [T("code", xe, I(L(m) ?? "—"), 1)]),
					_: 1
				}),
				D(p, {
					ready: !L(O) && L(y) !== null,
					failed: L(P),
					status: L(B),
					compact: ""
				}, {
					default: z(() => [T("div", Se, [
						D(d, {
							action: L(c),
							testid: "guardian-scim-revoke"
						}, null, 8, ["action"]),
						L(U).length === 0 ? (A(), w("p", Ce, I(L(i)("guardian.sso.scim.empty")), 1)) : (A(), w("table", we, [T("thead", Te, [T("tr", null, [
							T("th", Ee, I(L(i)("guardian.sso.fields.name")), 1),
							T("th", De, I(L(i)("guardian.sso.scim.connection")), 1),
							T("th", Oe, I(L(i)("guardian.sso.scim.last_used")), 1),
							T("th", ke, I(L(i)("guardian.sso.scim.expires")), 1),
							t[3] ||= T("th", { class: "py-2" }, null, -1)
						])]), T("tbody", Ae, [(A(!0), w(b, null, N(L(U), (e) => (A(), w("tr", {
							key: e.id,
							"data-testid": `guardian-scim-token-${e.id}`
						}, [
							T("td", Me, [T("div", Ne, [E(I(e.name) + " ", 1), e.revoked_at ? (A(), S(l, {
								key: 0,
								color: "neutral",
								variant: "subtle"
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.scim.revoked")), 1)]),
								_: 1
							})) : e.usable ? C("", !0) : (A(), S(l, {
								key: 1,
								color: "neutral",
								variant: "subtle"
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.scim.expired")), 1)]),
								_: 1
							}))])]),
							T("td", Pe, I(e.sso_connection ?? "—"), 1),
							T("td", Fe, I(L(n)(e.last_used_at) ?? L(i)("guardian.sso.never")), 1),
							T("td", Ie, I(L(n)(e.expires_at) ?? L(i)("guardian.sso.never")), 1),
							T("td", Le, [e.revoked_at ? C("", !0) : (A(), S(r, {
								key: 0,
								size: "xs",
								color: "error",
								variant: "ghost",
								icon: "i-lucide-ban",
								"data-testid": `guardian-scim-revoke-${e.id}`,
								onClick: (t) => le(e)
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.scim.revoke")), 1)]),
								_: 1
							}, 8, ["data-testid", "onClick"]))])
						], 8, je))), 128))])])),
						D(f, {
							current: L(W).current,
							last: L(W).last,
							testid: "guardian-scim-tokens",
							onGo: Q
						}, null, 8, ["current", "last"]),
						D(s, null, {
							header: z(() => [T("h3", Re, I(L(i)("guardian.sso.scim.new")), 1)]),
							default: z(() => [T("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "guardian-scim-form",
								onSubmit: te(se, ["prevent"])
							}, [
								D(h, {
									label: L(i)("guardian.sso.fields.name"),
									error: L(o).error("name"),
									required: ""
								}, {
									default: z(() => [D(u, {
										modelValue: L(G).name,
										"onUpdate:modelValue": t[0] ||= (e) => L(G).name = e,
										class: "w-56",
										"data-testid": "guardian-scim-name"
									}, null, 8, ["modelValue"])]),
									_: 1
								}, 8, ["label", "error"]),
								D(h, {
									label: L(i)("guardian.sso.scim.expires_in_days"),
									error: L(o).error("expires_in_days")
								}, {
									default: z(() => [D(u, {
										modelValue: L(G).expires_in_days,
										"onUpdate:modelValue": t[1] ||= (e) => L(G).expires_in_days = e,
										type: "number",
										min: "1",
										max: "3650",
										class: "w-32",
										"data-testid": "guardian-scim-expires"
									}, null, 8, ["modelValue"])]),
									_: 1
								}, 8, ["label", "error"]),
								D(h, {
									label: L(i)("guardian.sso.scim.link_connection"),
									error: L(o).error("sso_connection")
								}, {
									default: z(() => [ee(T("select", {
										"onUpdate:modelValue": t[2] ||= (e) => L(G).sso_connection = e,
										class: "w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
										"data-testid": "guardian-scim-connection"
									}, [T("option", ze, I(L(i)("guardian.sso.scim.no_connection")), 1), (A(!0), w(b, null, N(L(H), (e) => (A(), w("option", {
										key: e.slug,
										value: e.slug
									}, I(e.name), 9, Be))), 128))], 512), [[R, L(G).sso_connection]])]),
									_: 1
								}, 8, ["label", "error"]),
								D(r, {
									type: "submit",
									icon: "i-lucide-plus",
									loading: L(o).busy.value,
									"data-testid": "guardian-scim-submit"
								}, {
									default: z(() => [E(I(L(i)("guardian.sso.scim.create")), 1)]),
									_: 1
								}, 8, ["loading"])
							], 32), T("div", Ve, [Object.keys(L(o).errors.value).length === 0 ? (A(), S(d, {
								key: 0,
								action: L(o),
								testid: "guardian-scim-issue"
							}, null, 8, ["action"])) : C("", !0)])]),
							_: 1
						})
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])
			]);
		};
	}
}), Ue = {
	key: 0,
	"data-testid": "hooks-guardian-scim"
}, We = /* @__PURE__ */ O({
	__name: "GuardianScimTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = x(() => $(t.record)), a = x(() => typeof t.data.scim_path == "string" ? t.data.scim_path : null);
		return (e, t) => L(i) && L(n) ? (A(), w("div", Ue, [(A(), S(He, {
			key: L(i),
			organization: L(i),
			"scim-path": L(a)
		}, null, 8, ["organization", "scim-path"]))])) : C("", !0);
	}
}), Ge = { class: "font-semibold" }, Ke = { class: "divide-y divide-default text-sm" }, qe = ["data-testid"], Je = { class: "text-muted" }, Ye = /* @__PURE__ */ O({
	__name: "GuardianSsoIdentities",
	props: {
		user: {},
		client: { default: void 0 }
	},
	setup(e) {
		let r = e, { t: i } = Z(), o = s(), { client: c, data: l, failed: u, status: f, reload: p } = t(async (e) => a(await e.GET("/users/{user}/sso-identities", { params: {
			path: { user: r.user },
			query: { per_page: 50 }
		} })), () => r.user, r.client === void 0 ? void 0 : r.client), m = x(() => l.value?.data ?? []);
		async function h(e) {
			let t = e.email ?? e.subject;
			c && window.confirm(i("guardian.sso.identities.confirm_unlink", {
				name: t,
				connection: e.connection
			})) && await o.run(async () => a(await c.DELETE("/sso-identities/{identity}", { params: { path: { identity: e.id } } }))) && await p();
		}
		return (e, t) => {
			let r = B, a = Y, s = X;
			return L(u) && L(f) === 403 ? (A(), S(r, {
				key: 0,
				compact: ""
			})) : L(m).length > 0 ? (A(), S(s, {
				key: 1,
				"data-testid": "guardian-sso-identities"
			}, {
				header: z(() => [T("h3", Ge, I(L(i)("guardian.sso.identities.title")), 1)]),
				default: z(() => [T("ul", Ke, [(A(!0), w(b, null, N(L(m), (e) => (A(), w("li", {
					key: e.id,
					class: "flex items-center justify-between gap-2 py-2",
					"data-testid": `guardian-sso-identity-${e.id}`
				}, [T("span", null, [E(I(e.connection) + " — " + I(e.email ?? e.subject) + " ", 1), T("span", Je, I(L(i)("guardian.sso.identities.last_login")) + ": " + I(L(n)(e.last_login_at) ?? L(i)("guardian.sso.never")), 1)]), D(a, {
					size: "xs",
					variant: "ghost",
					color: "error",
					icon: "i-lucide-unlink",
					"data-testid": `guardian-sso-identity-unlink-${e.id}`,
					onClick: (t) => h(e)
				}, {
					default: z(() => [E(I(L(i)("guardian.sso.identities.unlink")), 1)]),
					_: 1
				}, 8, ["data-testid", "onClick"])], 8, qe))), 128))]), D(d, {
					action: L(o),
					testid: "guardian-sso-identity-unlink"
				}, null, 8, ["action"])]),
				_: 1
			})) : C("", !0);
		};
	}
}), Xe = {
	key: 0,
	"data-testid": "hooks-guardian-sso-identities"
}, Ze = /* @__PURE__ */ O({
	__name: "GuardianSsoIdentitiesSection",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = x(() => $(t.record));
		return (e, t) => L(i) && L(n) ? (A(), w("div", Xe, [(A(), S(Ye, {
			key: L(i),
			user: L(i)
		}, null, 8, ["user"]))])) : C("", !0);
	}
}), Qe = {
	class: "space-y-4",
	"data-testid": "guardian-sso-connections"
}, $e = { class: "space-y-4" }, et = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-sso-connections-empty"
}, tt = {
	key: 1,
	class: "w-full text-left text-sm"
}, nt = { class: "text-muted" }, rt = { class: "py-2 pr-3 font-medium" }, it = { class: "py-2 pr-3 font-medium" }, at = { class: "py-2 font-medium" }, ot = { class: "divide-y divide-default" }, st = ["data-testid"], ct = { class: "py-2 pr-3" }, lt = { class: "flex flex-wrap items-center gap-2" }, ut = { class: "py-2 pr-3" }, dt = { class: "py-2" }, ft = { class: "font-medium" }, pt = { class: "flex flex-wrap items-end gap-3" }, mt = ["value"], ht = /* @__PURE__ */ O({
	__name: "GuardianSsoConnections",
	props: {
		organization: {},
		client: { default: void 0 }
	},
	setup(n) {
		let r = n, { t: i } = Z(), o = s(), c = M(1), u = x(() => ({
			per_page: 25,
			...c.value > 1 ? { page: c.value } : {}
		})), { client: _, data: y, pending: O, failed: k, status: F } = t(async (e) => a(await e.GET("/organizations/{organization}/sso-connections", { params: {
			path: { organization: r.organization },
			query: u.value
		} })), () => [r.organization, u.value], r.client === void 0 ? void 0 : r.client), B = x(() => y.value?.data ?? []), V = x(() => l(y.value)), H = j({
			name: "",
			protocol: "oidc"
		}), W = j({});
		async function G() {
			if (!_) return;
			let t = { connection: null };
			await o.run(async () => {
				t.connection = a(await _.POST("/organizations/{organization}/sso-connections", {
					params: { path: { organization: r.organization } },
					body: e({
						name: H.name.trim(),
						protocol: H.protocol,
						...m(H.protocol, W)
					})
				})).data;
			}) && t.connection && await U(h(t.connection.slug));
		}
		function K(e) {
			c.value = e;
		}
		return (e, t) => {
			let n = P("RouterLink"), r = J, a = ae, s = ie, c = Y, l = X;
			return A(), w("div", Qe, [D(p, {
				ready: !L(O) && L(y) !== null,
				failed: L(k),
				status: L(F),
				compact: ""
			}, {
				default: z(() => [T("div", $e, [
					L(B).length === 0 ? (A(), w("p", et, I(L(i)("guardian.sso.connections.empty")), 1)) : (A(), w("table", tt, [T("thead", nt, [T("tr", null, [
						T("th", rt, I(L(i)("guardian.sso.fields.name")), 1),
						T("th", it, I(L(i)("guardian.sso.fields.protocol")), 1),
						T("th", at, I(L(i)("guardian.sso.identities.title")), 1)
					])]), T("tbody", ot, [(A(!0), w(b, null, N(L(B), (e) => (A(), w("tr", {
						key: e.slug,
						"data-testid": `guardian-sso-connection-${e.slug}`
					}, [
						T("td", ct, [T("div", lt, [
							D(n, {
								to: L(h)(e.slug),
								class: "font-medium hover:underline",
								"data-testid": "guardian-sso-connection-link"
							}, {
								default: z(() => [E(I(e.name), 1)]),
								_: 2
							}, 1032, ["to"]),
							e.enforced ? (A(), S(r, {
								key: 0,
								color: "warning",
								variant: "subtle"
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.enforced_badge")), 1)]),
								_: 1
							})) : C("", !0),
							e.enabled ? C("", !0) : (A(), S(r, {
								key: 1,
								color: "neutral",
								variant: "subtle"
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.disabled_badge")), 1)]),
								_: 1
							}))
						])]),
						T("td", ut, I(L(i)(`guardian.sso.protocols.${e.protocol}`, e.protocol)), 1),
						T("td", dt, I(e.identities_count ?? "—"), 1)
					], 8, st))), 128))])])),
					D(f, {
						current: L(V).current,
						last: L(V).last,
						testid: "guardian-sso-connections",
						onGo: K
					}, null, 8, ["current", "last"]),
					D(l, null, {
						header: z(() => [T("h3", ft, I(L(i)("guardian.sso.connections.new")), 1)]),
						default: z(() => [T("form", {
							class: "space-y-3",
							"data-testid": "guardian-sso-new-form",
							onSubmit: te(G, ["prevent"])
						}, [
							T("div", pt, [D(s, {
								label: L(i)("guardian.sso.fields.name"),
								error: L(o).error("name"),
								required: ""
							}, {
								default: z(() => [D(a, {
									modelValue: L(H).name,
									"onUpdate:modelValue": t[0] ||= (e) => L(H).name = e,
									class: "w-56",
									"data-testid": "guardian-sso-new-name"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]), D(s, {
								label: L(i)("guardian.sso.fields.protocol"),
								error: L(o).error("protocol"),
								required: ""
							}, {
								default: z(() => [ee(T("select", {
									"onUpdate:modelValue": t[1] ||= (e) => L(H).protocol = e,
									class: "w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
									"data-testid": "guardian-sso-new-protocol"
								}, [(A(!0), w(b, null, N(L(g), (e) => (A(), w("option", {
									key: e,
									value: e
								}, I(L(i)(`guardian.sso.protocols.${e}`)), 9, mt))), 128))], 512), [[R, L(H).protocol]])]),
								_: 1
							}, 8, ["label", "error"])]),
							D(v, {
								protocol: L(H).protocol,
								values: L(W),
								action: L(o),
								testid: "guardian-sso-new"
							}, null, 8, [
								"protocol",
								"values",
								"action"
							]),
							Object.keys(L(o).errors.value).length === 0 ? (A(), S(d, {
								key: 0,
								action: L(o),
								testid: "guardian-sso-new"
							}, null, 8, ["action"])) : C("", !0),
							D(c, {
								type: "submit",
								icon: "i-lucide-plus",
								loading: L(o).busy.value,
								"data-testid": "guardian-sso-new-submit"
							}, {
								default: z(() => [E(I(L(i)("guardian.sso.connections.create")), 1)]),
								_: 1
							}, 8, ["loading"])
						], 32)]),
						_: 1
					})
				])]),
				_: 1
			}, 8, [
				"ready",
				"failed",
				"status"
			])]);
		};
	}
}), gt = {
	key: 0,
	"data-testid": "hooks-guardian-sso"
}, _t = /* @__PURE__ */ O({
	__name: "GuardianSsoTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = x(() => $(t.record));
		return (e, t) => L(i) && L(n) ? (A(), w("div", gt, [(A(), S(ht, {
			key: L(i),
			organization: L(i)
		}, null, 8, ["organization"]))])) : C("", !0);
	}
}), vt = {
	key: 0,
	"data-testid": "hooks-guardian-user-security"
}, yt = /* @__PURE__ */ O({
	__name: "GuardianUserSecurityTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = x(() => $(t.record));
		return (e, t) => L(i) && L(n) ? (A(), w("div", vt, [(A(), S(y, {
			key: L(i),
			user: L(i)
		}, null, 8, ["user"]))])) : C("", !0);
	}
}), bt = { guardian: { access: {
	filter: "Filter",
	clear: "Clear",
	save: "Save",
	saved: "Saved.",
	pager: {
		previous: "Previous",
		next: "Next",
		page: "Page {current} of {last}"
	},
	scopes: {
		global: "Global",
		any: "Any scope"
	},
	roles: {
		title: "Roles",
		role: "Role",
		new: "New role",
		create: "Create",
		delete: "Delete role",
		empty: "No roles found.",
		not_found: "This role was not found.",
		super: "Super",
		built_in: "Built-in",
		everything: "Everything",
		no_permissions: "No permissions to choose from.",
		slug_hint: "Leave blank to make one from the name.",
		super_hint: "This role passes every permission check; it has no permission list.",
		confirm_delete: "Delete the role \"{name}\"? Everyone assigned it loses it.",
		fields: {
			name: "Name",
			slug: "Slug",
			scope: "Scope",
			description: "Description",
			permissions: "Permissions"
		}
	},
	permissions: {
		title: "Permissions",
		new: "New permission",
		create: "Create",
		delete: "Delete",
		empty: "No permissions found.",
		built_in: "Built-in",
		search: "Search",
		name_hint: "Lower-case, dot-separated, e.g. invoices.edit.",
		confirm_delete: "Delete the permission \"{name}\"? Roles that grant it lose it.",
		fields: {
			name: "Name",
			description: "Description"
		}
	},
	assignments: {
		title: "Role assignments",
		empty: "No role assignments.",
		assign: "Assign",
		revoke: "Revoke",
		pick_role: "Choose a role",
		any_scope: "Any scope",
		confirm_revoke: "Revoke the role \"{role}\" from user {user}?",
		fields: {
			user: "User",
			role: "Role",
			scope: "Scope",
			scope_type: "Scope type",
			scope_id: "Scope id",
			assigned_at: "Assigned"
		}
	},
	user: {
		title: "User {user}",
		assignments: "Role assignments",
		abilities: "Abilities",
		show_abilities: "Show",
		super_admin: "Super admin: every ability.",
		no_abilities: "No abilities here.",
		sessions: "Sessions",
		no_sessions: "No sessions.",
		revoke_sessions: "Sign out everywhere",
		confirm_revoke_sessions: "Sign {user} out of every session?",
		sessions_revoked: "Signed out {count} sessions.",
		tokens: "API tokens",
		no_tokens: "No API tokens.",
		never_used: "never used",
		revoke_tokens: "Revoke all tokens",
		confirm_revoke_tokens: "Revoke every API token of {user}?",
		events: "Recent events",
		no_events: "No security events.",
		two_factor: "Two-factor authentication",
		reset_two_factor: "Reset two-factor",
		reset_two_factor_hint: "Removes every two-factor method, passkey and recovery code, for a user who lost theirs.",
		confirm_reset_two_factor: "Reset two-factor authentication for {user}? They will have to set it up again.",
		two_factor_reset: "Two-factor authentication was reset."
	}
} } }, xt = { guardian: { admin: {
	filter: "Filter",
	clear: "Clear",
	save: "Save",
	delete: "Delete",
	never: "Never",
	yes: "Yes",
	no: "No",
	events: {
		title: "Security events",
		empty: "No security events found.",
		any_type: "Any type",
		from: "From",
		to: "To",
		older: "Older",
		newer: "Newer",
		fields: {
			type: "Type",
			user: "User",
			ip: "IP address",
			occurred_at: "When"
		}
	},
	event: {
		title: "Security event",
		not_found: "This security event was not found.",
		user_agent: "User agent",
		identifier_hash: "Identifier hash",
		context: "Context",
		no_context: "This event has no context."
	},
	lockouts: {
		title: "Lockouts",
		clear: "Clear a lockout",
		hint: "Lets an identifier or address that failed too many sign-ins try again now.",
		identifier: "Identifier or IP address",
		submit: "Clear lockout",
		confirm: "Clear the lockout of {identifier}?",
		cleared: "The lockout of {identifier} was cleared.",
		recent: "Recent lockouts"
	},
	ip_rules: {
		title: "IP rules",
		new: "New IP rule",
		create: "Add rule",
		empty: "No IP rules.",
		cidr_hint: "An address or a CIDR range, such as 203.0.113.0/24.",
		confirm_delete: "Delete the IP rule for {cidr}?",
		confirm_allow_delete: "Guardian runs in allowlist mode: once the allow rule for {cidr} is gone, requests from it that match no other allow rule are refused, which may lock you out. Delete it anyway?",
		allowlist_warning: "Allowlist mode: a request matching no allow rule is refused.",
		mode: {
			allowlist: "Mode: allowlist. Only addresses an allow rule matches get in.",
			denylist: "Mode: denylist. Addresses a deny rule matches are refused."
		},
		actions: {
			allow: "Allow",
			deny: "Deny"
		},
		fields: {
			cidr: "CIDR",
			action: "Action",
			description: "Description",
			expires_at: "Expires"
		}
	},
	password_policy: {
		title: "Password policy",
		read_only: "Set in Guardian's configuration; read-only here.",
		length: "Length",
		length_value: "{min} to {max} characters",
		rules: {
			letters: "Needs a letter",
			mixed_case: "Needs upper and lower case",
			numbers: "Needs a number",
			symbols: "Needs a symbol"
		},
		uncompromised: "Breach check",
		uncompromised_on: "Refused when found in breaches more than {threshold} times",
		history: "History",
		history_value: "Cannot reuse the last {count} passwords",
		max_age: "Maximum age",
		max_age_value: "{days} days"
	},
	policies: {
		title: "Two-factor policies",
		new: "New two-factor policy",
		create: "Add policy",
		empty: "No two-factor policies.",
		everyone: "Everyone",
		any_role: "Any role",
		methods_hint: "Leave every method unticked to allow them all.",
		confirm_delete: "Delete the two-factor policy for {scope}?",
		methods: {
			totp: "Authenticator app",
			email: "Email",
			sms: "SMS",
			passkey: "Passkey"
		},
		fields: {
			scope: "Scope",
			scope_type: "Scope type",
			scope_id: "Scope ID",
			role: "Role",
			required: "Required",
			methods: "Methods",
			grace_days: "Grace days"
		}
	}
} } }, St = { guardian: { security: {
	title: "My security",
	two_factor: {
		title: "Two-factor authentication",
		on: "On",
		off: "Off",
		required: "Required for your account.",
		deadline: "Set it up by {deadline}."
	},
	sessions: {
		title: "Sessions",
		current: "This session",
		unknown: "Unknown browser",
		revoke: "Sign out",
		others: "Sign out everywhere else",
		also_tokens: "Also revoke my API tokens",
		confirm_revoke: "Sign this session out?",
		confirm_others: "Sign out every other session?",
		confirm_others_tokens: "Sign out every other session and revoke all your API tokens?",
		revoked: "Signed out {count} sessions and revoked {tokens} API tokens."
	},
	devices: {
		title: "Devices",
		unnamed: "Unknown device",
		forget: "Forget",
		none: "No devices yet.",
		confirm_forget: "Forget this device? Signing in from it will count as a new device."
	},
	tokens: {
		title: "API tokens",
		not_enabled: "API tokens are not enabled on this site.",
		none: "No API tokens.",
		name: "Name",
		abilities: "Abilities",
		every_ability: "Everything (*)",
		expires_at: "Expires on",
		expiry_hint: "No later than {date}.",
		expiry_too_late: "Tokens may last at most {days} days.",
		issue: "Issue token",
		plain_once: "Copy this token now. It will not be shown again.",
		copy: "Copy",
		copied: "Copied",
		done: "Done",
		expires: "expires {date}",
		no_expiry: "never expires",
		revoke: "Revoke",
		confirm_revoke: "Revoke the token \"{name}\"? Anything using it stops working."
	},
	activity: {
		title: "Recent activity",
		none: "No security events yet.",
		older: "Older",
		newer: "Newer"
	}
} } }, Ct = { guardian: { sso: {
	save: "Save",
	saved: "Saved.",
	copy: "Copy",
	copied: "Copied",
	never: "Never",
	enforced_badge: "Enforced",
	disabled_badge: "Disabled",
	tenant_hint: "Your Entra tenant ID or verified domain. Multi-tenant values (common, organizations) are not allowed.",
	secret_hint: "Leave blank to keep the current value.",
	protocols: {
		oidc: "OpenID Connect",
		azure: "Microsoft Entra ID",
		saml: "SAML 2.0"
	},
	fields: {
		name: "Name",
		protocol: "Protocol",
		issuer: "Issuer",
		tenant: "Tenant",
		client_id: "Client ID",
		client_secret: "Client secret",
		metadata_url: "Metadata URL",
		entity_id: "Entity ID",
		sso_url: "SSO URL",
		certificate: "Certificate",
		jit: "Create accounts on first sign-in",
		enforced: "Require SSO for this organization's domains",
		enabled: "Enabled"
	},
	connections: {
		empty: "No SSO connections yet.",
		new: "New SSO connection",
		create: "Create"
	},
	connection: {
		title: "SSO connection",
		not_found: "This SSO connection was not found.",
		back: "Back to the organization",
		settings: "Settings",
		callback_url: "Callback / ACS URL",
		metadata_url: "Service provider metadata",
		test_sign_in: "Test sign-in",
		delete: "Delete connection",
		confirm_delete: "Delete the SSO connection {name}? Its members can no longer sign in through it."
	},
	scim: {
		base_url: "SCIM base URL",
		empty: "No SCIM tokens yet.",
		new: "New SCIM token",
		create: "Create",
		created: "Copy this token now. It will not be shown again.",
		connection: "SSO connection",
		link_connection: "Link to SSO connection",
		no_connection: "None",
		expires_in_days: "Expires in (days)",
		expires: "Expires",
		last_used: "Last used",
		revoked: "Revoked",
		expired: "Expired",
		revoke: "Revoke",
		confirm_revoke: "Revoke the SCIM token {name}? The identity provider using it stops syncing."
	},
	identities: {
		title: "SSO identities",
		last_login: "Last sign-in",
		unlink: "Unlink",
		confirm_unlink: "Unlink the SSO identity {name} from {connection}?"
	}
} } }, wt = { guardian: { two_factor: {
	confirm: "Confirm",
	cancel: "Cancel",
	never_used: "never used",
	throttled: "Too many attempts.",
	retry_after: "Try again in {seconds} seconds.",
	types: {
		totp: "Authenticator app",
		email: "Email code",
		sms: "SMS code",
		passkey: "Passkey"
	},
	fields: {
		label: "Label",
		code: "Code",
		recovery_code: "Recovery code",
		type: "Send codes by",
		email: "Email address",
		phone: "Phone number (+15551234567)"
	},
	deadline: {
		notice: "Set up two-factor authentication by {deadline}.",
		link: "Set it up"
	},
	totp: {
		title: "Authenticator app",
		begin: "Set up an authenticator app",
		scan: "Scan this code with your authenticator app, then enter the code it shows.",
		qr_label: "QR code for your authenticator app",
		manual: "Or enter this key by hand:"
	},
	one_time: {
		title: "Email or SMS codes",
		send: "Send code",
		resend: "Send again",
		sent: "We sent you a code.",
		unavailable: "{type} is not available on this site."
	},
	passkeys: {
		title: "Passkeys",
		add: "Add a passkey",
		none: "No passkeys yet.",
		unnamed: "Passkey",
		unavailable: "Passkeys are not available here."
	},
	methods: {
		title: "Your methods",
		none: "No two-factor methods yet."
	},
	recovery: {
		title: "Recovery codes",
		once: "Save these codes somewhere safe. Each works once, and they will not be shown again.",
		copy: "Copy",
		copied: "Copied",
		download: "Download",
		done: "I saved them",
		remaining: "{count} recovery codes left.",
		regenerate: "Make new recovery codes",
		confirm_regenerate: "Make new recovery codes? The old ones stop working."
	},
	remove: {
		button: "Remove",
		proof: "Remove {name}: a code from another method, or a recovery code",
		proof_hint: "Proves it is you before a method goes.",
		confirm: "Remove",
		required: "Two-factor authentication is required, so your last method cannot be removed."
	},
	challenge: {
		title: "Two-factor authentication",
		intro: "Confirm it is you to continue.",
		submit: "Continue",
		use_passkey: "Use a passkey",
		load_failed: "Your two-factor methods could not be loaded.",
		try_later: "Wait a minute, then try again.",
		no_methods: "You have no two-factor method to use here.",
		methods: {
			totp: "Authenticator app",
			email: "Email code",
			sms: "SMS code",
			passkey: "Passkey",
			recovery: "Recovery code"
		}
	},
	setup: {
		title: "Set up two-factor authentication",
		intro: "This account needs a second step to sign in.",
		allowed: "Allowed methods: {methods}.",
		deadline: "Set it up by {deadline}.",
		load_failed: "Two-factor setup could not be loaded."
	}
} } }, Tt = { guardian: { state: {
	not_found: "This record was not found.",
	load_failed: "Guardian could not be loaded."
} } }, Et = [
	{
		path: "/guardian/ip-rules",
		name: "guardian-ip-rules",
		component: () => import("./chunks/ip-rules-2OoGbCmR.js")
	},
	{
		path: "/guardian/lockouts",
		name: "guardian-lockouts",
		component: () => import("./chunks/lockouts-N5eJk9lX.js")
	},
	{
		path: "/guardian/password-policy",
		name: "guardian-password-policy",
		component: () => import("./chunks/password-policy-Uq-5MyqY.js")
	},
	{
		path: "/guardian/permissions",
		name: "guardian-permissions",
		component: () => import("./chunks/permissions-BJwm6pKO.js")
	},
	{
		path: "/guardian/role-assignments",
		name: "guardian-role-assignments",
		component: () => import("./chunks/role-assignments-0HpnmRsn.js")
	},
	{
		path: "/guardian/roles/:role",
		name: "guardian-roles-role",
		component: () => import("./chunks/_role_-B0NRHks4.js")
	},
	{
		path: "/guardian/roles",
		name: "guardian-roles",
		component: () => import("./chunks/roles-BxRZFGjX.js")
	},
	{
		path: "/guardian/security-events/:event",
		name: "guardian-security-events-event",
		component: () => import("./chunks/_event_-_fFel2_7.js")
	},
	{
		path: "/guardian/security-events",
		name: "guardian-security-events",
		component: () => import("./chunks/security-events-75n3PHh-.js")
	},
	{
		path: "/guardian/security",
		name: "guardian-security",
		component: () => import("./chunks/security-Blrm7v4b.js")
	},
	{
		path: "/guardian/sso-connections/:connection",
		name: "guardian-sso-connections-connection",
		component: () => import("./chunks/_connection_-BbTW36en.js")
	},
	{
		path: "/guardian/two-factor-policies",
		name: "guardian-two-factor-policies",
		component: () => import("./chunks/two-factor-policies-CP5Pt0YI.js")
	},
	{
		path: "/guardian/two-factor/challenge",
		name: "guardian-two-factor-challenge",
		component: () => import("./chunks/challenge-CSzwTEgG.js"),
		meta: { atrium: { public: !0 } }
	},
	{
		path: "/guardian/two-factor/setup",
		name: "guardian-two-factor-setup",
		component: () => import("./chunks/setup-BO_CaYsA.js"),
		meta: { atrium: { public: !0 } }
	},
	{
		path: "/guardian/users/:user",
		name: "guardian-users-user",
		component: () => import("./chunks/_user_-rybFUqXk.js")
	}
], Dt = {
	"guardian.security": "guardian-security",
	"guardian.two-factor-challenge": "guardian-two-factor-challenge",
	"guardian.two-factor-setup": "guardian-two-factor-setup",
	"guardian.roles": "guardian-roles",
	"guardian.role": "guardian-roles-role",
	"guardian.permissions": "guardian-permissions",
	"guardian.role-assignments": "guardian-role-assignments",
	"guardian.user": "guardian-users-user",
	"guardian.security-events": "guardian-security-events",
	"guardian.security-event": "guardian-security-events-event",
	"guardian.lockouts": "guardian-lockouts",
	"guardian.ip-rules": "guardian-ip-rules",
	"guardian.two-factor-policies": "guardian-two-factor-policies",
	"guardian.password-policy": "guardian-password-policy",
	"guardian.sso-connection": "guardian-sso-connections-connection"
}, Ot = V({
	key: "guardian",
	routes: Et,
	screens: Dt,
	extensions: {
		"guardian.access": ge,
		"guardian.user-security": yt,
		"guardian.sso": _t,
		"guardian.scim": We,
		"guardian.sso-identities": Ze
	},
	responseHandlers: { [oe]: fe(G()) },
	messages: { en: H(bt, xt, St, Ct, wt, Tt) }
});
export { Ot as default, Dt as screens };
