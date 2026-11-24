import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { i as n, l as r, n as i, o as a, s as o } from "./access-Dcd3BQGu.js";
import { n as s } from "./admin-_cLX5Zre.js";
import { t as ee } from "./GuardianState-DjXU16rU.js";
import { d as c, o as l, u } from "./guardian-Dugz84u2.js";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as te, openBlock as y, reactive as b, ref as ne, renderList as x, toDisplayString as S, unref as C, vModelCheckbox as w, vModelSelect as T, watch as re, withCtx as E, withDirectives as D, withModifiers as ie } from "vue";
import { AtriumIntegrationScreen as ae, useAtriumScreen as oe, useHead as se } from "@refactor-circus/atrium";
import { UButton as ce, UCard as le, UDashboardNavbar as ue, UDashboardPanel as de, UFormField as fe, UInput as pe } from "@refactor-circus/atrium/ui";
import { useI18n as me } from "vue-i18n";
// src/pages/two-factor-policies/index.vue?vue&type=script&setup=true&lang.ts
var he = {
	class: "space-y-4",
	"data-testid": "guardian-two-factor-policies"
}, ge = { class: "space-y-4" }, _e = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-policies-empty"
}, ve = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-policies-table"
}, O = { class: "text-muted" }, k = { class: "py-2 pr-3 font-medium" }, A = { class: "py-2 pr-3 font-medium" }, j = { class: "py-2 pr-3 font-medium" }, M = { class: "py-2 pr-3 font-medium" }, N = { class: "py-2 pr-3 font-medium" }, P = { class: "divide-y divide-default" }, F = ["data-testid"], ye = { class: "py-2 pr-3" }, be = { class: "py-2 pr-3" }, xe = { class: "py-2 pr-3" }, Se = ["onUpdate:modelValue"], Ce = { class: "py-2 pr-3" }, we = { class: "flex flex-wrap gap-2" }, Te = [
	"onUpdate:modelValue",
	"value",
	"data-testid"
], Ee = { class: "py-2 pr-3" }, De = { class: "py-2 text-right whitespace-nowrap" }, Oe = { class: "font-medium" }, ke = { class: "flex flex-wrap items-end gap-3" }, Ae = { value: "" }, je = ["value"], I = { value: "" }, Me = ["value"], Ne = { class: "flex flex-wrap items-center gap-4 text-sm" }, Pe = { class: "flex items-center gap-1" }, Fe = { class: "text-muted" }, Ie = ["value", "data-testid"], Le = { class: "text-xs text-muted" }, L = /* @__PURE__ */ te({
	__name: "index",
	setup(te) {
		let { t: L } = me(), R = u(), z = u(), B = u();
		se({ title: () => L("guardian.admin.policies.title") });
		let { data: Re } = oe("guardian.two-factor-policies"), V = f(() => o(Re.value?.data.options)), H = ne(1), U = f(() => ({
			per_page: 25,
			...H.value > 1 ? { page: H.value } : {}
		})), { client: W, data: G, pending: ze, failed: Be, status: Ve, reload: K } = c(async (e) => l(await e.GET("/two-factor-policies", { params: { query: U.value } })), U), He = r(W), q = f(() => G.value?.data ?? []), J = f(() => n(G.value)), Y = b({}), X = b({
			scope_type: "",
			scope_id: "",
			role: "",
			required: !0,
			methods: [],
			grace_days: 0
		});
		re(q, (e) => {
			for (let t of e) Y[t.id] = {
				required: t.required,
				methods: s.filter((e) => t.methods?.includes(e)),
				grace_days: t.grace_days
			};
		}, { immediate: !0 });
		function Z(e) {
			return e.scope_type ? `${a(e.scope_type, V.value)} ${e.scope_id ?? ""}`.trim() : L("guardian.admin.policies.everyone");
		}
		function Q(e) {
			return e.length === 0 ? null : s.filter((t) => e.includes(t));
		}
		function $(e) {
			let t = Number(e);
			return Number.isFinite(t) ? Math.trunc(t) : 0;
		}
		async function Ue() {
			if (!W) return;
			let e = i(X.scope_type), t = {
				scope_type: e,
				scope_id: e === null ? null : i(X.scope_id),
				role: i(X.role),
				required: X.required,
				methods: Q(X.methods),
				grace_days: $(X.grace_days)
			};
			await R.run(async () => l(await W.POST("/two-factor-policies", { body: t }))) && (Object.assign(X, {
				scope_type: "",
				scope_id: "",
				role: "",
				required: !0,
				methods: [],
				grace_days: 0
			}), await K());
		}
		async function We(e) {
			let t = Y[e.id];
			if (!W || !t) return;
			let n = {
				required: t.required,
				methods: Q(t.methods),
				grace_days: $(t.grace_days)
			};
			await z.run(async () => l(await W.PATCH("/two-factor-policies/{policy}", {
				params: { path: { policy: e.id } },
				body: n
			}))) && await K();
		}
		async function Ge(e) {
			W && window.confirm(L("guardian.admin.policies.confirm_delete", { scope: Z(e) })) && await B.run(async () => l(await W.DELETE("/two-factor-policies/{policy}", { params: { path: { policy: e.id } } }))) && await K();
		}
		function Ke(e) {
			H.value = e;
		}
		return (n, r) => {
			let i = ue, a = pe, o = ce, c = fe, l = le, u = ae, f = de;
			return y(), p(f, null, {
				header: E(() => [v(i, { title: C(L)("guardian.admin.policies.title") }, null, 8, ["title"])]),
				body: E(() => [v(u, { "screen-key": "guardian.two-factor-policies" }, {
					default: E(() => [g("div", he, [v(ee, {
						ready: !C(ze) && C(G) !== null,
						failed: C(Be),
						status: C(Ve)
					}, {
						default: E(() => [g("div", ge, [
							v(e, {
								action: C(z),
								testid: "guardian-policy-update"
							}, null, 8, ["action"]),
							v(e, {
								action: C(B),
								testid: "guardian-policy-delete"
							}, null, 8, ["action"]),
							C(q).length === 0 ? (y(), h("p", _e, S(C(L)("guardian.admin.policies.empty")), 1)) : (y(), h("table", ve, [g("thead", O, [g("tr", null, [
								g("th", k, S(C(L)("guardian.admin.policies.fields.scope")), 1),
								g("th", A, S(C(L)("guardian.admin.policies.fields.role")), 1),
								g("th", j, S(C(L)("guardian.admin.policies.fields.required")), 1),
								g("th", M, S(C(L)("guardian.admin.policies.fields.methods")), 1),
								g("th", N, S(C(L)("guardian.admin.policies.fields.grace_days")), 1),
								r[6] ||= g("th", { class: "py-2" }, null, -1)
							])]), g("tbody", P, [(y(!0), h(d, null, x(C(q), (e) => (y(), h("tr", {
								key: e.id,
								"data-testid": `guardian-policy-${e.id}`
							}, [
								g("td", ye, S(Z(e)), 1),
								g("td", be, S(e.role ?? C(L)("guardian.admin.policies.any_role")), 1),
								C(Y)[e.id] ? (y(), h(d, { key: 0 }, [
									g("td", xe, [D(g("input", {
										"onUpdate:modelValue": (t) => C(Y)[e.id].required = t,
										type: "checkbox",
										"data-testid": "guardian-policy-required"
									}, null, 8, Se), [[w, C(Y)[e.id].required]])]),
									g("td", Ce, [g("div", we, [(y(!0), h(d, null, x(C(s), (t) => (y(), h("label", {
										key: t,
										class: "flex items-center gap-1"
									}, [D(g("input", {
										"onUpdate:modelValue": (t) => C(Y)[e.id].methods = t,
										type: "checkbox",
										value: t,
										"data-testid": `guardian-policy-method-${t}`
									}, null, 8, Te), [[w, C(Y)[e.id].methods]]), _(" " + S(C(L)(`guardian.admin.policies.methods.${t}`)), 1)]))), 128))])]),
									g("td", Ee, [v(a, {
										modelValue: C(Y)[e.id].grace_days,
										"onUpdate:modelValue": (t) => C(Y)[e.id].grace_days = t,
										modelModifiers: { number: !0 },
										type: "number",
										min: "0",
										max: "3650",
										class: "w-20",
										"data-testid": "guardian-policy-grace"
									}, null, 8, ["modelValue", "onUpdate:modelValue"])])
								], 64)) : m("", !0),
								g("td", De, [v(o, {
									size: "xs",
									variant: "soft",
									"data-testid": "guardian-policy-save",
									onClick: (t) => We(e)
								}, {
									default: E(() => [_(S(C(L)("guardian.admin.save")), 1)]),
									_: 1
								}, 8, ["onClick"]), v(o, {
									size: "xs",
									color: "error",
									variant: "ghost",
									"data-testid": "guardian-policy-delete",
									onClick: (t) => Ge(e)
								}, {
									default: E(() => [_(S(C(L)("guardian.admin.delete")), 1)]),
									_: 1
								}, 8, ["onClick"])])
							], 8, F))), 128))])])),
							v(t, {
								current: C(J).current,
								last: C(J).last,
								testid: "guardian-policies",
								onGo: Ke
							}, null, 8, ["current", "last"]),
							v(l, null, {
								header: E(() => [g("h2", Oe, S(C(L)("guardian.admin.policies.new")), 1)]),
								default: E(() => [g("form", {
									class: "space-y-3",
									"data-testid": "guardian-policy-form",
									onSubmit: ie(Ue, ["prevent"])
								}, [
									g("div", ke, [
										v(c, { label: C(L)("guardian.admin.policies.fields.scope_type") }, {
											default: E(() => [D(g("select", {
												"onUpdate:modelValue": r[0] ||= (e) => C(X).scope_type = e,
												class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-policy-new-scope-type"
											}, [g("option", Ae, S(C(L)("guardian.admin.policies.everyone")), 1), (y(!0), h(d, null, x(C(V), (e) => (y(), h("option", {
												key: e.key,
												value: e.type
											}, S(e.key), 9, je))), 128))], 512), [[T, C(X).scope_type]])]),
											_: 1
										}, 8, ["label"]),
										C(X).scope_type ? (y(), p(c, {
											key: 0,
											label: C(L)("guardian.admin.policies.fields.scope_id"),
											required: ""
										}, {
											default: E(() => [v(a, {
												modelValue: C(X).scope_id,
												"onUpdate:modelValue": r[1] ||= (e) => C(X).scope_id = e,
												class: "w-32",
												"data-testid": "guardian-policy-new-scope-id"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label"])) : m("", !0),
										v(c, { label: C(L)("guardian.admin.policies.fields.role") }, {
											default: E(() => [D(g("select", {
												"onUpdate:modelValue": r[2] ||= (e) => C(X).role = e,
												class: "w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-policy-new-role"
											}, [g("option", I, S(C(L)("guardian.admin.policies.any_role")), 1), (y(!0), h(d, null, x(C(He), (e) => (y(), h("option", {
												key: e.slug,
												value: e.slug
											}, S(e.name), 9, Me))), 128))], 512), [[T, C(X).role]])]),
											_: 1
										}, 8, ["label"]),
										v(c, { label: C(L)("guardian.admin.policies.fields.grace_days") }, {
											default: E(() => [v(a, {
												modelValue: C(X).grace_days,
												"onUpdate:modelValue": r[3] ||= (e) => C(X).grace_days = e,
												modelModifiers: { number: !0 },
												type: "number",
												min: "0",
												max: "3650",
												class: "w-24",
												"data-testid": "guardian-policy-new-grace"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label"])
									]),
									g("div", Ne, [
										g("label", Pe, [D(g("input", {
											"onUpdate:modelValue": r[4] ||= (e) => C(X).required = e,
											type: "checkbox",
											"data-testid": "guardian-policy-new-required"
										}, null, 512), [[w, C(X).required]]), _(" " + S(C(L)("guardian.admin.policies.fields.required")), 1)]),
										g("span", Fe, S(C(L)("guardian.admin.policies.fields.methods")) + ":", 1),
										(y(!0), h(d, null, x(C(s), (e) => (y(), h("label", {
											key: e,
											class: "flex items-center gap-1"
										}, [D(g("input", {
											"onUpdate:modelValue": r[5] ||= (e) => C(X).methods = e,
											type: "checkbox",
											value: e,
											"data-testid": `guardian-policy-new-method-${e}`
										}, null, 8, Ie), [[w, C(X).methods]]), _(" " + S(C(L)(`guardian.admin.policies.methods.${e}`)), 1)]))), 128))
									]),
									g("p", Le, S(C(L)("guardian.admin.policies.methods_hint")), 1),
									v(e, {
										action: C(R),
										testid: "guardian-policy-create"
									}, null, 8, ["action"]),
									v(o, {
										type: "submit",
										icon: "i-lucide-plus",
										loading: C(R).busy.value,
										"data-testid": "guardian-policy-new-submit"
									}, {
										default: E(() => [_(S(C(L)("guardian.admin.policies.create")), 1)]),
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
					])])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { L as default };
