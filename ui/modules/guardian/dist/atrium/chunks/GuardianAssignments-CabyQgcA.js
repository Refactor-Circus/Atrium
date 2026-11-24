import { t as e } from "./GuardianState-DytBr9ih.js";
import { d as t, i as ee, o as n, u as r } from "./guardian-D9MeowUD.js";
import { t as i } from "./GuardianErrors-DtyToZz8.js";
import { t as te } from "./GuardianPager-DnfHQ8Kk.js";
import { a as ne, i as a, l as o, n as s, o as re, u as ie } from "./access-CMUXpA7X.js";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, openBlock as _, reactive as v, ref as y, renderList as b, resolveComponent as ae, toDisplayString as x, unref as S, vModelSelect as C, withCtx as w, withDirectives as T, withModifiers as E } from "vue";
import { UButton as oe, UFormField as se, UInput as ce } from "@refactor-circus/atrium/ui";
import { useI18n as le } from "vue-i18n";
// src/components/access/GuardianAssignments.vue?vue&type=script&setup=true&lang.ts
var D = {
	class: "space-y-4",
	"data-testid": "guardian-assignments"
}, ue = { value: "" }, de = ["value"], fe = { class: "space-y-4" }, pe = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-assignments-empty"
}, me = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-assignments-table"
}, he = { class: "text-muted" }, ge = {
	key: 0,
	class: "py-2 pr-3 font-medium"
}, O = { class: "py-2 pr-3 font-medium" }, k = { class: "py-2 pr-3 font-medium" }, A = { class: "py-2 pr-3 font-medium" }, j = { class: "divide-y divide-default" }, M = ["data-testid"], N = {
	key: 0,
	class: "py-2 pr-3"
}, P = { class: "py-2 pr-3" }, F = {
	key: 1,
	class: "text-muted"
}, I = { class: "py-2 pr-3" }, L = { class: "py-2 pr-3 text-muted" }, _e = { class: "py-2 text-right" }, ve = {
	value: "",
	disabled: ""
}, ye = ["value"], be = { value: "" }, xe = ["value"], R = /* @__PURE__ */ g({
	__name: "GuardianAssignments",
	props: {
		scopeTypes: {},
		user: { default: null },
		scopeType: { default: null },
		scopeId: { default: null },
		filters: {
			type: Boolean,
			default: !1
		},
		client: { default: void 0 }
	},
	setup(g) {
		let R = g, { t: z } = le(), B = r(), V = r(), H = l(() => R.scopeType !== null && R.scopeId !== null), U = y(1), W = v({
			user: "",
			role: "",
			scope_type: "",
			scope_id: ""
		}), G = y({ ...W }), K = v({
			user: "",
			role: "",
			scope_type: "",
			scope_id: ""
		}), q = l(() => {
			let e = {
				user: R.user ?? s(G.value.user),
				role: s(G.value.role),
				scope_type: H.value ? R.scopeType : s(G.value.scope_type),
				scope_id: H.value ? R.scopeId : s(G.value.scope_id)
			};
			return {
				...Object.fromEntries(Object.entries(e).filter(([, e]) => e !== null)),
				per_page: 25,
				...U.value > 1 ? { page: U.value } : {}
			};
		}), { client: J, data: Y, pending: Se, failed: Ce, status: we, reload: X } = t(async (e) => n(await e.GET("/role-assignments", { params: { query: q.value } })), q, R.client === void 0 ? void 0 : R.client), Te = o(J), Z = l(() => Y.value?.data ?? []), Q = l(() => a(Y.value));
		function $() {
			U.value = 1, G.value = { ...W };
		}
		function Ee() {
			Object.assign(W, {
				user: "",
				role: "",
				scope_type: "",
				scope_id: ""
			}), $();
		}
		function De(e) {
			return e.scope_type ? `${re(e.scope_type, R.scopeTypes)} ${e.scope_id ?? ""}`.trim() : z("guardian.access.scopes.global");
		}
		async function Oe() {
			if (!J) return;
			let e = H.value ? R.scopeType : s(K.scope_type);
			await B.run(async () => {
				n(await J.POST("/role-assignments", { body: {
					user: R.user ?? K.user.trim(),
					role: K.role,
					scope_type: e,
					scope_id: H.value ? R.scopeId : e === null ? null : s(K.scope_id)
				} }));
			}) && (Object.assign(K, {
				user: "",
				role: "",
				scope_type: "",
				scope_id: ""
			}), await X());
		}
		async function ke(e) {
			let t = e.role?.name ?? e.id;
			J && window.confirm(z("guardian.access.assignments.confirm_revoke", {
				role: t,
				user: e.user_id
			})) && await V.run(async () => n(await J.DELETE("/role-assignments/{assignment}", { params: { path: { assignment: e.id } } }))) && await X();
		}
		function Ae(e) {
			U.value = e;
		}
		return (t, n) => {
			let r = ce, a = se, o = oe, s = ae("RouterLink");
			return _(), f("div", D, [g.filters ? (_(), f("form", {
				key: 0,
				class: "atrium-querybar",
				"data-testid": "guardian-assignments-filters",
				onSubmit: E($, ["prevent"])
			}, [
				g.user === null ? (_(), u(a, {
					key: 0,
					label: S(z)("guardian.access.assignments.fields.user")
				}, {
					default: w(() => [h(r, {
						modelValue: S(W).user,
						"onUpdate:modelValue": n[0] ||= (e) => S(W).user = e,
						class: "w-40",
						"data-testid": "guardian-assignments-filter-user"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label"])) : d("", !0),
				h(a, { label: S(z)("guardian.access.assignments.fields.role") }, {
					default: w(() => [h(r, {
						modelValue: S(W).role,
						"onUpdate:modelValue": n[1] ||= (e) => S(W).role = e,
						class: "w-40",
						"data-testid": "guardian-assignments-filter-role"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label"]),
				S(H) ? d("", !0) : (_(), f(c, { key: 1 }, [h(a, { label: S(z)("guardian.access.assignments.fields.scope_type") }, {
					default: w(() => [T(p("select", {
						"onUpdate:modelValue": n[2] ||= (e) => S(W).scope_type = e,
						class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
						"data-testid": "guardian-assignments-filter-scope-type"
					}, [p("option", ue, x(S(z)("guardian.access.assignments.any_scope")), 1), (_(!0), f(c, null, b(g.scopeTypes, (e) => (_(), f("option", {
						key: e.key,
						value: e.type
					}, x(e.key), 9, de))), 128))], 512), [[C, S(W).scope_type]])]),
					_: 1
				}, 8, ["label"]), h(a, { label: S(z)("guardian.access.assignments.fields.scope_id") }, {
					default: w(() => [h(r, {
						modelValue: S(W).scope_id,
						"onUpdate:modelValue": n[3] ||= (e) => S(W).scope_id = e,
						class: "w-32",
						"data-testid": "guardian-assignments-filter-scope-id"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label"])], 64)),
				h(o, {
					type: "submit",
					icon: "i-lucide-filter",
					"data-testid": "guardian-assignments-filter"
				}, {
					default: w(() => [m(x(S(z)("guardian.access.filter")), 1)]),
					_: 1
				}),
				h(o, {
					variant: "ghost",
					icon: "i-lucide-x",
					"data-testid": "guardian-assignments-clear",
					onClick: Ee
				}, {
					default: w(() => [m(x(S(z)("guardian.access.clear")), 1)]),
					_: 1
				})
			], 32)) : d("", !0), h(e, {
				ready: !S(Se) && S(Y) !== null,
				failed: S(Ce),
				status: S(we),
				compact: !g.filters
			}, {
				default: w(() => [p("div", fe, [
					h(i, {
						action: S(V),
						testid: "guardian-revoke"
					}, null, 8, ["action"]),
					S(Z).length === 0 ? (_(), f("p", pe, x(S(z)("guardian.access.assignments.empty")), 1)) : (_(), f("table", me, [p("thead", he, [p("tr", null, [
						g.user === null ? (_(), f("th", ge, x(S(z)("guardian.access.assignments.fields.user")), 1)) : d("", !0),
						p("th", O, x(S(z)("guardian.access.assignments.fields.role")), 1),
						p("th", k, x(S(z)("guardian.access.assignments.fields.scope")), 1),
						p("th", A, x(S(z)("guardian.access.assignments.fields.assigned_at")), 1),
						n[8] ||= p("th", { class: "py-2" }, null, -1)
					])]), p("tbody", j, [(_(!0), f(c, null, b(S(Z), (e) => (_(), f("tr", {
						key: e.id,
						"data-testid": `guardian-assignment-${e.id}`
					}, [
						g.user === null ? (_(), f("td", N, [h(s, {
							to: S(ie)(e.user_id),
							class: "hover:underline",
							"data-testid": "guardian-assignment-user"
						}, {
							default: w(() => [m(x(e.user_id), 1)]),
							_: 2
						}, 1032, ["to"])])) : d("", !0),
						p("td", P, [e.role ? (_(), u(s, {
							key: 0,
							to: S(ne)(e.role.slug),
							class: "font-medium hover:underline",
							"data-testid": "guardian-assignment-role"
						}, {
							default: w(() => [m(x(e.role.name), 1)]),
							_: 2
						}, 1032, ["to"])) : (_(), f("span", F, "—"))]),
						p("td", I, x(De(e)), 1),
						p("td", L, x(S(ee)(e.assigned_at) ?? "—"), 1),
						p("td", _e, [h(o, {
							size: "xs",
							color: "error",
							variant: "ghost",
							icon: "i-lucide-x",
							"data-testid": `guardian-assignment-revoke-${e.id}`,
							onClick: (t) => ke(e)
						}, {
							default: w(() => [m(x(S(z)("guardian.access.assignments.revoke")), 1)]),
							_: 1
						}, 8, ["data-testid", "onClick"])])
					], 8, M))), 128))])])),
					h(te, {
						current: S(Q).current,
						last: S(Q).last,
						testid: "guardian-assignments",
						onGo: Ae
					}, null, 8, ["current", "last"]),
					p("form", {
						class: "flex flex-wrap items-end gap-3",
						"data-testid": "guardian-assign-form",
						onSubmit: E(Oe, ["prevent"])
					}, [
						g.user === null ? (_(), u(a, {
							key: 0,
							label: S(z)("guardian.access.assignments.fields.user"),
							error: S(B).error("user"),
							required: ""
						}, {
							default: w(() => [h(r, {
								modelValue: S(K).user,
								"onUpdate:modelValue": n[4] ||= (e) => S(K).user = e,
								class: "w-40",
								"data-testid": "guardian-assign-user"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"])) : d("", !0),
						h(a, {
							label: S(z)("guardian.access.assignments.fields.role"),
							required: ""
						}, {
							default: w(() => [T(p("select", {
								"onUpdate:modelValue": n[5] ||= (e) => S(K).role = e,
								class: "w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-assign-role"
							}, [p("option", ve, x(S(z)("guardian.access.assignments.pick_role")), 1), (_(!0), f(c, null, b(S(Te), (e) => (_(), f("option", {
								key: e.slug,
								value: e.slug
							}, x(e.name), 9, ye))), 128))], 512), [[C, S(K).role]])]),
							_: 1
						}, 8, ["label"]),
						S(H) ? d("", !0) : (_(), f(c, { key: 1 }, [h(a, { label: S(z)("guardian.access.assignments.fields.scope_type") }, {
							default: w(() => [T(p("select", {
								"onUpdate:modelValue": n[6] ||= (e) => S(K).scope_type = e,
								class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-assign-scope-type"
							}, [p("option", be, x(S(z)("guardian.access.scopes.global")), 1), (_(!0), f(c, null, b(g.scopeTypes, (e) => (_(), f("option", {
								key: e.key,
								value: e.type
							}, x(e.key), 9, xe))), 128))], 512), [[C, S(K).scope_type]])]),
							_: 1
						}, 8, ["label"]), S(K).scope_type ? (_(), u(a, {
							key: 0,
							label: S(z)("guardian.access.assignments.fields.scope_id"),
							required: ""
						}, {
							default: w(() => [h(r, {
								modelValue: S(K).scope_id,
								"onUpdate:modelValue": n[7] ||= (e) => S(K).scope_id = e,
								class: "w-32",
								"data-testid": "guardian-assign-scope-id"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label"])) : d("", !0)], 64)),
						h(o, {
							type: "submit",
							icon: "i-lucide-plus",
							loading: S(B).busy.value,
							"data-testid": "guardian-assign-submit"
						}, {
							default: w(() => [m(x(S(z)("guardian.access.assignments.assign")), 1)]),
							_: 1
						}, 8, ["loading"])
					], 32),
					h(i, {
						action: S(B),
						testid: "guardian-assign"
					}, null, 8, ["action"])
				])]),
				_: 1
			}, 8, [
				"ready",
				"failed",
				"status",
				"compact"
			])]);
		};
	}
});
export { R as t };
