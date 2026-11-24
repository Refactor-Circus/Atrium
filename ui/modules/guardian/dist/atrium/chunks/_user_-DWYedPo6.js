import { n as e, s as t } from "./access-CMUXpA7X.js";
import { t as n } from "./GuardianState-DytBr9ih.js";
import { d as r, o as i } from "./guardian-D9MeowUD.js";
import { t as a } from "./GuardianAssignments-CabyQgcA.js";
import { t as o } from "./UserSecurity-DcIvqrU6.js";
import { AtriumIntegrationScreen as s, useAtriumScreen as c, useHead as l } from "@refactor-circus/atrium";
import { Fragment as u, computed as d, createBlock as f, createCommentVNode as p, createElementBlock as m, createElementVNode as h, createTextVNode as g, createVNode as _, defineComponent as v, openBlock as y, reactive as b, ref as x, renderList as S, toDisplayString as C, unref as w, vModelSelect as T, withCtx as E, withDirectives as D, withModifiers as O } from "vue";
import { UBadge as k, UButton as A, UCard as j, UDashboardNavbar as M, UDashboardPanel as N, UFormField as P, UInput as F } from "@refactor-circus/atrium/ui";
import { useI18n as I } from "vue-i18n";
import { useRoute as L } from "vue-router";
// src/components/users/UserAbilities.vue?vue&type=script&setup=true&lang.ts
var R = { class: "font-semibold" }, z = { class: "space-y-3" }, B = { value: "" }, V = ["value"], H = {
	key: 0,
	"data-testid": "guardian-abilities-super"
}, U = {
	key: 1,
	class: "text-sm text-muted"
}, W = {
	key: 2,
	class: "flex flex-wrap gap-1",
	"data-testid": "guardian-abilities-list"
}, G = /* @__PURE__ */ v({
	__name: "UserAbilities",
	props: {
		user: {},
		scopeTypes: {}
	},
	setup(t) {
		let a = t, { t: o } = I(), s = b({
			scope_type: "",
			scope_id: ""
		}), c = x({
			scope_type: null,
			scope_id: null
		}), l = d(() => ({
			user: a.user,
			...c.value
		})), { data: v, pending: M, failed: N, status: L } = r(async (e) => i(await e.GET("/users/{user}/abilities", { params: {
			path: { user: a.user },
			query: c.value.scope_type ? {
				scope_type: c.value.scope_type,
				scope_id: c.value.scope_id
			} : {}
		} })).data, l);
		function G() {
			let t = e(s.scope_type);
			c.value = {
				scope_type: t,
				scope_id: t === null ? null : e(s.scope_id)
			};
		}
		return (e, r) => {
			let i = P, a = F, c = A, l = k, d = j;
			return y(), f(d, { "data-testid": "guardian-user-abilities" }, {
				header: E(() => [h("h2", R, C(w(o)("guardian.access.user.abilities")), 1)]),
				default: E(() => [h("div", z, [h("form", {
					class: "flex flex-wrap items-end gap-3",
					"data-testid": "guardian-abilities-scope",
					onSubmit: O(G, ["prevent"])
				}, [
					_(i, { label: w(o)("guardian.access.assignments.fields.scope_type") }, {
						default: E(() => [D(h("select", {
							"onUpdate:modelValue": r[0] ||= (e) => w(s).scope_type = e,
							class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "guardian-abilities-scope-type"
						}, [h("option", B, C(w(o)("guardian.access.scopes.global")), 1), (y(!0), m(u, null, S(t.scopeTypes, (e) => (y(), m("option", {
							key: e.key,
							value: e.type
						}, C(e.key), 9, V))), 128))], 512), [[T, w(s).scope_type]])]),
						_: 1
					}, 8, ["label"]),
					w(s).scope_type ? (y(), f(i, {
						key: 0,
						label: w(o)("guardian.access.assignments.fields.scope_id")
					}, {
						default: E(() => [_(a, {
							modelValue: w(s).scope_id,
							"onUpdate:modelValue": r[1] ||= (e) => w(s).scope_id = e,
							class: "w-32",
							"data-testid": "guardian-abilities-scope-id"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label"])) : p("", !0),
					_(c, {
						type: "submit",
						size: "sm",
						variant: "soft",
						"data-testid": "guardian-abilities-apply"
					}, {
						default: E(() => [g(C(w(o)("guardian.access.user.show_abilities")), 1)]),
						_: 1
					})
				], 32), _(n, {
					ready: !w(M) && w(v) !== null,
					failed: w(N),
					status: w(L),
					compact: ""
				}, {
					default: E(() => [w(v)?.super_admin ? (y(), m("p", H, C(w(o)("guardian.access.user.super_admin")), 1)) : (w(v)?.abilities ?? []).length === 0 ? (y(), m("p", U, C(w(o)("guardian.access.user.no_abilities")), 1)) : (y(), m("ul", W, [(y(!0), m(u, null, S(w(v)?.abilities ?? [], (e) => (y(), m("li", { key: e }, [_(l, {
						color: "neutral",
						variant: "subtle"
					}, {
						default: E(() => [h("code", null, C(e), 1)]),
						_: 2
					}, 1024)]))), 128))]))]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])])]),
				_: 1
			});
		};
	}
}), K = { class: "font-semibold" }, q = /* @__PURE__ */ v({
	__name: "UserAssignments",
	props: {
		user: {},
		scopeTypes: {}
	},
	setup(e) {
		let { t } = I();
		return (n, r) => {
			let i = j;
			return y(), f(i, { "data-testid": "guardian-user-assignments" }, {
				header: E(() => [h("h2", K, C(w(t)("guardian.access.user.assignments")), 1)]),
				default: E(() => [_(a, {
					user: e.user,
					"scope-types": e.scopeTypes
				}, null, 8, ["user", "scope-types"])]),
				_: 1
			});
		};
	}
}), J = { class: "grid gap-4 lg:grid-cols-2" }, Y = { class: "lg:col-span-2" }, X = { class: "lg:col-span-2" }, Z = /* @__PURE__ */ v({
	__name: "[user]",
	setup(e) {
		let { t: n } = I(), r = L(), i = d(() => String(r.params.user));
		l({ title: () => n("guardian.access.user.title", { user: i.value }) });
		let { data: a } = c("guardian.user", i), u = d(() => t(a.value?.data.options));
		return (e, t) => {
			let r = M, a = s, c = N;
			return y(), f(c, null, {
				header: E(() => [_(r, { title: w(n)("guardian.access.user.title", { user: w(i) }) }, null, 8, ["title"])]),
				body: E(() => [_(a, {
					"screen-key": "guardian.user",
					record: w(i)
				}, {
					default: E(() => [(y(), m("div", {
						key: w(i),
						class: "space-y-4",
						"data-testid": "guardian-user"
					}, [h("div", J, [h("div", Y, [_(q, {
						user: w(i),
						"scope-types": w(u)
					}, null, 8, ["user", "scope-types"])]), h("div", X, [_(G, {
						user: w(i),
						"scope-types": w(u)
					}, null, 8, ["user", "scope-types"])])]), _(o, { user: w(i) }, null, 8, ["user"])]))]),
					_: 1
				}, 8, ["record"])]),
				_: 1
			});
		};
	}
});
export { Z as default };
