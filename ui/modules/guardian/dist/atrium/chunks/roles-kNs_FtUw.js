import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { t as ee } from "./GuardianRolePermissions-BeWmdjw_.js";
import { a as n, c as te, i as r, n as i, o as a, s as o, t as s } from "./access-CMUXpA7X.js";
import { t as ne } from "./GuardianState-DytBr9ih.js";
import { d as c, o as l, u } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as re, useAtriumScreen as d, useHead as f } from "@refactor-circus/atrium";
import { Fragment as p, computed as m, createBlock as h, createCommentVNode as g, createElementBlock as _, createElementVNode as v, createTextVNode as y, createVNode as b, defineComponent as x, openBlock as S, reactive as ie, ref as ae, renderList as C, resolveComponent as oe, toDisplayString as w, unref as T, vModelSelect as se, withCtx as E, withDirectives as ce, withModifiers as le } from "vue";
import { UBadge as ue, UButton as D, UCard as O, UDashboardNavbar as k, UDashboardPanel as A, UFormField as j, UInput as M, UTextarea as N } from "@refactor-circus/atrium/ui";
import { useI18n as P } from "vue-i18n";
import { useRouter as F } from "vue-router";
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
}, z = { class: "text-muted" }, B = { class: "py-2 pr-3 font-medium" }, V = { class: "py-2 pr-3 font-medium" }, H = { class: "py-2 font-medium" }, U = { class: "divide-y divide-default" }, de = ["data-testid"], fe = { class: "py-2 pr-3" }, pe = { class: "flex flex-wrap items-center gap-2" }, me = { class: "py-2 pr-3" }, he = { class: "py-2" }, ge = { class: "font-medium" }, _e = { class: "flex flex-wrap gap-3" }, ve = ["value"], ye = ["value"], W = /* @__PURE__ */ x({
	__name: "index",
	setup(x) {
		let { t: W } = P(), be = F(), G = u();
		f({ title: () => W("guardian.access.roles.title") });
		let { data: xe } = d("guardian.roles"), K = m(() => o(xe.value?.data.options)), q = ae(1), J = m(() => ({
			per_page: 25,
			...q.value > 1 ? { page: q.value } : {}
		})), { client: Y, data: X, pending: Se, failed: Ce, status: we } = c(async (e) => l(await e.GET("/roles", { params: { query: J.value } })), J), Te = te(Y), Z = m(() => X.value?.data ?? []), Q = m(() => r(X.value)), $ = ie({
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
			let i = k, a = oe("RouterLink"), o = ue, c = M, l = j, u = N, d = D, f = O, m = re, x = A;
			return S(), h(x, null, {
				header: E(() => [b(i, { title: T(W)("guardian.access.roles.title") }, null, 8, ["title"])]),
				body: E(() => [b(m, { "screen-key": "guardian.roles" }, {
					default: E(() => [b(ne, {
						ready: !T(Se) && T(X) !== null,
						failed: T(Ce),
						status: T(we)
					}, {
						default: E(() => [v("div", I, [
							T(Z).length === 0 ? (S(), _("p", L, w(T(W)("guardian.access.roles.empty")), 1)) : (S(), _("table", R, [v("thead", z, [v("tr", null, [
								v("th", B, w(T(W)("guardian.access.roles.fields.name")), 1),
								v("th", V, w(T(W)("guardian.access.roles.fields.scope")), 1),
								v("th", H, w(T(W)("guardian.access.roles.fields.permissions")), 1)
							])]), v("tbody", U, [(S(!0), _(p, null, C(T(Z), (e) => (S(), _("tr", {
								key: e.slug,
								"data-testid": `guardian-role-row-${e.slug}`
							}, [
								v("td", fe, [v("div", pe, [
									b(a, {
										to: T(n)(e.slug),
										class: "font-medium hover:underline"
									}, {
										default: E(() => [y(w(e.name), 1)]),
										_: 2
									}, 1032, ["to"]),
									e.super ? (S(), h(o, {
										key: 0,
										color: "error",
										variant: "subtle"
									}, {
										default: E(() => [y(w(T(W)("guardian.access.roles.super")), 1)]),
										_: 1
									})) : g("", !0),
									e.system ? (S(), h(o, {
										key: 1,
										color: "neutral",
										variant: "subtle"
									}, {
										default: E(() => [y(w(T(W)("guardian.access.roles.built_in")), 1)]),
										_: 1
									})) : g("", !0)
								])]),
								v("td", me, w(Ee(e.scope)), 1),
								v("td", he, w(e.super ? T(W)("guardian.access.roles.everything") : e.permissions?.length ?? 0), 1)
							], 8, de))), 128))])])),
							b(t, {
								current: T(Q).current,
								last: T(Q).last,
								testid: "guardian-roles",
								onGo: De
							}, null, 8, ["current", "last"]),
							b(f, null, {
								header: E(() => [v("h2", ge, w(T(W)("guardian.access.roles.new")), 1)]),
								default: E(() => [v("form", {
									class: "flex max-w-3xl flex-col gap-4",
									"data-testid": "guardian-role-new-form",
									onSubmit: le(Oe, ["prevent"])
								}, [
									b(e, {
										action: T(G),
										testid: "guardian-role-new"
									}, null, 8, ["action"]),
									v("div", _e, [
										b(l, {
											label: T(W)("guardian.access.roles.fields.name"),
											required: ""
										}, {
											default: E(() => [b(c, {
												modelValue: T($).name,
												"onUpdate:modelValue": r[0] ||= (e) => T($).name = e,
												class: "w-56",
												"data-testid": "guardian-role-new-name"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label"]),
										b(l, {
											label: T(W)("guardian.access.roles.fields.slug"),
											hint: T(W)("guardian.access.roles.slug_hint")
										}, {
											default: E(() => [b(c, {
												modelValue: T($).slug,
												"onUpdate:modelValue": r[1] ||= (e) => T($).slug = e,
												class: "w-48",
												"data-testid": "guardian-role-new-slug"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label", "hint"]),
										b(l, { label: T(W)("guardian.access.roles.fields.scope") }, {
											default: E(() => [ce(v("select", {
												"onUpdate:modelValue": r[2] ||= (e) => T($).scope = e,
												class: "w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-role-new-scope"
											}, [(S(!0), _(p, null, C(T(s), (e) => (S(), _("option", {
												key: e,
												value: e
											}, w(T(W)(`guardian.access.scopes.${e}`)), 9, ve))), 128)), (S(!0), _(p, null, C(T(K), (e) => (S(), _("option", {
												key: e.key,
												value: e.type
											}, w(e.key), 9, ye))), 128))], 512), [[se, T($).scope]])]),
											_: 1
										}, 8, ["label"])
									]),
									b(l, { label: T(W)("guardian.access.roles.fields.description") }, {
										default: E(() => [b(u, {
											modelValue: T($).description,
											"onUpdate:modelValue": r[3] ||= (e) => T($).description = e,
											rows: 2,
											class: "w-full",
											"data-testid": "guardian-role-new-description"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label"]),
									b(ee, {
										modelValue: T($).permissions,
										"onUpdate:modelValue": r[4] ||= (e) => T($).permissions = e,
										permissions: T(Te),
										"id-prefix": "guardian-role-new"
									}, null, 8, ["modelValue", "permissions"]),
									v("div", null, [b(d, {
										type: "submit",
										icon: "i-lucide-plus",
										loading: T(G).busy.value,
										"data-testid": "guardian-role-new-submit"
									}, {
										default: E(() => [y(w(T(W)("guardian.access.roles.create")), 1)]),
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
