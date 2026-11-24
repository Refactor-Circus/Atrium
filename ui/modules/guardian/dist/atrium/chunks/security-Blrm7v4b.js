import { t as e } from "./GuardianState-DjXU16rU.js";
import { c as t, d as n, i as r, o as i, u as a } from "./guardian-Dugz84u2.js";
import { t as o } from "./GuardianActionError-DiiAaIHC.js";
import { t as s } from "./GuardianTwoFactorMethods-D4zoorEf.js";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, isRef as _, onBeforeUnmount as v, openBlock as y, reactive as b, ref as x, renderList as S, toDisplayString as C, unref as w, vModelCheckbox as T, withCtx as E, withDirectives as D, withModifiers as O } from "vue";
import { AtriumIntegrationScreen as k, useAtriumScreen as A, useHead as j } from "@refactor-circus/atrium";
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
}, X = { class: "mt-3 flex gap-2" }, Z = /* @__PURE__ */ g({
	__name: "SecurityActivity",
	setup(t) {
		let { t: a } = B(), o = x(null), s = x([]), { data: l, pending: g, failed: _, status: v } = n(async (e) => i(await e.GET("/me/security-events", { params: { query: {
			per_page: 50,
			...o.value ? { cursor: o.value } : {}
		} } })), o);
		function b() {
			let e = l.value?.meta?.next_cursor;
			e && (s.value = [...s.value, o.value], o.value = e);
		}
		function T() {
			o.value = s.value.at(-1) ?? null, s.value = s.value.slice(0, -1);
		}
		return (t, n) => {
			let i = P, o = F;
			return y(), u(o, { "data-testid": "guardian-security-activity" }, {
				header: E(() => [p("h2", W, C(w(a)("guardian.security.activity.title")), 1)]),
				default: E(() => [h(e, {
					ready: !w(g) && w(l) !== null,
					failed: w(_),
					status: w(v),
					compact: ""
				}, {
					default: E(() => [p("ul", G, [(y(!0), f(c, null, S(w(l)?.data ?? [], (e) => (y(), f("li", {
						key: e.id,
						class: "flex flex-wrap justify-between gap-2 py-2",
						"data-testid": `guardian-activity-${e.id}`
					}, [p("span", q, C(e.type), 1), p("span", J, C(e.ip ?? "—") + " · " + C(w(r)(e.occurred_at)), 1)], 8, K))), 128)), (w(l)?.data ?? []).length === 0 ? (y(), f("li", Y, C(w(a)("guardian.security.activity.none")), 1)) : d("", !0)]), p("div", X, [w(s).length > 0 ? (y(), u(i, {
						key: 0,
						size: "xs",
						color: "neutral",
						variant: "soft",
						"data-testid": "guardian-activity-newer",
						onClick: T
					}, {
						default: E(() => [m(C(w(a)("guardian.security.activity.newer")), 1)]),
						_: 1
					})) : d("", !0), w(l)?.meta?.next_cursor ? (y(), u(i, {
						key: 1,
						size: "xs",
						color: "neutral",
						variant: "soft",
						"data-testid": "guardian-activity-older",
						onClick: b
					}, {
						default: E(() => [m(C(w(a)("guardian.security.activity.older")), 1)]),
						_: 1
					})) : d("", !0)])]),
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
}, oe = /* @__PURE__ */ g({
	__name: "SecurityDevices",
	setup(t) {
		let { t: s } = B(), l = a(), { client: g, data: _, pending: v, failed: b, status: x, reload: T } = n(async (e) => i(await e.GET("/devices", { params: { query: { per_page: 50 } } })).data);
		async function D(e) {
			g && window.confirm(s("guardian.security.devices.confirm_forget")) && await l.run(async () => i(await g.DELETE("/devices/{device}", { params: { path: { device: e.id } } }))) && await T();
		}
		return (t, n) => {
			let i = P, a = F;
			return y(), u(a, { "data-testid": "guardian-security-devices" }, {
				header: E(() => [p("h2", Q, C(w(s)("guardian.security.devices.title")), 1)]),
				default: E(() => [h(e, {
					ready: !w(v) && w(_) !== null,
					failed: w(b),
					status: w(x),
					compact: ""
				}, {
					default: E(() => [h(o, { action: w(l) }, null, 8, ["action"]), p("ul", ne, [(y(!0), f(c, null, S(w(_) ?? [], (e) => (y(), f("li", {
						key: e.id,
						class: "flex flex-wrap items-center justify-between gap-2 py-2",
						"data-testid": `guardian-device-${e.id}`
					}, [p("span", null, [p("strong", null, C(e.name ?? w(s)("guardian.security.devices.unnamed")), 1), p("span", ie, " · " + C(e.last_ip ?? "—") + " · " + C(w(r)(e.last_seen_at)), 1)]), h(i, {
						size: "xs",
						color: "error",
						variant: "ghost",
						icon: "i-lucide-trash-2",
						"data-testid": `guardian-device-forget-${e.id}`,
						onClick: (t) => D(e)
					}, {
						default: E(() => [m(C(w(s)("guardian.security.devices.forget")), 1)]),
						_: 1
					}, 8, ["data-testid", "onClick"])], 8, re))), 128)), (w(_) ?? []).length === 0 ? (y(), f("li", ae, C(w(s)("guardian.security.devices.none")), 1)) : d("", !0)])]),
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
}), se = { class: "font-semibold" }, ce = { class: "space-y-3" }, le = { class: "divide-y divide-default text-sm" }, ue = ["data-testid"], $ = { class: "text-muted" }, de = { class: "flex flex-wrap items-center gap-3" }, fe = { class: "flex items-center gap-2 text-sm" }, pe = /* @__PURE__ */ g({
	__name: "SecuritySessions",
	setup(s) {
		let { t: l } = B(), g = a(), v = x(!1), b = x(null), { client: O, data: k, pending: A, failed: j, status: I, reload: L } = n(async (e) => i(await e.GET("/sessions", { params: { query: { per_page: 50 } } })).data);
		async function R(e) {
			O && window.confirm(l("guardian.security.sessions.confirm_revoke")) && await g.run(async () => i(await O.DELETE("/sessions/{session}", { params: { path: { session: e.id } } }))) && await L();
		}
		async function z() {
			if (!O || !window.confirm(l(v.value ? "guardian.security.sessions.confirm_others_tokens" : "guardian.security.sessions.confirm_others"))) return;
			b.value = null;
			let e = [];
			await g.run(async () => {
				e.push(i(await O.DELETE("/sessions/others", v.value ? { body: t({ tokens: !0 }) } : {})));
			}) && e[0] && (b.value = l("guardian.security.sessions.revoked", {
				count: e[0].revoked,
				tokens: e[0].tokens_revoked ?? 0
			}), await L());
		}
		return (t, n) => {
			let i = M, a = N, s = P, x = F;
			return y(), u(x, { "data-testid": "guardian-security-sessions" }, {
				header: E(() => [p("h2", se, C(w(l)("guardian.security.sessions.title")), 1)]),
				default: E(() => [h(e, {
					ready: !w(A) && w(k) !== null,
					failed: w(j),
					status: w(I),
					compact: ""
				}, {
					default: E(() => [p("div", ce, [
						w(b) ? (y(), u(i, {
							key: 0,
							color: "success",
							variant: "subtle",
							title: w(b),
							"data-testid": "guardian-sessions-notice"
						}, null, 8, ["title"])) : d("", !0),
						h(o, { action: w(g) }, null, 8, ["action"]),
						p("ul", le, [(y(!0), f(c, null, S(w(k) ?? [], (e) => (y(), f("li", {
							key: e.id,
							class: "flex flex-wrap items-center justify-between gap-2 py-2",
							"data-testid": `guardian-session-${e.id}`
						}, [p("span", null, [
							p("strong", null, C(e.device_name ?? e.user_agent ?? w(l)("guardian.security.sessions.unknown")), 1),
							p("span", $, " · " + C(e.ip ?? "—") + " · " + C(w(r)(e.last_active_at)), 1),
							e.current ? (y(), u(a, {
								key: 0,
								color: "primary",
								variant: "subtle",
								class: "ml-2",
								"data-testid": "guardian-session-current"
							}, {
								default: E(() => [m(C(w(l)("guardian.security.sessions.current")), 1)]),
								_: 1
							})) : d("", !0)
						]), e.current ? d("", !0) : (y(), u(s, {
							key: 0,
							size: "xs",
							color: "error",
							variant: "ghost",
							icon: "i-lucide-log-out",
							"data-testid": `guardian-session-revoke-${e.id}`,
							onClick: (t) => R(e)
						}, {
							default: E(() => [m(C(w(l)("guardian.security.sessions.revoke")), 1)]),
							_: 1
						}, 8, ["data-testid", "onClick"]))], 8, ue))), 128))]),
						p("div", de, [p("label", fe, [D(p("input", {
							"onUpdate:modelValue": n[0] ||= (e) => _(v) ? v.value = e : null,
							type: "checkbox",
							class: "accent-(--ui-primary)",
							"data-testid": "guardian-sessions-also-tokens"
						}, null, 512), [[T, w(v)]]), m(" " + C(w(l)("guardian.security.sessions.also_tokens")), 1)]), h(s, {
							color: "error",
							variant: "soft",
							icon: "i-lucide-log-out",
							loading: w(g).busy.value,
							"data-testid": "guardian-sessions-others",
							onClick: z
						}, {
							default: E(() => [m(C(w(l)("guardian.security.sessions.others")), 1)]),
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
}), me = { class: "font-semibold" }, he = { class: "space-y-4" }, ge = {
	class: "break-all font-mono",
	"data-testid": "guardian-token-plain-value"
}, _e = { class: "divide-y divide-default text-sm" }, ve = ["data-testid"], ye = { class: "text-muted" }, be = {
	key: 0,
	class: "py-2 text-muted"
}, xe = { class: "flex flex-wrap gap-3" }, Se = [
	"value",
	"checked",
	"data-testid",
	"onChange"
], Ce = /* @__PURE__ */ g({
	__name: "SecurityTokens",
	props: {
		abilities: {},
		maxDays: {}
	},
	setup(s) {
		let g = s, { t: _ } = B(), T = a(), D = a(), k = b({
			name: "",
			abilities: [...g.abilities],
			expires: ""
		}), A = x(null), j = x(!1), N = x(null), I = l(() => ee(g.maxDays)), { client: L, data: V, pending: H, failed: U, status: W, reload: G } = n(async (e) => i(await e.GET("/tokens")).data), K = l(() => U.value && W.value === 501);
		function q(e, t) {
			k.abilities = t ? [.../* @__PURE__ */ new Set([...k.abilities, e])] : k.abilities.filter((t) => t !== e);
		}
		async function J() {
			if (N.value = null, !L) return;
			if (k.expires && I.value && k.expires > I.value) {
				N.value = _("guardian.security.tokens.expiry_too_late", { days: g.maxDays ?? 0 });
				return;
			}
			let e = null;
			await T.run(async () => {
				e = i(await L.POST("/tokens", { body: t({
					name: k.name.trim(),
					abilities: k.abilities,
					expires_at: k.expires ? te(k.expires) : null
				}) })).plain_text_token;
			}) && (A.value = e, j.value = !1, k.name = "", k.expires = "", await G());
		}
		async function Y() {
			A.value && (await navigator.clipboard?.writeText(A.value), j.value = !0);
		}
		async function X(e) {
			L && window.confirm(_("guardian.security.tokens.confirm_revoke", { name: e.name })) && await D.run(async () => i(await L.DELETE("/tokens/{token}", { params: { path: { token: e.id } } }))) && await G();
		}
		function Z() {
			A.value = null;
		}
		return v(Z), (t, n) => {
			let i = M, a = P, l = z, g = R, v = F;
			return y(), u(v, { "data-testid": "guardian-security-tokens" }, {
				header: E(() => [p("h2", me, C(w(_)("guardian.security.tokens.title")), 1)]),
				default: E(() => [w(K) ? (y(), u(i, {
					key: 0,
					color: "neutral",
					variant: "subtle",
					icon: "i-lucide-key-round",
					title: w(_)("guardian.security.tokens.not_enabled"),
					"data-testid": "guardian-tokens-disabled"
				}, null, 8, ["title"])) : (y(), u(e, {
					key: 1,
					ready: !w(H) && w(V) !== null,
					failed: w(U),
					status: w(W),
					compact: ""
				}, {
					default: E(() => [p("div", he, [
						w(A) ? (y(), u(i, {
							key: 0,
							color: "success",
							variant: "subtle",
							title: w(_)("guardian.security.tokens.plain_once"),
							"data-testid": "guardian-token-plain"
						}, {
							description: E(() => [p("code", ge, C(w(A)), 1)]),
							actions: E(() => [h(a, {
								size: "xs",
								icon: "i-lucide-copy",
								color: "neutral",
								variant: "soft",
								"data-testid": "guardian-token-copy",
								onClick: Y
							}, {
								default: E(() => [m(C(w(j) ? w(_)("guardian.security.tokens.copied") : w(_)("guardian.security.tokens.copy")), 1)]),
								_: 1
							}), h(a, {
								size: "xs",
								color: "neutral",
								variant: "ghost",
								"data-testid": "guardian-token-hide",
								onClick: Z
							}, {
								default: E(() => [m(C(w(_)("guardian.security.tokens.done")), 1)]),
								_: 1
							})]),
							_: 1
						}, 8, ["title"])) : d("", !0),
						h(o, { action: w(D) }, null, 8, ["action"]),
						p("ul", _e, [(y(!0), f(c, null, S(w(V) ?? [], (e) => (y(), f("li", {
							key: e.id,
							class: "flex flex-wrap items-center justify-between gap-2 py-2",
							"data-testid": `guardian-token-${e.id}`
						}, [p("span", null, [p("strong", null, C(e.name), 1), p("span", ye, " · " + C(e.abilities.join(", ")) + " · " + C(e.expires_at ? w(_)("guardian.security.tokens.expires", { date: w(r)(e.expires_at) }) : w(_)("guardian.security.tokens.no_expiry")), 1)]), h(a, {
							size: "xs",
							color: "error",
							variant: "ghost",
							icon: "i-lucide-trash-2",
							"data-testid": `guardian-token-revoke-${e.id}`,
							onClick: (t) => X(e)
						}, {
							default: E(() => [m(C(w(_)("guardian.security.tokens.revoke")), 1)]),
							_: 1
						}, 8, ["data-testid", "onClick"])], 8, ve))), 128)), (w(V) ?? []).length === 0 ? (y(), f("li", be, C(w(_)("guardian.security.tokens.none")), 1)) : d("", !0)]),
						h(o, { action: w(T) }, null, 8, ["action"]),
						p("form", {
							class: "space-y-3",
							"data-testid": "guardian-token-form",
							onSubmit: O(J, ["prevent"])
						}, [
							h(g, {
								label: w(_)("guardian.security.tokens.name"),
								error: w(T).error("name"),
								required: ""
							}, {
								default: E(() => [h(l, {
									modelValue: w(k).name,
									"onUpdate:modelValue": n[0] ||= (e) => w(k).name = e,
									"data-testid": "guardian-token-name"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label", "error"]),
							h(g, {
								label: w(_)("guardian.security.tokens.abilities"),
								error: w(T).error("abilities")
							}, {
								default: E(() => [p("div", xe, [(y(!0), f(c, null, S(s.abilities, (e) => (y(), f("label", {
									key: e,
									class: "flex items-center gap-2 text-sm"
								}, [p("input", {
									type: "checkbox",
									class: "accent-(--ui-primary)",
									value: e,
									checked: w(k).abilities.includes(e),
									"data-testid": `guardian-token-ability-${e}`,
									onChange: (t) => q(e, t.target.checked)
								}, null, 40, Se), m(" " + C(e === "*" ? w(_)("guardian.security.tokens.every_ability") : e), 1)]))), 128))])]),
								_: 1
							}, 8, ["label", "error"]),
							h(g, {
								label: w(_)("guardian.security.tokens.expires_at"),
								hint: w(I) ? w(_)("guardian.security.tokens.expiry_hint", { date: w(I) }) : void 0,
								error: w(N) ?? w(T).error("expires_at")
							}, {
								default: E(() => [h(l, {
									modelValue: w(k).expires,
									"onUpdate:modelValue": n[1] ||= (e) => w(k).expires = e,
									type: "date",
									max: w(I) ?? void 0,
									"data-testid": "guardian-token-expires"
								}, null, 8, ["modelValue", "max"])]),
								_: 1
							}, 8, [
								"label",
								"hint",
								"error"
							]),
							h(a, {
								type: "submit",
								icon: "i-lucide-plus",
								loading: w(T).busy.value,
								"data-testid": "guardian-token-submit"
							}, {
								default: E(() => [m(C(w(_)("guardian.security.tokens.issue")), 1)]),
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
}), we = { class: "font-semibold" }, Te = {
	key: 0,
	class: "space-y-4"
}, Ee = { class: "flex flex-wrap items-center gap-2 text-sm" }, De = { key: 0 }, Oe = {
	key: 1,
	"data-testid": "guardian-security-two-factor-deadline"
}, ke = /* @__PURE__ */ g({
	__name: "SecurityTwoFactor",
	setup(t) {
		let { t: a } = B(), { client: o, data: c, pending: l, failed: g, status: _, reload: v } = n(async (e) => i(await e.GET("/two-factor")).data);
		return (t, n) => {
			let i = N, b = F;
			return y(), u(b, { "data-testid": "guardian-security-two-factor" }, {
				header: E(() => [p("h2", we, C(w(a)("guardian.security.two_factor.title")), 1)]),
				default: E(() => [h(e, {
					ready: !w(l) && w(c) !== null,
					failed: w(g),
					status: w(_),
					compact: ""
				}, {
					default: E(() => [w(c) && w(o) ? (y(), f("div", Te, [p("div", Ee, [
						h(i, {
							color: w(c).enabled ? "success" : "neutral",
							variant: "subtle",
							"data-testid": "guardian-security-two-factor-state"
						}, {
							default: E(() => [m(C(w(c).enabled ? w(a)("guardian.security.two_factor.on") : w(a)("guardian.security.two_factor.off")), 1)]),
							_: 1
						}, 8, ["color"]),
						w(c).required ? (y(), f("span", De, C(w(a)("guardian.security.two_factor.required")), 1)) : d("", !0),
						w(c).enrolment_deadline ? (y(), f("span", Oe, C(w(a)("guardian.security.two_factor.deadline", { deadline: w(r)(w(c).enrolment_deadline) ?? w(c).enrolment_deadline })), 1)) : d("", !0)
					]), h(s, {
						client: w(o),
						status: w(c),
						onChanged: w(v)
					}, null, 8, [
						"client",
						"status",
						"onChanged"
					])])) : d("", !0)]),
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
}), Ae = { class: "grid gap-4 lg:grid-cols-2" }, je = { class: "lg:col-span-2" }, Me = { class: "lg:col-span-2" }, Ne = { class: "lg:col-span-2" }, Pe = /* @__PURE__ */ g({
	__name: "index",
	setup(e) {
		let { t } = B();
		j({ title: () => t("guardian.security.title") });
		let { data: n } = A("guardian.security"), r = l(() => H(n.value?.data.options));
		return (e, n) => {
			let i = I, a = k, o = L;
			return y(), u(o, null, {
				header: E(() => [h(i, { title: w(t)("guardian.security.title") }, null, 8, ["title"])]),
				body: E(() => [h(a, { "screen-key": "guardian.security" }, {
					default: E(() => [p("div", Ae, [
						p("div", je, [h(ke)]),
						h(pe),
						h(oe),
						p("div", Me, [(y(), u(Ce, {
							key: w(r).tokenAbilities.join("|"),
							abilities: w(r).tokenAbilities,
							"max-days": w(r).tokenMaxLifetimeDays
						}, null, 8, ["abilities", "max-days"]))]),
						p("div", Ne, [h(Z)])
					])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { Pe as default };
