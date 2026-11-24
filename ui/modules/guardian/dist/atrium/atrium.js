import { c as e, d as t, i as n, l as r, n as i, o as a, t as o, u as s } from "./chunks/guardian-D9MeowUD.js";
import { t as c } from "./chunks/GuardianAssignments-CabyQgcA.js";
import { i as l, s as u } from "./chunks/access-CMUXpA7X.js";
import { t as d } from "./chunks/GuardianErrors-DtyToZz8.js";
import { t as f } from "./chunks/GuardianPager-DnfHQ8Kk.js";
import { t as p } from "./chunks/GuardianState-DytBr9ih.js";
import { c as m, i as h, r as g, s as _, t as v } from "./chunks/SsoConnectionFields-BBomoNqB.js";
import { t as y } from "./chunks/UserSecurity-DcIvqrU6.js";
import { AtriumNoAccess as b, atriumRouter as x, defineAtriumModule as S, mergeAtriumMessages as C, navigateTo as w, useAsyncData as T, useAtrium as E, useAtriumApi as D, useAtriumIntegration as ee } from "@refactor-circus/atrium";
import { Fragment as O, computed as k, createBlock as A, createCommentVNode as j, createElementBlock as M, createElementVNode as N, createTextVNode as P, createVNode as F, defineComponent as I, onBeforeUnmount as te, openBlock as L, reactive as R, ref as z, renderList as B, resolveComponent as V, shallowRef as ne, toDisplayString as H, unref as U, vModelSelect as re, withCtx as W, withDirectives as G, withModifiers as ie } from "vue";
import { UAlert as ae, UBadge as oe, UButton as K, UCard as q, UFormField as J, UInput as Y } from "@refactor-circus/atrium/ui";
import { useI18n as X } from "vue-i18n";
// src/components/two-factor/handler.ts
var se = "guardian.two-factor", ce = "Guardian-Two-Factor-Deadline", le = "guardian.two-factor-deadline", Z = {
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
		let r = x(), i = t.headers.get(ce);
		if (i && e.notify(le, {
			id: i,
			message: "guardian.two_factor.deadline.notice",
			params: { deadline: n(i) ?? i },
			link: {
				to: "/guardian/security",
				label: "guardian.two_factor.deadline.link"
			},
			color: "warning"
		}), t.status !== 403 || Q || ue(r.currentRoute.value.path)) return;
		let a = Z[await de(t) ?? ""] ?? null;
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
}, ge = /* @__PURE__ */ I({
	__name: "GuardianAccessTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = D(), i = r(), a = k(() => me(t.data, t.record)), { data: o } = T("guardian-hook-scope-types", async () => {
			try {
				return await n("/screens/guardian.role-assignments");
			} catch {
				return null;
			}
		}, { server: !1 }), s = k(() => u(o.value?.data.options));
		return (e, t) => U(a) && U(i) ? (L(), M("div", he, ["user" in U(a) ? (L(), A(c, {
			key: U(a).user,
			user: U(a).user,
			"scope-types": U(s)
		}, null, 8, ["user", "scope-types"])) : (L(), A(c, {
			key: `${U(a).scopeType}:${U(a).scopeId}`,
			"scope-type": U(a).scopeType,
			"scope-id": U(a).scopeId,
			"scope-types": U(s)
		}, null, 8, [
			"scope-type",
			"scope-id",
			"scope-types"
		]))])) : j("", !0);
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
}, Te = { class: "text-muted" }, Ee = { class: "py-2 pr-3 font-medium" }, De = { class: "py-2 pr-3 font-medium" }, Oe = { class: "py-2 pr-3 font-medium" }, ke = { class: "py-2 pr-3 font-medium" }, Ae = { class: "divide-y divide-default" }, je = ["data-testid"], Me = { class: "py-2 pr-3" }, Ne = { class: "flex flex-wrap items-center gap-2" }, Pe = { class: "py-2 pr-3" }, Fe = { class: "py-2 pr-3 text-muted" }, Ie = { class: "py-2 pr-3 text-muted" }, Le = { class: "py-2 text-right" }, Re = { class: "font-medium" }, ze = { value: "" }, Be = ["value"], Ve = { class: "mt-3" }, He = /* @__PURE__ */ I({
	__name: "GuardianScimTokens",
	props: {
		organization: {},
		scimPath: { default: null },
		client: { default: void 0 }
	},
	setup(e) {
		let r = e, { t: i } = X(), o = s(), c = s(), { apiBase: u } = ee("guardian"), m = k(() => _(u, r.scimPath, r.organization)), h = z(1), g = k(() => ({
			per_page: 25,
			...h.value > 1 ? { page: h.value } : {}
		})), { client: v, data: y, pending: b, failed: x, status: S, reload: C } = t(async (e) => a(await e.GET("/organizations/{organization}/scim-tokens", { params: {
			path: { organization: r.organization },
			query: g.value
		} })), () => [r.organization, g.value], r.client === void 0 ? void 0 : r.client), w = ne([]);
		v && v.GET("/organizations/{organization}/sso-connections", { params: {
			path: { organization: r.organization },
			query: { per_page: 100 }
		} }).then((e) => w.value = a(e).data).catch(() => w.value = []);
		let T = k(() => y.value?.data ?? []), E = k(() => l(y.value)), D = R({
			name: "",
			expires_in_days: "",
			sso_connection: ""
		}), I = z(null), V = z(!1);
		te(() => {
			I.value = null;
		});
		function se(e) {
			let t = Number(e);
			return e === "" || !Number.isFinite(t) ? null : Math.trunc(t);
		}
		async function ce() {
			if (!v) return;
			I.value = null, V.value = !1;
			let e = { token: null };
			await o.run(async () => {
				e.token = a(await v.POST("/organizations/{organization}/scim-tokens", {
					params: { path: { organization: r.organization } },
					body: {
						name: D.name.trim(),
						expires_in_days: se(D.expires_in_days),
						sso_connection: D.sso_connection === "" ? null : D.sso_connection
					}
				})).token;
			}) && (I.value = e.token, Object.assign(D, {
				name: "",
				expires_in_days: "",
				sso_connection: ""
			}), await C());
		}
		async function le() {
			I.value && (await navigator.clipboard?.writeText(I.value), V.value = !0);
		}
		async function Z(e) {
			v && window.confirm(i("guardian.sso.scim.confirm_revoke", { name: e.name })) && await c.run(async () => a(await v.DELETE("/scim-tokens/{token}", { params: { path: { token: e.id } } }))) && await C();
		}
		function Q(e) {
			h.value = e;
		}
		return (e, t) => {
			let r = K, a = ae, s = q, l = oe, u = Y, h = J;
			return L(), M("div", _e, [
				U(I) ? (L(), A(a, {
					key: 0,
					color: "warning",
					variant: "subtle",
					title: U(i)("guardian.sso.scim.created"),
					"data-testid": "guardian-scim-plain"
				}, {
					description: W(() => [N("div", ve, [N("code", ye, H(U(I)), 1), F(r, {
						size: "xs",
						variant: "soft",
						icon: "i-lucide-copy",
						"data-testid": "guardian-scim-copy",
						onClick: le
					}, {
						default: W(() => [P(H(U(V) ? U(i)("guardian.sso.copied") : U(i)("guardian.sso.copy")), 1)]),
						_: 1
					})])]),
					_: 1
				}, 8, ["title"])) : j("", !0),
				F(s, null, {
					header: W(() => [N("h3", be, H(U(i)("guardian.sso.scim.base_url")), 1)]),
					default: W(() => [N("code", xe, H(U(m) ?? "—"), 1)]),
					_: 1
				}),
				F(p, {
					ready: !U(b) && U(y) !== null,
					failed: U(x),
					status: U(S),
					compact: ""
				}, {
					default: W(() => [N("div", Se, [
						F(d, {
							action: U(c),
							testid: "guardian-scim-revoke"
						}, null, 8, ["action"]),
						U(T).length === 0 ? (L(), M("p", Ce, H(U(i)("guardian.sso.scim.empty")), 1)) : (L(), M("table", we, [N("thead", Te, [N("tr", null, [
							N("th", Ee, H(U(i)("guardian.sso.fields.name")), 1),
							N("th", De, H(U(i)("guardian.sso.scim.connection")), 1),
							N("th", Oe, H(U(i)("guardian.sso.scim.last_used")), 1),
							N("th", ke, H(U(i)("guardian.sso.scim.expires")), 1),
							t[3] ||= N("th", { class: "py-2" }, null, -1)
						])]), N("tbody", Ae, [(L(!0), M(O, null, B(U(T), (e) => (L(), M("tr", {
							key: e.id,
							"data-testid": `guardian-scim-token-${e.id}`
						}, [
							N("td", Me, [N("div", Ne, [P(H(e.name) + " ", 1), e.revoked_at ? (L(), A(l, {
								key: 0,
								color: "neutral",
								variant: "subtle"
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.scim.revoked")), 1)]),
								_: 1
							})) : e.usable ? j("", !0) : (L(), A(l, {
								key: 1,
								color: "neutral",
								variant: "subtle"
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.scim.expired")), 1)]),
								_: 1
							}))])]),
							N("td", Pe, H(e.sso_connection ?? "—"), 1),
							N("td", Fe, H(U(n)(e.last_used_at) ?? U(i)("guardian.sso.never")), 1),
							N("td", Ie, H(U(n)(e.expires_at) ?? U(i)("guardian.sso.never")), 1),
							N("td", Le, [e.revoked_at ? j("", !0) : (L(), A(r, {
								key: 0,
								size: "xs",
								color: "error",
								variant: "ghost",
								icon: "i-lucide-ban",
								"data-testid": `guardian-scim-revoke-${e.id}`,
								onClick: (t) => Z(e)
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.scim.revoke")), 1)]),
								_: 1
							}, 8, ["data-testid", "onClick"]))])
						], 8, je))), 128))])])),
						F(f, {
							current: U(E).current,
							last: U(E).last,
							testid: "guardian-scim-tokens",
							onGo: Q
						}, null, 8, ["current", "last"]),
						F(s, null, {
							header: W(() => [N("h3", Re, H(U(i)("guardian.sso.scim.new")), 1)]),
							default: W(() => [N("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "guardian-scim-form",
								onSubmit: ie(ce, ["prevent"])
							}, [
								F(h, {
									label: U(i)("guardian.sso.fields.name"),
									error: U(o).error("name"),
									required: ""
								}, {
									default: W(() => [F(u, {
										modelValue: U(D).name,
										"onUpdate:modelValue": t[0] ||= (e) => U(D).name = e,
										class: "w-56",
										"data-testid": "guardian-scim-name"
									}, null, 8, ["modelValue"])]),
									_: 1
								}, 8, ["label", "error"]),
								F(h, {
									label: U(i)("guardian.sso.scim.expires_in_days"),
									error: U(o).error("expires_in_days")
								}, {
									default: W(() => [F(u, {
										modelValue: U(D).expires_in_days,
										"onUpdate:modelValue": t[1] ||= (e) => U(D).expires_in_days = e,
										type: "number",
										min: "1",
										max: "3650",
										class: "w-32",
										"data-testid": "guardian-scim-expires"
									}, null, 8, ["modelValue"])]),
									_: 1
								}, 8, ["label", "error"]),
								F(h, {
									label: U(i)("guardian.sso.scim.link_connection"),
									error: U(o).error("sso_connection")
								}, {
									default: W(() => [G(N("select", {
										"onUpdate:modelValue": t[2] ||= (e) => U(D).sso_connection = e,
										class: "w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
										"data-testid": "guardian-scim-connection"
									}, [N("option", ze, H(U(i)("guardian.sso.scim.no_connection")), 1), (L(!0), M(O, null, B(U(w), (e) => (L(), M("option", {
										key: e.slug,
										value: e.slug
									}, H(e.name), 9, Be))), 128))], 512), [[re, U(D).sso_connection]])]),
									_: 1
								}, 8, ["label", "error"]),
								F(r, {
									type: "submit",
									icon: "i-lucide-plus",
									loading: U(o).busy.value,
									"data-testid": "guardian-scim-submit"
								}, {
									default: W(() => [P(H(U(i)("guardian.sso.scim.create")), 1)]),
									_: 1
								}, 8, ["loading"])
							], 32), N("div", Ve, [Object.keys(U(o).errors.value).length === 0 ? (L(), A(d, {
								key: 0,
								action: U(o),
								testid: "guardian-scim-issue"
							}, null, 8, ["action"])) : j("", !0)])]),
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
}, We = /* @__PURE__ */ I({
	__name: "GuardianScimTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = k(() => $(t.record)), a = k(() => typeof t.data.scim_path == "string" ? t.data.scim_path : null);
		return (e, t) => U(i) && U(n) ? (L(), M("div", Ue, [(L(), A(He, {
			key: U(i),
			organization: U(i),
			"scim-path": U(a)
		}, null, 8, ["organization", "scim-path"]))])) : j("", !0);
	}
}), Ge = { class: "font-semibold" }, Ke = { class: "divide-y divide-default text-sm" }, qe = ["data-testid"], Je = { class: "text-muted" }, Ye = /* @__PURE__ */ I({
	__name: "GuardianSsoIdentities",
	props: {
		user: {},
		client: { default: void 0 }
	},
	setup(e) {
		let r = e, { t: i } = X(), o = s(), { client: c, data: l, failed: u, status: f, reload: p } = t(async (e) => a(await e.GET("/users/{user}/sso-identities", { params: {
			path: { user: r.user },
			query: { per_page: 50 }
		} })), () => r.user, r.client === void 0 ? void 0 : r.client), m = k(() => l.value?.data ?? []);
		async function h(e) {
			let t = e.email ?? e.subject;
			c && window.confirm(i("guardian.sso.identities.confirm_unlink", {
				name: t,
				connection: e.connection
			})) && await o.run(async () => a(await c.DELETE("/sso-identities/{identity}", { params: { path: { identity: e.id } } }))) && await p();
		}
		return (e, t) => {
			let r = b, a = K, s = q;
			return U(u) && U(f) === 403 ? (L(), A(r, {
				key: 0,
				compact: ""
			})) : U(m).length > 0 ? (L(), A(s, {
				key: 1,
				"data-testid": "guardian-sso-identities"
			}, {
				header: W(() => [N("h3", Ge, H(U(i)("guardian.sso.identities.title")), 1)]),
				default: W(() => [N("ul", Ke, [(L(!0), M(O, null, B(U(m), (e) => (L(), M("li", {
					key: e.id,
					class: "flex items-center justify-between gap-2 py-2",
					"data-testid": `guardian-sso-identity-${e.id}`
				}, [N("span", null, [P(H(e.connection) + " — " + H(e.email ?? e.subject) + " ", 1), N("span", Je, H(U(i)("guardian.sso.identities.last_login")) + ": " + H(U(n)(e.last_login_at) ?? U(i)("guardian.sso.never")), 1)]), F(a, {
					size: "xs",
					variant: "ghost",
					color: "error",
					icon: "i-lucide-unlink",
					"data-testid": `guardian-sso-identity-unlink-${e.id}`,
					onClick: (t) => h(e)
				}, {
					default: W(() => [P(H(U(i)("guardian.sso.identities.unlink")), 1)]),
					_: 1
				}, 8, ["data-testid", "onClick"])], 8, qe))), 128))]), F(d, {
					action: U(o),
					testid: "guardian-sso-identity-unlink"
				}, null, 8, ["action"])]),
				_: 1
			})) : j("", !0);
		};
	}
}), Xe = {
	key: 0,
	"data-testid": "hooks-guardian-sso-identities"
}, Ze = /* @__PURE__ */ I({
	__name: "GuardianSsoIdentitiesSection",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = k(() => $(t.record));
		return (e, t) => U(i) && U(n) ? (L(), M("div", Xe, [(L(), A(Ye, {
			key: U(i),
			user: U(i)
		}, null, 8, ["user"]))])) : j("", !0);
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
}, nt = { class: "text-muted" }, rt = { class: "py-2 pr-3 font-medium" }, it = { class: "py-2 pr-3 font-medium" }, at = { class: "py-2 font-medium" }, ot = { class: "divide-y divide-default" }, st = ["data-testid"], ct = { class: "py-2 pr-3" }, lt = { class: "flex flex-wrap items-center gap-2" }, ut = { class: "py-2 pr-3" }, dt = { class: "py-2" }, ft = { class: "font-medium" }, pt = { class: "flex flex-wrap items-end gap-3" }, mt = ["value"], ht = /* @__PURE__ */ I({
	__name: "GuardianSsoConnections",
	props: {
		organization: {},
		client: { default: void 0 }
	},
	setup(n) {
		let r = n, { t: i } = X(), o = s(), c = z(1), u = k(() => ({
			per_page: 25,
			...c.value > 1 ? { page: c.value } : {}
		})), { client: _, data: y, pending: b, failed: x, status: S } = t(async (e) => a(await e.GET("/organizations/{organization}/sso-connections", { params: {
			path: { organization: r.organization },
			query: u.value
		} })), () => [r.organization, u.value], r.client === void 0 ? void 0 : r.client), C = k(() => y.value?.data ?? []), T = k(() => l(y.value)), E = R({
			name: "",
			protocol: "oidc"
		}), D = R({});
		async function ee() {
			if (!_) return;
			let t = { connection: null };
			await o.run(async () => {
				t.connection = a(await _.POST("/organizations/{organization}/sso-connections", {
					params: { path: { organization: r.organization } },
					body: e({
						name: E.name.trim(),
						protocol: E.protocol,
						...m(E.protocol, D)
					})
				})).data;
			}) && t.connection && await w(h(t.connection.slug));
		}
		function I(e) {
			c.value = e;
		}
		return (e, t) => {
			let n = V("RouterLink"), r = oe, a = Y, s = J, c = K, l = q;
			return L(), M("div", Qe, [F(p, {
				ready: !U(b) && U(y) !== null,
				failed: U(x),
				status: U(S),
				compact: ""
			}, {
				default: W(() => [N("div", $e, [
					U(C).length === 0 ? (L(), M("p", et, H(U(i)("guardian.sso.connections.empty")), 1)) : (L(), M("table", tt, [N("thead", nt, [N("tr", null, [
						N("th", rt, H(U(i)("guardian.sso.fields.name")), 1),
						N("th", it, H(U(i)("guardian.sso.fields.protocol")), 1),
						N("th", at, H(U(i)("guardian.sso.identities.title")), 1)
					])]), N("tbody", ot, [(L(!0), M(O, null, B(U(C), (e) => (L(), M("tr", {
						key: e.slug,
						"data-testid": `guardian-sso-connection-${e.slug}`
					}, [
						N("td", ct, [N("div", lt, [
							F(n, {
								to: U(h)(e.slug),
								class: "font-medium hover:underline",
								"data-testid": "guardian-sso-connection-link"
							}, {
								default: W(() => [P(H(e.name), 1)]),
								_: 2
							}, 1032, ["to"]),
							e.enforced ? (L(), A(r, {
								key: 0,
								color: "warning",
								variant: "subtle"
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.enforced_badge")), 1)]),
								_: 1
							})) : j("", !0),
							e.enabled ? j("", !0) : (L(), A(r, {
								key: 1,
								color: "neutral",
								variant: "subtle"
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.disabled_badge")), 1)]),
								_: 1
							}))
						])]),
						N("td", ut, H(U(i)(`guardian.sso.protocols.${e.protocol}`, e.protocol)), 1),
						N("td", dt, H(e.identities_count ?? "—"), 1)
					], 8, st))), 128))])])),
					F(f, {
						current: U(T).current,
						last: U(T).last,
						testid: "guardian-sso-connections",
						onGo: I
					}, null, 8, ["current", "last"]),
					F(l, null, {
						header: W(() => [N("h3", ft, H(U(i)("guardian.sso.connections.new")), 1)]),
						default: W(() => [N("form", {
							class: "space-y-3",
							"data-testid": "guardian-sso-new-form",
							onSubmit: ie(ee, ["prevent"])
						}, [
							N("div", pt, [F(s, {
								label: U(i)("guardian.sso.fields.name"),
								error: U(o).error("name"),
								required: ""
							}, {
								default: W(() => [F(a, {
									modelValue: U(E).name,
									"onUpdate:modelValue": t[0] ||= (e) => U(E).name = e,
									class: "w-56",
									"data-testid": "guardian-sso-new-name"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]), F(s, {
								label: U(i)("guardian.sso.fields.protocol"),
								error: U(o).error("protocol"),
								required: ""
							}, {
								default: W(() => [G(N("select", {
									"onUpdate:modelValue": t[1] ||= (e) => U(E).protocol = e,
									class: "w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
									"data-testid": "guardian-sso-new-protocol"
								}, [(L(!0), M(O, null, B(U(g), (e) => (L(), M("option", {
									key: e,
									value: e
								}, H(U(i)(`guardian.sso.protocols.${e}`)), 9, mt))), 128))], 512), [[re, U(E).protocol]])]),
								_: 1
							}, 8, ["label", "error"])]),
							F(v, {
								protocol: U(E).protocol,
								values: U(D),
								action: U(o),
								testid: "guardian-sso-new"
							}, null, 8, [
								"protocol",
								"values",
								"action"
							]),
							Object.keys(U(o).errors.value).length === 0 ? (L(), A(d, {
								key: 0,
								action: U(o),
								testid: "guardian-sso-new"
							}, null, 8, ["action"])) : j("", !0),
							F(c, {
								type: "submit",
								icon: "i-lucide-plus",
								loading: U(o).busy.value,
								"data-testid": "guardian-sso-new-submit"
							}, {
								default: W(() => [P(H(U(i)("guardian.sso.connections.create")), 1)]),
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
}, _t = /* @__PURE__ */ I({
	__name: "GuardianSsoTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = k(() => $(t.record));
		return (e, t) => U(i) && U(n) ? (L(), M("div", gt, [(L(), A(ht, {
			key: U(i),
			organization: U(i)
		}, null, 8, ["organization"]))])) : j("", !0);
	}
}), vt = {
	key: 0,
	"data-testid": "hooks-guardian-user-security"
}, yt = /* @__PURE__ */ I({
	__name: "GuardianUserSecurityTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = r(), i = k(() => $(t.record));
		return (e, t) => U(i) && U(n) ? (L(), M("div", vt, [(L(), A(y, {
			key: U(i),
			user: U(i)
		}, null, 8, ["user"]))])) : j("", !0);
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
		component: () => import("./chunks/ip-rules-DzpiVcaj.js")
	},
	{
		path: "/guardian/lockouts",
		name: "guardian-lockouts",
		component: () => import("./chunks/lockouts-C2Yjii3n.js")
	},
	{
		path: "/guardian/password-policy",
		name: "guardian-password-policy",
		component: () => import("./chunks/password-policy-D0nTk8g7.js")
	},
	{
		path: "/guardian/permissions",
		name: "guardian-permissions",
		component: () => import("./chunks/permissions-XA0Mz6MW.js")
	},
	{
		path: "/guardian/role-assignments",
		name: "guardian-role-assignments",
		component: () => import("./chunks/role-assignments-SqmZVUYy.js")
	},
	{
		path: "/guardian/roles/:role",
		name: "guardian-roles-role",
		component: () => import("./chunks/_role_-D27Tp0aD.js")
	},
	{
		path: "/guardian/roles",
		name: "guardian-roles",
		component: () => import("./chunks/roles-kNs_FtUw.js")
	},
	{
		path: "/guardian/security-events/:event",
		name: "guardian-security-events-event",
		component: () => import("./chunks/_event_-CiCVJMUa.js")
	},
	{
		path: "/guardian/security-events",
		name: "guardian-security-events",
		component: () => import("./chunks/security-events-kg4S_Yv_.js")
	},
	{
		path: "/guardian/security",
		name: "guardian-security",
		component: () => import("./chunks/security-CWcScWK3.js")
	},
	{
		path: "/guardian/sso-connections/:connection",
		name: "guardian-sso-connections-connection",
		component: () => import("./chunks/_connection_-CyLhQhLe.js")
	},
	{
		path: "/guardian/two-factor-policies",
		name: "guardian-two-factor-policies",
		component: () => import("./chunks/two-factor-policies-zLPcjPJ7.js")
	},
	{
		path: "/guardian/two-factor/challenge",
		name: "guardian-two-factor-challenge",
		component: () => import("./chunks/challenge-BK_JsXzK.js"),
		meta: { atrium: { public: !0 } }
	},
	{
		path: "/guardian/two-factor/setup",
		name: "guardian-two-factor-setup",
		component: () => import("./chunks/setup-R5zpxA5v.js"),
		meta: { atrium: { public: !0 } }
	},
	{
		path: "/guardian/users/:user",
		name: "guardian-users-user",
		component: () => import("./chunks/_user_-DWYedPo6.js")
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
}, Ot = S({
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
	responseHandlers: { [se]: fe(E()) },
	messages: { en: C(bt, xt, St, Ct, wt, Tt) }
});
export { Ot as default, Dt as screens };
