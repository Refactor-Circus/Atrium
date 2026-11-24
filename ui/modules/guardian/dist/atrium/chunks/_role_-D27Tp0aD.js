import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianRolePermissions-BeWmdjw_.js";
import { c as ee, n, o as r, s as i, t as a } from "./access-CMUXpA7X.js";
import { t as o } from "./GuardianState-DytBr9ih.js";
import { d as s, o as c, u as l } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as u, useAtriumScreen as d, useHead as f } from "@refactor-circus/atrium";
import { computed as p, createBlock as m, createCommentVNode as h, createElementBlock as g, createElementVNode as _, createTextVNode as v, createVNode as y, defineComponent as b, openBlock as x, reactive as S, ref as C, toDisplayString as w, unref as T, watch as E, withCtx as D, withModifiers as te } from "vue";
import { UAlert as ne, UBadge as re, UButton as O, UCard as k, UDashboardNavbar as A, UDashboardPanel as j, UFormField as M, UInput as N, UTextarea as P } from "@refactor-circus/atrium/ui";
import { useI18n as F } from "vue-i18n";
import { useRoute as I, useRouter as L } from "vue-router";
// src/pages/roles/[role].vue?vue&type=script&setup=true&lang.ts
var R = {
	key: 0,
	class: "space-y-4",
	"data-testid": "guardian-role"
}, z = { class: "flex flex-wrap items-center gap-2 text-sm" }, B = { "data-testid": "guardian-role-slug" }, V = {
	key: 1,
	class: "text-sm text-muted"
}, H = /* @__PURE__ */ b({
	__name: "[role]",
	setup(b) {
		let { t: H } = F(), ie = I(), U = L(), W = l(), G = l(), K = p(() => String(ie.params.role)), { data: q } = d("guardian.role", K), J = p(() => i(q.value?.data.options)), { client: Y, data: X, pending: ae, failed: oe, status: se, reload: ce } = s(async (e) => c(await e.GET("/roles/{role}", { params: { path: { role: K.value } } })).data, K), Z = ee(Y), Q = S({
			name: "",
			description: "",
			permissions: []
		}), $ = C(!1);
		f({ title: () => X.value?.name ?? H("guardian.access.roles.role") }), E(X, (e) => {
			Q.name = e?.name ?? "", Q.description = e?.description ?? "", Q.permissions = [...e?.permissions ?? []];
		}, { immediate: !0 });
		function le(e) {
			return a.includes(e) ? H(`guardian.access.scopes.${e}`) : r(e, J.value) ?? e;
		}
		async function ue() {
			if (!Y || !X.value) return;
			let e = X.value;
			$.value = !1, $.value = await W.run(async () => {
				c(await Y.PATCH("/roles/{role}", {
					params: { path: { role: e.slug } },
					body: {
						name: Q.name.trim(),
						description: n(Q.description),
						...e.super ? {} : { permissions: Q.permissions }
					}
				}));
			}), $.value && await ce();
		}
		async function de() {
			if (!Y || !X.value || !window.confirm(H("guardian.access.roles.confirm_delete", { name: X.value.name }))) return;
			let e = X.value;
			await G.run(async () => c(await Y.DELETE("/roles/{role}", { params: { path: { role: e.slug } } }))) && await U.push("/guardian/roles");
		}
		return (ee, n) => {
			let r = O, i = A, a = re, s = ne, c = N, l = M, d = P, f = k, p = u, b = j;
			return x(), m(b, null, {
				header: D(() => [y(i, { title: T(X)?.name ?? T(H)("guardian.access.roles.role") }, {
					leading: D(() => [y(r, {
						to: "/guardian/roles",
						variant: "ghost",
						color: "neutral",
						icon: "i-lucide-arrow-left",
						"aria-label": T(H)("guardian.access.roles.title")
					}, null, 8, ["aria-label"])]),
					_: 1
				}, 8, ["title"])]),
				body: D(() => [y(p, {
					"screen-key": "guardian.role",
					record: T(K)
				}, {
					default: D(() => [y(o, {
						ready: !T(ae) && T(X) !== null,
						failed: T(oe),
						status: T(se),
						"not-found": T(H)("guardian.access.roles.not_found")
					}, {
						default: D(() => [T(X) ? (x(), g("div", R, [
							_("div", z, [
								_("code", B, w(T(X).slug), 1),
								y(a, {
									color: "neutral",
									variant: "subtle",
									"data-testid": "guardian-role-scope"
								}, {
									default: D(() => [v(w(le(T(X).scope)), 1)]),
									_: 1
								}),
								T(X).super ? (x(), m(a, {
									key: 0,
									color: "error",
									variant: "subtle"
								}, {
									default: D(() => [v(w(T(H)("guardian.access.roles.super")), 1)]),
									_: 1
								})) : h("", !0),
								T(X).system ? (x(), m(a, {
									key: 1,
									color: "neutral",
									variant: "subtle"
								}, {
									default: D(() => [v(w(T(H)("guardian.access.roles.built_in")), 1)]),
									_: 1
								})) : h("", !0)
							]),
							y(f, null, {
								default: D(() => [_("form", {
									class: "flex max-w-3xl flex-col gap-4",
									"data-testid": "guardian-role-form",
									onSubmit: te(ue, ["prevent"])
								}, [
									T($) ? (x(), m(s, {
										key: 0,
										color: "success",
										variant: "subtle",
										title: T(H)("guardian.access.saved"),
										"data-testid": "guardian-role-saved"
									}, null, 8, ["title"])) : h("", !0),
									y(e, {
										action: T(W),
										testid: "guardian-role-save"
									}, null, 8, ["action"]),
									y(l, {
										label: T(H)("guardian.access.roles.fields.name"),
										required: ""
									}, {
										default: D(() => [y(c, {
											modelValue: T(Q).name,
											"onUpdate:modelValue": n[0] ||= (e) => T(Q).name = e,
											class: "w-72",
											"data-testid": "guardian-role-name"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									y(l, { label: T(H)("guardian.access.roles.fields.description") }, {
										default: D(() => [y(d, {
											modelValue: T(Q).description,
											"onUpdate:modelValue": n[1] ||= (e) => T(Q).description = e,
											rows: 2,
											class: "w-full",
											"data-testid": "guardian-role-description"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									T(X).super ? (x(), g("p", V, w(T(H)("guardian.access.roles.super_hint")), 1)) : (x(), m(t, {
										key: 2,
										modelValue: T(Q).permissions,
										"onUpdate:modelValue": n[2] ||= (e) => T(Q).permissions = e,
										permissions: T(Z),
										"id-prefix": "guardian-role"
									}, null, 8, ["modelValue", "permissions"])),
									_("div", null, [y(r, {
										type: "submit",
										icon: "i-lucide-save",
										loading: T(W).busy.value,
										"data-testid": "guardian-role-save"
									}, {
										default: D(() => [v(w(T(H)("guardian.access.save")), 1)]),
										_: 1
									}, 8, ["loading"])])
								], 32)]),
								_: 1
							}),
							y(f, null, {
								default: D(() => [y(e, {
									action: T(G),
									testid: "guardian-role-delete"
								}, null, 8, ["action"]), y(r, {
									color: "error",
									variant: "soft",
									icon: "i-lucide-trash-2",
									loading: T(G).busy.value,
									"data-testid": "guardian-role-delete",
									onClick: de
								}, {
									default: D(() => [v(w(T(H)("guardian.access.roles.delete")), 1)]),
									_: 1
								}, 8, ["loading"])]),
								_: 1
							})
						])) : h("", !0)]),
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
export { H as default };
