import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { t } from "./GuardianRolePermissions-BeWmdjw_.js";
import { c as n, n as r, o as i, s as a, t as o } from "./access-Dcd3BQGu.js";
import { t as s } from "./GuardianState-DjXU16rU.js";
import { d as c, o as l, u } from "./guardian-Dugz84u2.js";
import { computed as d, createBlock as f, createCommentVNode as p, createElementBlock as m, createElementVNode as h, createTextVNode as g, createVNode as _, defineComponent as v, openBlock as y, reactive as b, ref as x, toDisplayString as S, unref as C, watch as w, withCtx as T, withModifiers as E } from "vue";
import { AtriumIntegrationScreen as D, useAtriumScreen as ee, useHead as te } from "@refactor-circus/atrium";
import { useRoute as ne, useRouter as re } from "vue-router";
import { UAlert as O, UBadge as k, UButton as A, UCard as j, UDashboardNavbar as M, UDashboardPanel as N, UFormField as P, UInput as F, UTextarea as I } from "@refactor-circus/atrium/ui";
import { useI18n as L } from "vue-i18n";
// src/pages/roles/[role].vue?vue&type=script&setup=true&lang.ts
var R = {
	key: 0,
	class: "space-y-4",
	"data-testid": "guardian-role"
}, z = { class: "flex flex-wrap items-center gap-2 text-sm" }, B = { "data-testid": "guardian-role-slug" }, V = {
	key: 1,
	class: "text-sm text-muted"
}, H = /* @__PURE__ */ v({
	__name: "[role]",
	setup(v) {
		let { t: H } = L(), ie = ne(), U = re(), W = u(), G = u(), K = d(() => String(ie.params.role)), { data: q } = ee("guardian.role", K), J = d(() => a(q.value?.data.options)), { client: Y, data: X, pending: ae, failed: oe, status: se, reload: ce } = c(async (e) => l(await e.GET("/roles/{role}", { params: { path: { role: K.value } } })).data, K), Z = n(Y), Q = b({
			name: "",
			description: "",
			permissions: []
		}), $ = x(!1);
		te({ title: () => X.value?.name ?? H("guardian.access.roles.role") }), w(X, (e) => {
			Q.name = e?.name ?? "", Q.description = e?.description ?? "", Q.permissions = [...e?.permissions ?? []];
		}, { immediate: !0 });
		function le(e) {
			return o.includes(e) ? H(`guardian.access.scopes.${e}`) : i(e, J.value) ?? e;
		}
		async function ue() {
			if (!Y || !X.value) return;
			let e = X.value;
			$.value = !1, $.value = await W.run(async () => {
				l(await Y.PATCH("/roles/{role}", {
					params: { path: { role: e.slug } },
					body: {
						name: Q.name.trim(),
						description: r(Q.description),
						...e.super ? {} : { permissions: Q.permissions }
					}
				}));
			}), $.value && await ce();
		}
		async function de() {
			if (!Y || !X.value || !window.confirm(H("guardian.access.roles.confirm_delete", { name: X.value.name }))) return;
			let e = X.value;
			await G.run(async () => l(await Y.DELETE("/roles/{role}", { params: { path: { role: e.slug } } }))) && await U.push("/guardian/roles");
		}
		return (n, r) => {
			let i = A, a = M, o = k, c = O, l = F, u = P, d = I, v = j, b = D, x = N;
			return y(), f(x, null, {
				header: T(() => [_(a, { title: C(X)?.name ?? C(H)("guardian.access.roles.role") }, {
					leading: T(() => [_(i, {
						to: "/guardian/roles",
						variant: "ghost",
						color: "neutral",
						icon: "i-lucide-arrow-left",
						"aria-label": C(H)("guardian.access.roles.title")
					}, null, 8, ["aria-label"])]),
					_: 1
				}, 8, ["title"])]),
				body: T(() => [_(b, {
					"screen-key": "guardian.role",
					record: C(K)
				}, {
					default: T(() => [_(s, {
						ready: !C(ae) && C(X) !== null,
						failed: C(oe),
						status: C(se),
						"not-found": C(H)("guardian.access.roles.not_found")
					}, {
						default: T(() => [C(X) ? (y(), m("div", R, [
							h("div", z, [
								h("code", B, S(C(X).slug), 1),
								_(o, {
									color: "neutral",
									variant: "subtle",
									"data-testid": "guardian-role-scope"
								}, {
									default: T(() => [g(S(le(C(X).scope)), 1)]),
									_: 1
								}),
								C(X).super ? (y(), f(o, {
									key: 0,
									color: "error",
									variant: "subtle"
								}, {
									default: T(() => [g(S(C(H)("guardian.access.roles.super")), 1)]),
									_: 1
								})) : p("", !0),
								C(X).system ? (y(), f(o, {
									key: 1,
									color: "neutral",
									variant: "subtle"
								}, {
									default: T(() => [g(S(C(H)("guardian.access.roles.built_in")), 1)]),
									_: 1
								})) : p("", !0)
							]),
							_(v, null, {
								default: T(() => [h("form", {
									class: "flex max-w-3xl flex-col gap-4",
									"data-testid": "guardian-role-form",
									onSubmit: E(ue, ["prevent"])
								}, [
									C($) ? (y(), f(c, {
										key: 0,
										color: "success",
										variant: "subtle",
										title: C(H)("guardian.access.saved"),
										"data-testid": "guardian-role-saved"
									}, null, 8, ["title"])) : p("", !0),
									_(e, {
										action: C(W),
										testid: "guardian-role-save"
									}, null, 8, ["action"]),
									_(u, {
										label: C(H)("guardian.access.roles.fields.name"),
										required: ""
									}, {
										default: T(() => [_(l, {
											modelValue: C(Q).name,
											"onUpdate:modelValue": r[0] ||= (e) => C(Q).name = e,
											class: "w-72",
											"data-testid": "guardian-role-name"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									_(u, { label: C(H)("guardian.access.roles.fields.description") }, {
										default: T(() => [_(d, {
											modelValue: C(Q).description,
											"onUpdate:modelValue": r[1] ||= (e) => C(Q).description = e,
											rows: 2,
											class: "w-full",
											"data-testid": "guardian-role-description"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									C(X).super ? (y(), m("p", V, S(C(H)("guardian.access.roles.super_hint")), 1)) : (y(), f(t, {
										key: 2,
										modelValue: C(Q).permissions,
										"onUpdate:modelValue": r[2] ||= (e) => C(Q).permissions = e,
										permissions: C(Z),
										"id-prefix": "guardian-role"
									}, null, 8, ["modelValue", "permissions"])),
									h("div", null, [_(i, {
										type: "submit",
										icon: "i-lucide-save",
										loading: C(W).busy.value,
										"data-testid": "guardian-role-save"
									}, {
										default: T(() => [g(S(C(H)("guardian.access.save")), 1)]),
										_: 1
									}, 8, ["loading"])])
								], 32)]),
								_: 1
							}),
							_(v, null, {
								default: T(() => [_(e, {
									action: C(G),
									testid: "guardian-role-delete"
								}, null, 8, ["action"]), _(i, {
									color: "error",
									variant: "soft",
									icon: "i-lucide-trash-2",
									loading: C(G).busy.value,
									"data-testid": "guardian-role-delete",
									onClick: de
								}, {
									default: T(() => [g(S(C(H)("guardian.access.roles.delete")), 1)]),
									_: 1
								}, 8, ["loading"])]),
								_: 1
							})
						])) : p("", !0)]),
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
