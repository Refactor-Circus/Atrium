import { n as e, s as t } from "./access-Dcd3BQGu.js";
import { t as n } from "./GuardianState-DjXU16rU.js";
import { d as r, o as i } from "./guardian-Dugz84u2.js";
import { t as a } from "./GuardianAssignments-9aTtwmtc.js";
import { t as o } from "./UserSecurity-Y8OMCnA5.js";
import { Fragment as s, computed as c, createBlock as l, createCommentVNode as u, createElementBlock as d, createElementVNode as f, createTextVNode as p, createVNode as m, defineComponent as h, openBlock as g, reactive as _, ref as v, renderList as y, toDisplayString as b, unref as x, vModelSelect as S, withCtx as C, withDirectives as w, withModifiers as T } from "vue";
import { AtriumIntegrationScreen as E, useAtriumScreen as D, useHead as O } from "@refactor-circus/atrium";
import { useRoute as k } from "vue-router";
import { UBadge as A, UButton as j, UCard as M, UDashboardNavbar as N, UDashboardPanel as P, UFormField as F, UInput as I } from "@refactor-circus/atrium/ui";
import { useI18n as L } from "vue-i18n";
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
}, G = /* @__PURE__ */ h({
	__name: "UserAbilities",
	props: {
		user: {},
		scopeTypes: {}
	},
	setup(t) {
		let a = t, { t: o } = L(), h = _({
			scope_type: "",
			scope_id: ""
		}), E = v({
			scope_type: null,
			scope_id: null
		}), D = c(() => ({
			user: a.user,
			...E.value
		})), { data: O, pending: k, failed: N, status: P } = r(async (e) => i(await e.GET("/users/{user}/abilities", { params: {
			path: { user: a.user },
			query: E.value.scope_type ? {
				scope_type: E.value.scope_type,
				scope_id: E.value.scope_id
			} : {}
		} })).data, D);
		function G() {
			let t = e(h.scope_type);
			E.value = {
				scope_type: t,
				scope_id: t === null ? null : e(h.scope_id)
			};
		}
		return (e, r) => {
			let i = F, a = I, c = j, _ = A, v = M;
			return g(), l(v, { "data-testid": "guardian-user-abilities" }, {
				header: C(() => [f("h2", R, b(x(o)("guardian.access.user.abilities")), 1)]),
				default: C(() => [f("div", z, [f("form", {
					class: "flex flex-wrap items-end gap-3",
					"data-testid": "guardian-abilities-scope",
					onSubmit: T(G, ["prevent"])
				}, [
					m(i, { label: x(o)("guardian.access.assignments.fields.scope_type") }, {
						default: C(() => [w(f("select", {
							"onUpdate:modelValue": r[0] ||= (e) => x(h).scope_type = e,
							class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "guardian-abilities-scope-type"
						}, [f("option", B, b(x(o)("guardian.access.scopes.global")), 1), (g(!0), d(s, null, y(t.scopeTypes, (e) => (g(), d("option", {
							key: e.key,
							value: e.type
						}, b(e.key), 9, V))), 128))], 512), [[S, x(h).scope_type]])]),
						_: 1
					}, 8, ["label"]),
					x(h).scope_type ? (g(), l(i, {
						key: 0,
						label: x(o)("guardian.access.assignments.fields.scope_id")
					}, {
						default: C(() => [m(a, {
							modelValue: x(h).scope_id,
							"onUpdate:modelValue": r[1] ||= (e) => x(h).scope_id = e,
							class: "w-32",
							"data-testid": "guardian-abilities-scope-id"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label"])) : u("", !0),
					m(c, {
						type: "submit",
						size: "sm",
						variant: "soft",
						"data-testid": "guardian-abilities-apply"
					}, {
						default: C(() => [p(b(x(o)("guardian.access.user.show_abilities")), 1)]),
						_: 1
					})
				], 32), m(n, {
					ready: !x(k) && x(O) !== null,
					failed: x(N),
					status: x(P),
					compact: ""
				}, {
					default: C(() => [x(O)?.super_admin ? (g(), d("p", H, b(x(o)("guardian.access.user.super_admin")), 1)) : (x(O)?.abilities ?? []).length === 0 ? (g(), d("p", U, b(x(o)("guardian.access.user.no_abilities")), 1)) : (g(), d("ul", W, [(g(!0), d(s, null, y(x(O)?.abilities ?? [], (e) => (g(), d("li", { key: e }, [m(_, {
						color: "neutral",
						variant: "subtle"
					}, {
						default: C(() => [f("code", null, b(e), 1)]),
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
}), K = { class: "font-semibold" }, q = /* @__PURE__ */ h({
	__name: "UserAssignments",
	props: {
		user: {},
		scopeTypes: {}
	},
	setup(e) {
		let { t } = L();
		return (n, r) => {
			let i = M;
			return g(), l(i, { "data-testid": "guardian-user-assignments" }, {
				header: C(() => [f("h2", K, b(x(t)("guardian.access.user.assignments")), 1)]),
				default: C(() => [m(a, {
					user: e.user,
					"scope-types": e.scopeTypes
				}, null, 8, ["user", "scope-types"])]),
				_: 1
			});
		};
	}
}), J = { class: "grid gap-4 lg:grid-cols-2" }, Y = { class: "lg:col-span-2" }, X = { class: "lg:col-span-2" }, Z = /* @__PURE__ */ h({
	__name: "[user]",
	setup(e) {
		let { t: n } = L(), r = k(), i = c(() => String(r.params.user));
		O({ title: () => n("guardian.access.user.title", { user: i.value }) });
		let { data: a } = D("guardian.user", i), s = c(() => t(a.value?.data.options));
		return (e, t) => {
			let r = N, a = E, c = P;
			return g(), l(c, null, {
				header: C(() => [m(r, { title: x(n)("guardian.access.user.title", { user: x(i) }) }, null, 8, ["title"])]),
				body: C(() => [m(a, {
					"screen-key": "guardian.user",
					record: x(i)
				}, {
					default: C(() => [(g(), d("div", {
						key: x(i),
						class: "space-y-4",
						"data-testid": "guardian-user"
					}, [f("div", J, [f("div", Y, [m(q, {
						user: x(i),
						"scope-types": x(s)
					}, null, 8, ["user", "scope-types"])]), f("div", X, [m(G, {
						user: x(i),
						"scope-types": x(s)
					}, null, 8, ["user", "scope-types"])])]), m(o, { user: x(i) }, null, 8, ["user"])]))]),
					_: 1
				}, 8, ["record"])]),
				_: 1
			});
		};
	}
});
export { Z as default };
