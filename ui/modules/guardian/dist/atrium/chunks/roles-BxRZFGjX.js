import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { t as ee } from "./GuardianRolePermissions-BeWmdjw_.js";
import { a as n, c as te, i as r, n as i, o as a, s as o, t as s } from "./access-Dcd3BQGu.js";
import { t as ne } from "./GuardianState-DjXU16rU.js";
import { d as c, o as l, u } from "./guardian-Dugz84u2.js";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as y, openBlock as b, reactive as x, ref as S, renderList as C, resolveComponent as re, toDisplayString as w, unref as T, vModelSelect as ie, withCtx as E, withDirectives as ae, withModifiers as oe } from "vue";
import { AtriumIntegrationScreen as se, useAtriumScreen as ce, useHead as le } from "@refactor-circus/atrium";
import { useRouter as ue } from "vue-router";
import { UBadge as D, UButton as O, UCard as k, UDashboardNavbar as A, UDashboardPanel as j, UFormField as M, UInput as N, UTextarea as P } from "@refactor-circus/atrium/ui";
import { useI18n as F } from "vue-i18n";
// src/pages/roles/index.vue?vue&type=script&setup=true&lang.ts
var I = {
	class: "space-y-4",
	"data-testid": "guardian-roles"
}, L = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-roles-empty"
}, R = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-roles-table"
}, z = { class: "text-muted" }, B = { class: "py-2 pr-3 font-medium" }, V = { class: "py-2 pr-3 font-medium" }, H = { class: "py-2 font-medium" }, U = { class: "divide-y divide-default" }, de = ["data-testid"], fe = { class: "py-2 pr-3" }, pe = { class: "flex flex-wrap items-center gap-2" }, me = { class: "py-2 pr-3" }, he = { class: "py-2" }, ge = { class: "font-medium" }, _e = { class: "flex flex-wrap gap-3" }, ve = ["value"], ye = ["value"], W = /* @__PURE__ */ y({
	__name: "index",
	setup(y) {
		let { t: W } = F(), be = ue(), G = u();
		le({ title: () => W("guardian.access.roles.title") });
		let { data: xe } = ce("guardian.roles"), K = f(() => o(xe.value?.data.options)), q = S(1), J = f(() => ({
			per_page: 25,
			...q.value > 1 ? { page: q.value } : {}
		})), { client: Y, data: X, pending: Se, failed: Ce, status: we } = c(async (e) => l(await e.GET("/roles", { params: { query: J.value } })), J), Te = te(Y), Z = f(() => X.value?.data ?? []), Q = f(() => r(X.value)), $ = x({
			name: "",
			slug: "",
			scope: "global",
			description: "",
			permissions: []
		});
		function Ee(e) {
			return s.includes(e) ? W(`guardian.access.scopes.${e}`) : a(e, K.value) ?? e;
		}
		function De(e) {
			q.value = e;
		}
		async function Oe() {
			if (!Y) return;
			let e = [];
			await G.run(async () => {
				e.push(l(await Y.POST("/roles", { body: {
					name: $.name.trim(),
					slug: i($.slug),
					scope: $.scope,
					description: i($.description),
					permissions: $.permissions
				} })).data);
			}) && e[0] && await be.push(n(e[0].slug));
		}
		return (te, r) => {
			let i = A, a = re("RouterLink"), o = D, c = N, l = M, u = P, f = O, y = k, x = se, S = j;
			return b(), p(S, null, {
				header: E(() => [v(i, { title: T(W)("guardian.access.roles.title") }, null, 8, ["title"])]),
				body: E(() => [v(x, { "screen-key": "guardian.roles" }, {
					default: E(() => [v(ne, {
						ready: !T(Se) && T(X) !== null,
						failed: T(Ce),
						status: T(we)
					}, {
						default: E(() => [g("div", I, [
							T(Z).length === 0 ? (b(), h("p", L, w(T(W)("guardian.access.roles.empty")), 1)) : (b(), h("table", R, [g("thead", z, [g("tr", null, [
								g("th", B, w(T(W)("guardian.access.roles.fields.name")), 1),
								g("th", V, w(T(W)("guardian.access.roles.fields.scope")), 1),
								g("th", H, w(T(W)("guardian.access.roles.fields.permissions")), 1)
							])]), g("tbody", U, [(b(!0), h(d, null, C(T(Z), (e) => (b(), h("tr", {
								key: e.slug,
								"data-testid": `guardian-role-row-${e.slug}`
							}, [
								g("td", fe, [g("div", pe, [
									v(a, {
										to: T(n)(e.slug),
										class: "font-medium hover:underline"
									}, {
										default: E(() => [_(w(e.name), 1)]),
										_: 2
									}, 1032, ["to"]),
									e.super ? (b(), p(o, {
										key: 0,
										color: "error",
										variant: "subtle"
									}, {
										default: E(() => [_(w(T(W)("guardian.access.roles.super")), 1)]),
										_: 1
									})) : m("", !0),
									e.system ? (b(), p(o, {
										key: 1,
										color: "neutral",
										variant: "subtle"
									}, {
										default: E(() => [_(w(T(W)("guardian.access.roles.built_in")), 1)]),
										_: 1
									})) : m("", !0)
								])]),
								g("td", me, w(Ee(e.scope)), 1),
								g("td", he, w(e.super ? T(W)("guardian.access.roles.everything") : e.permissions?.length ?? 0), 1)
							], 8, de))), 128))])])),
							v(t, {
								current: T(Q).current,
								last: T(Q).last,
								testid: "guardian-roles",
								onGo: De
							}, null, 8, ["current", "last"]),
							v(y, null, {
								header: E(() => [g("h2", ge, w(T(W)("guardian.access.roles.new")), 1)]),
								default: E(() => [g("form", {
									class: "flex max-w-3xl flex-col gap-4",
									"data-testid": "guardian-role-new-form",
									onSubmit: oe(Oe, ["prevent"])
								}, [
									v(e, {
										action: T(G),
										testid: "guardian-role-new"
									}, null, 8, ["action"]),
									g("div", _e, [
										v(l, {
											label: T(W)("guardian.access.roles.fields.name"),
											required: ""
										}, {
											default: E(() => [v(c, {
												modelValue: T($).name,
												"onUpdate:modelValue": r[0] ||= (e) => T($).name = e,
												class: "w-56",
												"data-testid": "guardian-role-new-name"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label"]),
										v(l, {
											label: T(W)("guardian.access.roles.fields.slug"),
											hint: T(W)("guardian.access.roles.slug_hint")
										}, {
											default: E(() => [v(c, {
												modelValue: T($).slug,
												"onUpdate:modelValue": r[1] ||= (e) => T($).slug = e,
												class: "w-48",
												"data-testid": "guardian-role-new-slug"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label", "hint"]),
										v(l, { label: T(W)("guardian.access.roles.fields.scope") }, {
											default: E(() => [ae(g("select", {
												"onUpdate:modelValue": r[2] ||= (e) => T($).scope = e,
												class: "w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-role-new-scope"
											}, [(b(!0), h(d, null, C(T(s), (e) => (b(), h("option", {
												key: e,
												value: e
											}, w(T(W)(`guardian.access.scopes.${e}`)), 9, ve))), 128)), (b(!0), h(d, null, C(T(K), (e) => (b(), h("option", {
												key: e.key,
												value: e.type
											}, w(e.key), 9, ye))), 128))], 512), [[ie, T($).scope]])]),
											_: 1
										}, 8, ["label"])
									]),
									v(l, { label: T(W)("guardian.access.roles.fields.description") }, {
										default: E(() => [v(u, {
											modelValue: T($).description,
											"onUpdate:modelValue": r[3] ||= (e) => T($).description = e,
											rows: 2,
											class: "w-full",
											"data-testid": "guardian-role-new-description"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									v(ee, {
										modelValue: T($).permissions,
										"onUpdate:modelValue": r[4] ||= (e) => T($).permissions = e,
										permissions: T(Te),
										"id-prefix": "guardian-role-new"
									}, null, 8, ["modelValue", "permissions"]),
									g("div", null, [v(f, {
										type: "submit",
										icon: "i-lucide-plus",
										loading: T(G).busy.value,
										"data-testid": "guardian-role-new-submit"
									}, {
										default: E(() => [_(w(T(W)("guardian.access.roles.create")), 1)]),
										_: 1
									}, 8, ["loading"])])
								], 32)]),
								_: 1
							})
						])]),
						_: 1
					}, 8, [
						"ready",
						"failed",
						"status"
					])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { W as default };
