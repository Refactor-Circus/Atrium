import { t as e } from "./GuardianState-DytBr9ih.js";
import { c as t, d as n, i as r, o as i, u as a } from "./guardian-D9MeowUD.js";
import { t as o } from "./GuardianActionError-DKEMy_E4.js";
import { t as s } from "./GuardianTwoFactorMethods-D8eBBpuX.js";
import { AtriumIntegrationScreen as c, useAtriumScreen as l, useHead as u } from "@refactor-circus/atrium";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as y, isRef as b, onBeforeUnmount as x, openBlock as S, reactive as C, ref as w, renderList as T, toDisplayString as E, unref as D, vModelCheckbox as O, withCtx as k, withDirectives as A, withModifiers as j } from "vue";
import { UAlert as M, UBadge as N, UButton as P, UCard as F, UDashboardNavbar as I, UDashboardPanel as L, UFormField as R, UInput as z } from "@refactor-circus/atrium/ui";
import { useI18n as B } from "vue-i18n";
// src/components/security/security.ts
var V = {
	tokenAbilities: ["*"],
	tokenMaxLifetimeDays: 365
};
function H(e) {
	let t = Array.isArray(e?.token_abilities) ? e.token_abilities.filter((e) => typeof e == "string" && e !== "") : [], n = e?.token_max_lifetime_days;
	return {
		tokenAbilities: t.length > 0 ? t : V.tokenAbilities,
		tokenMaxLifetimeDays: n === null ? null : typeof n == "number" && n > 0 ? n : V.tokenMaxLifetimeDays
	};
}
function U(e) {
	let t = (e) => String(e).padStart(2, "0");
	return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}`;
}
function ee(e, t = /* @__PURE__ */ new Date()) {
	if (e === null) return null;
	let n = new Date(t);
	return n.setDate(n.getDate() + e), U(n);
}
function te(e) {
	return (/* @__PURE__ */ new Date(`${e}T23:59:59`)).toISOString();
}
// src/components/security/SecurityActivity.vue?vue&type=script&setup=true&lang.ts
var W = { class: "font-semibold" }, G = { class: "divide-y divide-default text-sm" }, K = ["data-testid"], q = { class: "font-mono" }, J = { class: "text-muted" }, Y = {
	key: 0,
	class: "py-2 text-muted"
}, X = { class: "mt-3 flex gap-2" }, Z = /* @__PURE__ */ y({
	__name: "SecurityActivity",
	setup(t) {
		let { t: a } = B(), o = w(null), s = w([]), { data: c, pending: l, failed: u, status: f } = n(async (e) => i(await e.GET("/me/security-events", { params: { query: {
			per_page: 50,
			...o.value ? { cursor: o.value } : {}
		} } })), o);
		function y() {
			let e = c.value?.meta?.next_cursor;
			e && (s.value = [...s.value, o.value], o.value = e);
		}
		function b() {
			o.value = s.value.at(-1) ?? null, s.value = s.value.slice(0, -1);
		}
		return (t, n) => {
			let i = P, o = F;
			return S(), p(o, { "data-testid": "guardian-security-activity" }, {
				header: k(() => [g("h2", W, E(D(a)("guardian.security.activity.title")), 1)]),
				default: k(() => [v(e, {
					ready: !D(l) && D(c) !== null,
					failed: D(u),
					status: D(f),
					compact: ""
				}, {
					default: k(() => [g("ul", G, [(S(!0), h(d, null, T(D(c)?.data ?? [], (e) => (S(), h("li", {
						key: e.id,
						class: "flex flex-wrap justify-between gap-2 py-2",
						"data-testid": `guardian-activity-${e.id}`
					}, [g("span", q, E(e.type), 1), g("span", J, E(e.ip ?? "—") + " · " + E(D(r)(e.occurred_at)), 1)], 8, K))), 128)), (D(c)?.data ?? []).length === 0 ? (S(), h("li", Y, E(D(a)("guardian.security.activity.none")), 1)) : m("", !0)]), g("div", X, [D(s).length > 0 ? (S(), p(i, {
						key: 0,
						size: "xs",
						color: "neutral",
						variant: "soft",
						"data-testid": "guardian-activity-newer",
						onClick: b
					}, {
						default: k(() => [_(E(D(a)("guardian.security.activity.newer")), 1)]),
						_: 1
					})) : m("", !0), D(c)?.meta?.next_cursor ? (S(), p(i, {
						key: 1,
						size: "xs",
						color: "neutral",
						variant: "soft",
						"data-testid": "guardian-activity-older",
						onClick: y
					}, {
						default: k(() => [_(E(D(a)("guardian.security.activity.older")), 1)]),
						_: 1
					})) : m("", !0)])]),
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
}), Q = { class: "font-semibold" }, ne = { class: "divide-y divide-default text-sm" }, re = ["data-testid"], ie = { class: "text-muted" }, ae = {
	key: 0,
	class: "py-2 text-muted"
}, oe = /* @__PURE__ */ y({
	__name: "SecurityDevices",
	setup(t) {
		let { t: s } = B(), c = a(), { client: l, data: u, pending: f, failed: y, status: b, reload: x } = n(async (e) => i(await e.GET("/devices", { params: { query: { per_page: 50 } } })).data);
		async function C(e) {
			l && window.confirm(s("guardian.security.devices.confirm_forget")) && await c.run(async () => i(await l.DELETE("/devices/{device}", { params: { path: { device: e.id } } }))) && await x();
		}
		return (t, n) => {
			let i = P, a = F;
			return S(), p(a, { "data-testid": "guardian-security-devices" }, {
				header: k(() => [g("h2", Q, E(D(s)("guardian.security.devices.title")), 1)]),
				default: k(() => [v(e, {
					ready: !D(f) && D(u) !== null,
					failed: D(y),
					status: D(b),
					compact: ""
				}, {
					default: k(() => [v(o, { action: D(c) }, null, 8, ["action"]), g("ul", ne, [(S(!0), h(d, null, T(D(u) ?? [], (e) => (S(), h("li", {
						key: e.id,
						class: "flex flex-wrap items-center justify-between gap-2 py-2",
						"data-testid": `guardian-device-${e.id}`
					}, [g("span", null, [g("strong", null, E(e.name ?? D(s)("guardian.security.devices.unnamed")), 1), g("span", ie, " · " + E(e.last_ip ?? "—") + " · " + E(D(r)(e.last_seen_at)), 1)]), v(i, {
						size: "xs",
						color: "error",
						variant: "ghost",
						icon: "i-lucide-trash-2",
						"data-testid": `guardian-device-forget-${e.id}`,
						onClick: (t) => C(e)
					}, {
						default: k(() => [_(E(D(s)("guardian.security.devices.forget")), 1)]),
						_: 1
					}, 8, ["data-testid", "onClick"])], 8, re))), 128)), (D(u) ?? []).length === 0 ? (S(), h("li", ae, E(D(s)("guardian.security.devices.none")), 1)) : m("", !0)])]),
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
}), se = { class: "font-semibold" }, ce = { class: "space-y-3" }, le = { class: "divide-y divide-default text-sm" }, ue = ["data-testid"], de = { class: "text-muted" }, fe = { class: "flex flex-wrap items-center gap-3" }, pe = { class: "flex items-center gap-2 text-sm" }, me = /* @__PURE__ */ y({
	__name: "SecuritySessions",
	setup(s) {
		let { t: c } = B(), l = a(), u = w(!1), f = w(null), { client: y, data: x, pending: C, failed: j, status: I, reload: L } = n(async (e) => i(await e.GET("/sessions", { params: { query: { per_page: 50 } } })).data);
		async function R(e) {
			y && window.confirm(c("guardian.security.sessions.confirm_revoke")) && await l.run(async () => i(await y.DELETE("/sessions/{session}", { params: { path: { session: e.id } } }))) && await L();
		}
		async function z() {
			if (!y || !window.confirm(c(u.value ? "guardian.security.sessions.confirm_others_tokens" : "guardian.security.sessions.confirm_others"))) return;
			f.value = null;
			let e = [];
			await l.run(async () => {
				e.push(i(await y.DELETE("/sessions/others", u.value ? { body: t({ tokens: !0 }) } : {})));
			}) && e[0] && (f.value = c("guardian.security.sessions.revoked", {
				count: e[0].revoked,
				tokens: e[0].tokens_revoked ?? 0
			}), await L());
		}
		return (t, n) => {
			let i = M, a = N, s = P, y = F;
			return S(), p(y, { "data-testid": "guardian-security-sessions" }, {
				header: k(() => [g("h2", se, E(D(c)("guardian.security.sessions.title")), 1)]),
				default: k(() => [v(e, {
					ready: !D(C) && D(x) !== null,
					failed: D(j),
					status: D(I),
					compact: ""
				}, {
					default: k(() => [g("div", ce, [
						D(f) ? (S(), p(i, {
							key: 0,
							color: "success",
							variant: "subtle",
							title: D(f),
							"data-testid": "guardian-sessions-notice"
						}, null, 8, ["title"])) : m("", !0),
						v(o, { action: D(l) }, null, 8, ["action"]),
						g("ul", le, [(S(!0), h(d, null, T(D(x) ?? [], (e) => (S(), h("li", {
							key: e.id,
							class: "flex flex-wrap items-center justify-between gap-2 py-2",
							"data-testid": `guardian-session-${e.id}`
						}, [g("span", null, [
							g("strong", null, E(e.device_name ?? e.user_agent ?? D(c)("guardian.security.sessions.unknown")), 1),
							g("span", de, " · " + E(e.ip ?? "—") + " · " + E(D(r)(e.last_active_at)), 1),
							e.current ? (S(), p(a, {
								key: 0,
								color: "primary",
								variant: "subtle",
								class: "ml-2",
								"data-testid": "guardian-session-current"
							}, {
								default: k(() => [_(E(D(c)("guardian.security.sessions.current")), 1)]),
								_: 1
							})) : m("", !0)
						]), e.current ? m("", !0) : (S(), p(s, {
							key: 0,
							size: "xs",
							color: "error",
							variant: "ghost",
							icon: "i-lucide-log-out",
							"data-testid": `guardian-session-revoke-${e.id}`,
							onClick: (t) => R(e)
						}, {
							default: k(() => [_(E(D(c)("guardian.security.sessions.revoke")), 1)]),
							_: 1
						}, 8, ["data-testid", "onClick"]))], 8, ue))), 128))]),
						g("div", fe, [g("label", pe, [A(g("input", {
							"onUpdate:modelValue": n[0] ||= (e) => b(u) ? u.value = e : null,
							type: "checkbox",
							class: "accent-(--ui-primary)",
							"data-testid": "guardian-sessions-also-tokens"
						}, null, 512), [[O, D(u)]]), _(" " + E(D(c)("guardian.security.sessions.also_tokens")), 1)]), v(s, {
							color: "error",
							variant: "soft",
							icon: "i-lucide-log-out",
							loading: D(l).busy.value,
							"data-testid": "guardian-sessions-others",
							onClick: z
						}, {
							default: k(() => [_(E(D(c)("guardian.security.sessions.others")), 1)]),
							_: 1
						}, 8, ["loading"])])
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
}), he = { class: "font-semibold" }, ge = { class: "space-y-4" }, _e = {
	class: "break-all font-mono",
	"data-testid": "guardian-token-plain-value"
}, ve = { class: "divide-y divide-default text-sm" }, ye = ["data-testid"], be = { class: "text-muted" }, xe = {
	key: 0,
	class: "py-2 text-muted"
}, Se = { class: "flex flex-wrap gap-3" }, Ce = [
	"value",
	"checked",
	"data-testid",
	"onChange"
], we = /* @__PURE__ */ y({
	__name: "SecurityTokens",
	props: {
		abilities: {},
		maxDays: {}
	},
	setup(s) {
		let c = s, { t: l } = B(), u = a(), y = a(), b = C({
			name: "",
			abilities: [...c.abilities],
			expires: ""
		}), O = w(null), A = w(!1), N = w(null), I = f(() => ee(c.maxDays)), { client: L, data: V, pending: H, failed: U, status: W, reload: G } = n(async (e) => i(await e.GET("/tokens")).data), K = f(() => U.value && W.value === 501);
		function q(e, t) {
			b.abilities = t ? [.../* @__PURE__ */ new Set([...b.abilities, e])] : b.abilities.filter((t) => t !== e);
		}
		async function J() {
			if (N.value = null, !L) return;
			if (b.expires && I.value && b.expires > I.value) {
				N.value = l("guardian.security.tokens.expiry_too_late", { days: c.maxDays ?? 0 });
				return;
			}
			let e = null;
			await u.run(async () => {
				e = i(await L.POST("/tokens", { body: t({
					name: b.name.trim(),
					abilities: b.abilities,
					expires_at: b.expires ? te(b.expires) : null
				}) })).plain_text_token;
			}) && (O.value = e, A.value = !1, b.name = "", b.expires = "", await G());
		}
		async function Y() {
			O.value && (await navigator.clipboard?.writeText(O.value), A.value = !0);
		}
		async function X(e) {
			L && window.confirm(l("guardian.security.tokens.confirm_revoke", { name: e.name })) && await y.run(async () => i(await L.DELETE("/tokens/{token}", { params: { path: { token: e.id } } }))) && await G();
		}
		function Z() {
			O.value = null;
		}
		return x(Z), (t, n) => {
			let i = M, a = P, c = z, f = R, x = F;
			return S(), p(x, { "data-testid": "guardian-security-tokens" }, {
				header: k(() => [g("h2", he, E(D(l)("guardian.security.tokens.title")), 1)]),
				default: k(() => [D(K) ? (S(), p(i, {
					key: 0,
					color: "neutral",
					variant: "subtle",
					icon: "i-lucide-key-round",
					title: D(l)("guardian.security.tokens.not_enabled"),
					"data-testid": "guardian-tokens-disabled"
				}, null, 8, ["title"])) : (S(), p(e, {
					key: 1,
					ready: !D(H) && D(V) !== null,
					failed: D(U),
					status: D(W),
					compact: ""
				}, {
					default: k(() => [g("div", ge, [
						D(O) ? (S(), p(i, {
							key: 0,
							color: "success",
							variant: "subtle",
							title: D(l)("guardian.security.tokens.plain_once"),
							"data-testid": "guardian-token-plain"
						}, {
							description: k(() => [g("code", _e, E(D(O)), 1)]),
							actions: k(() => [v(a, {
								size: "xs",
								icon: "i-lucide-copy",
								color: "neutral",
								variant: "soft",
								"data-testid": "guardian-token-copy",
								onClick: Y
							}, {
								default: k(() => [_(E(D(A) ? D(l)("guardian.security.tokens.copied") : D(l)("guardian.security.tokens.copy")), 1)]),
								_: 1
							}), v(a, {
								size: "xs",
								color: "neutral",
								variant: "ghost",
								"data-testid": "guardian-token-hide",
								onClick: Z
							}, {
								default: k(() => [_(E(D(l)("guardian.security.tokens.done")), 1)]),
								_: 1
							})]),
							_: 1
						}, 8, ["title"])) : m("", !0),
						v(o, { action: D(y) }, null, 8, ["action"]),
						g("ul", ve, [(S(!0), h(d, null, T(D(V) ?? [], (e) => (S(), h("li", {
							key: e.id,
							class: "flex flex-wrap items-center justify-between gap-2 py-2",
							"data-testid": `guardian-token-${e.id}`
						}, [g("span", null, [g("strong", null, E(e.name), 1), g("span", be, " · " + E(e.abilities.join(", ")) + " · " + E(e.expires_at ? D(l)("guardian.security.tokens.expires", { date: D(r)(e.expires_at) }) : D(l)("guardian.security.tokens.no_expiry")), 1)]), v(a, {
							size: "xs",
							color: "error",
							variant: "ghost",
							icon: "i-lucide-trash-2",
							"data-testid": `guardian-token-revoke-${e.id}`,
							onClick: (t) => X(e)
						}, {
							default: k(() => [_(E(D(l)("guardian.security.tokens.revoke")), 1)]),
							_: 1
						}, 8, ["data-testid", "onClick"])], 8, ye))), 128)), (D(V) ?? []).length === 0 ? (S(), h("li", xe, E(D(l)("guardian.security.tokens.none")), 1)) : m("", !0)]),
						v(o, { action: D(u) }, null, 8, ["action"]),
						g("form", {
							class: "space-y-3",
							"data-testid": "guardian-token-form",
							onSubmit: j(J, ["prevent"])
						}, [
							v(f, {
								label: D(l)("guardian.security.tokens.name"),
								error: D(u).error("name"),
								required: ""
							}, {
								default: k(() => [v(c, {
									modelValue: D(b).name,
									"onUpdate:modelValue": n[0] ||= (e) => D(b).name = e,
									"data-testid": "guardian-token-name"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]),
							v(f, {
								label: D(l)("guardian.security.tokens.abilities"),
								error: D(u).error("abilities")
							}, {
								default: k(() => [g("div", Se, [(S(!0), h(d, null, T(s.abilities, (e) => (S(), h("label", {
									key: e,
									class: "flex items-center gap-2 text-sm"
								}, [g("input", {
									type: "checkbox",
									class: "accent-(--ui-primary)",
									value: e,
									checked: D(b).abilities.includes(e),
									"data-testid": `guardian-token-ability-${e}`,
									onChange: (t) => q(e, t.target.checked)
								}, null, 40, Ce), _(" " + E(e === "*" ? D(l)("guardian.security.tokens.every_ability") : e), 1)]))), 128))])]),
								_: 1
							}, 8, ["label", "error"]),
							v(f, {
								label: D(l)("guardian.security.tokens.expires_at"),
								hint: D(I) ? D(l)("guardian.security.tokens.expiry_hint", { date: D(I) }) : void 0,
								error: D(N) ?? D(u).error("expires_at")
							}, {
								default: k(() => [v(c, {
									modelValue: D(b).expires,
									"onUpdate:modelValue": n[1] ||= (e) => D(b).expires = e,
									type: "date",
									max: D(I) ?? void 0,
									"data-testid": "guardian-token-expires"
								}, null, 8, ["modelValue", "max"])]),
								_: 1
							}, 8, [
								"label",
								"hint",
								"error"
							]),
							v(a, {
								type: "submit",
								icon: "i-lucide-plus",
								loading: D(u).busy.value,
								"data-testid": "guardian-token-submit"
							}, {
								default: k(() => [_(E(D(l)("guardian.security.tokens.issue")), 1)]),
								_: 1
							}, 8, ["loading"])
						], 32)
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				]))]),
				_: 1
			});
		};
	}
}), $ = { class: "font-semibold" }, Te = {
	key: 0,
	class: "space-y-4"
}, Ee = { class: "flex flex-wrap items-center gap-2 text-sm" }, De = { key: 0 }, Oe = {
	key: 1,
	"data-testid": "guardian-security-two-factor-deadline"
}, ke = /* @__PURE__ */ y({
	__name: "SecurityTwoFactor",
	setup(t) {
		let { t: a } = B(), { client: o, data: c, pending: l, failed: u, status: d, reload: f } = n(async (e) => i(await e.GET("/two-factor")).data);
		return (t, n) => {
			let i = N, y = F;
			return S(), p(y, { "data-testid": "guardian-security-two-factor" }, {
				header: k(() => [g("h2", $, E(D(a)("guardian.security.two_factor.title")), 1)]),
				default: k(() => [v(e, {
					ready: !D(l) && D(c) !== null,
					failed: D(u),
					status: D(d),
					compact: ""
				}, {
					default: k(() => [D(c) && D(o) ? (S(), h("div", Te, [g("div", Ee, [
						v(i, {
							color: D(c).enabled ? "success" : "neutral",
							variant: "subtle",
							"data-testid": "guardian-security-two-factor-state"
						}, {
							default: k(() => [_(E(D(c).enabled ? D(a)("guardian.security.two_factor.on") : D(a)("guardian.security.two_factor.off")), 1)]),
							_: 1
						}, 8, ["color"]),
						D(c).required ? (S(), h("span", De, E(D(a)("guardian.security.two_factor.required")), 1)) : m("", !0),
						D(c).enrolment_deadline ? (S(), h("span", Oe, E(D(a)("guardian.security.two_factor.deadline", { deadline: D(r)(D(c).enrolment_deadline) ?? D(c).enrolment_deadline })), 1)) : m("", !0)
					]), v(s, {
						client: D(o),
						status: D(c),
						onChanged: D(f)
					}, null, 8, [
						"client",
						"status",
						"onChanged"
					])])) : m("", !0)]),
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
}), Ae = { class: "grid gap-4 lg:grid-cols-2" }, je = { class: "lg:col-span-2" }, Me = {
	key: 0,
	class: "lg:col-span-2"
}, Ne = { class: "lg:col-span-2" }, Pe = /* @__PURE__ */ y({
	__name: "index",
	setup(e) {
		let { t } = B();
		u({ title: () => t("guardian.security.title") });
		let { data: n, status: r } = l("guardian.security"), i = f(() => r.value === "success" || r.value === "error"), a = f(() => H(n.value?.data.options));
		return (e, n) => {
			let r = I, o = c, s = L;
			return S(), p(s, null, {
				header: k(() => [v(r, { title: D(t)("guardian.security.title") }, null, 8, ["title"])]),
				body: k(() => [v(o, { "screen-key": "guardian.security" }, {
					default: k(() => [g("div", Ae, [
						g("div", je, [v(ke)]),
						v(me),
						v(oe),
						D(i) ? (S(), h("div", Me, [(S(), p(we, {
							key: D(a).tokenAbilities.join("|"),
							abilities: D(a).tokenAbilities,
							"max-days": D(a).tokenMaxLifetimeDays
						}, null, 8, ["abilities", "max-days"]))])) : m("", !0),
						g("div", Ne, [v(Z)])
					])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { Pe as default };
