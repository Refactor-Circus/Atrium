import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { i as n, l as r, n as i, o as a, s as o } from "./access-CMUXpA7X.js";
import { n as s } from "./admin-_cLX5Zre.js";
import { t as ee } from "./GuardianState-DytBr9ih.js";
import { d as c, o as l, u } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as te, useAtriumScreen as d, useHead as ne } from "@refactor-circus/atrium";
import { Fragment as f, computed as p, createBlock as m, createCommentVNode as h, createElementBlock as g, createElementVNode as _, createTextVNode as v, createVNode as y, defineComponent as re, openBlock as b, reactive as x, ref as ie, renderList as S, toDisplayString as C, unref as w, vModelCheckbox as T, vModelSelect as E, watch as ae, withCtx as D, withDirectives as O, withModifiers as oe } from "vue";
import { UButton as se, UCard as ce, UDashboardNavbar as le, UDashboardPanel as ue, UFormField as de, UInput as fe } from "@refactor-circus/atrium/ui";
import { useI18n as pe } from "vue-i18n";
// src/pages/two-factor-policies/index.vue?vue&type=script&setup=true&lang.ts
var me = {
	class: "space-y-4",
	"data-testid": "guardian-two-factor-policies"
}, he = { class: "space-y-4" }, ge = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-policies-empty"
}, _e = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-policies-table"
}, ve = { class: "text-muted" }, k = { class: "py-2 pr-3 font-medium" }, A = { class: "py-2 pr-3 font-medium" }, j = { class: "py-2 pr-3 font-medium" }, M = { class: "py-2 pr-3 font-medium" }, N = { class: "py-2 pr-3 font-medium" }, P = { class: "divide-y divide-default" }, F = ["data-testid"], ye = { class: "py-2 pr-3" }, be = { class: "py-2 pr-3" }, xe = { class: "py-2 pr-3" }, Se = ["onUpdate:modelValue"], Ce = { class: "py-2 pr-3" }, we = { class: "flex flex-wrap gap-2" }, Te = [
	"onUpdate:modelValue",
	"value",
	"data-testid"
], Ee = { class: "py-2 pr-3" }, De = { class: "py-2 text-right whitespace-nowrap" }, Oe = { class: "font-medium" }, ke = { class: "flex flex-wrap items-end gap-3" }, Ae = { value: "" }, je = ["value"], I = { value: "" }, Me = ["value"], Ne = { class: "flex flex-wrap items-center gap-4 text-sm" }, Pe = { class: "flex items-center gap-1" }, Fe = { class: "text-muted" }, Ie = ["value", "data-testid"], Le = { class: "text-xs text-muted" }, L = /* @__PURE__ */ re({
	__name: "index",
	setup(re) {
		let { t: L } = pe(), R = u(), z = u(), B = u();
		ne({ title: () => L("guardian.admin.policies.title") });
		let { data: Re } = d("guardian.two-factor-policies"), V = p(() => o(Re.value?.data.options)), H = ie(1), U = p(() => ({
			per_page: 25,
			...H.value > 1 ? { page: H.value } : {}
		})), { client: W, data: G, pending: ze, failed: Be, status: Ve, reload: K } = c(async (e) => l(await e.GET("/two-factor-policies", { params: { query: U.value } })), U), He = r(W), q = p(() => G.value?.data ?? []), J = p(() => n(G.value)), Y = x({}), X = x({
			scope_type: "",
			scope_id: "",
			role: "",
			required: !0,
			methods: [],
			grace_days: 0
		});
		ae(q, (e) => {
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
			let i = le, a = fe, o = se, c = de, l = ce, u = te, d = ue;
			return b(), m(d, null, {
				header: D(() => [y(i, { title: w(L)("guardian.admin.policies.title") }, null, 8, ["title"])]),
				body: D(() => [y(u, { "screen-key": "guardian.two-factor-policies" }, {
					default: D(() => [_("div", me, [y(ee, {
						ready: !w(ze) && w(G) !== null,
						failed: w(Be),
						status: w(Ve)
					}, {
						default: D(() => [_("div", he, [
							y(e, {
								action: w(z),
								testid: "guardian-policy-update"
							}, null, 8, ["action"]),
							y(e, {
								action: w(B),
								testid: "guardian-policy-delete"
							}, null, 8, ["action"]),
							w(q).length === 0 ? (b(), g("p", ge, C(w(L)("guardian.admin.policies.empty")), 1)) : (b(), g("table", _e, [_("thead", ve, [_("tr", null, [
								_("th", k, C(w(L)("guardian.admin.policies.fields.scope")), 1),
								_("th", A, C(w(L)("guardian.admin.policies.fields.role")), 1),
								_("th", j, C(w(L)("guardian.admin.policies.fields.required")), 1),
								_("th", M, C(w(L)("guardian.admin.policies.fields.methods")), 1),
								_("th", N, C(w(L)("guardian.admin.policies.fields.grace_days")), 1),
								r[6] ||= _("th", { class: "py-2" }, null, -1)
							])]), _("tbody", P, [(b(!0), g(f, null, S(w(q), (e) => (b(), g("tr", {
								key: e.id,
								"data-testid": `guardian-policy-${e.id}`
							}, [
								_("td", ye, C(Z(e)), 1),
								_("td", be, C(e.role ?? w(L)("guardian.admin.policies.any_role")), 1),
								w(Y)[e.id] ? (b(), g(f, { key: 0 }, [
									_("td", xe, [O(_("input", {
										"onUpdate:modelValue": (t) => w(Y)[e.id].required = t,
										type: "checkbox",
										"data-testid": "guardian-policy-required"
									}, null, 8, Se), [[T, w(Y)[e.id].required]])]),
									_("td", Ce, [_("div", we, [(b(!0), g(f, null, S(w(s), (t) => (b(), g("label", {
										key: t,
										class: "flex items-center gap-1"
									}, [O(_("input", {
										"onUpdate:modelValue": (t) => w(Y)[e.id].methods = t,
										type: "checkbox",
										value: t,
										"data-testid": `guardian-policy-method-${t}`
									}, null, 8, Te), [[T, w(Y)[e.id].methods]]), v(" " + C(w(L)(`guardian.admin.policies.methods.${t}`)), 1)]))), 128))])]),
									_("td", Ee, [y(a, {
										modelValue: w(Y)[e.id].grace_days,
										"onUpdate:modelValue": (t) => w(Y)[e.id].grace_days = t,
										modelModifiers: { number: !0 },
										type: "number",
										min: "0",
										max: "3650",
										class: "w-20",
										"data-testid": "guardian-policy-grace"
									}, null, 8, ["modelValue", "onUpdate:modelValue"])])
								], 64)) : h("", !0),
								_("td", De, [y(o, {
									size: "xs",
									variant: "soft",
									"data-testid": "guardian-policy-save",
									onClick: (t) => We(e)
								}, {
									default: D(() => [v(C(w(L)("guardian.admin.save")), 1)]),
									_: 1
								}, 8, ["onClick"]), y(o, {
									size: "xs",
									color: "error",
									variant: "ghost",
									"data-testid": "guardian-policy-delete",
									onClick: (t) => Ge(e)
								}, {
									default: D(() => [v(C(w(L)("guardian.admin.delete")), 1)]),
									_: 1
								}, 8, ["onClick"])])
							], 8, F))), 128))])])),
							y(t, {
								current: w(J).current,
								last: w(J).last,
								testid: "guardian-policies",
								onGo: Ke
							}, null, 8, ["current", "last"]),
							y(l, null, {
								header: D(() => [_("h2", Oe, C(w(L)("guardian.admin.policies.new")), 1)]),
								default: D(() => [_("form", {
									class: "space-y-3",
									"data-testid": "guardian-policy-form",
									onSubmit: oe(Ue, ["prevent"])
								}, [
									_("div", ke, [
										y(c, { label: w(L)("guardian.admin.policies.fields.scope_type") }, {
											default: D(() => [O(_("select", {
												"onUpdate:modelValue": r[0] ||= (e) => w(X).scope_type = e,
												class: "w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-policy-new-scope-type"
											}, [_("option", Ae, C(w(L)("guardian.admin.policies.everyone")), 1), (b(!0), g(f, null, S(w(V), (e) => (b(), g("option", {
												key: e.key,
												value: e.type
											}, C(e.key), 9, je))), 128))], 512), [[E, w(X).scope_type]])]),
											_: 1
										}, 8, ["label"]),
										w(X).scope_type ? (b(), m(c, {
											key: 0,
											label: w(L)("guardian.admin.policies.fields.scope_id"),
											required: ""
										}, {
											default: D(() => [y(a, {
												modelValue: w(X).scope_id,
												"onUpdate:modelValue": r[1] ||= (e) => w(X).scope_id = e,
												class: "w-32",
												"data-testid": "guardian-policy-new-scope-id"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label"])) : h("", !0),
										y(c, { label: w(L)("guardian.admin.policies.fields.role") }, {
											default: D(() => [O(_("select", {
												"onUpdate:modelValue": r[2] ||= (e) => w(X).role = e,
												class: "w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-policy-new-role"
											}, [_("option", I, C(w(L)("guardian.admin.policies.any_role")), 1), (b(!0), g(f, null, S(w(He), (e) => (b(), g("option", {
												key: e.slug,
												value: e.slug
											}, C(e.name), 9, Me))), 128))], 512), [[E, w(X).role]])]),
											_: 1
										}, 8, ["label"]),
										y(c, { label: w(L)("guardian.admin.policies.fields.grace_days") }, {
											default: D(() => [y(a, {
												modelValue: w(X).grace_days,
												"onUpdate:modelValue": r[3] ||= (e) => w(X).grace_days = e,
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
									_("div", Ne, [
										_("label", Pe, [O(_("input", {
											"onUpdate:modelValue": r[4] ||= (e) => w(X).required = e,
											type: "checkbox",
											"data-testid": "guardian-policy-new-required"
										}, null, 512), [[T, w(X).required]]), v(" " + C(w(L)("guardian.admin.policies.fields.required")), 1)]),
										_("span", Fe, C(w(L)("guardian.admin.policies.fields.methods")) + ":", 1),
										(b(!0), g(f, null, S(w(s), (e) => (b(), g("label", {
											key: e,
											class: "flex items-center gap-1"
										}, [O(_("input", {
											"onUpdate:modelValue": r[5] ||= (e) => w(X).methods = e,
											type: "checkbox",
											value: e,
											"data-testid": `guardian-policy-new-method-${e}`
										}, null, 8, Ie), [[T, w(X).methods]]), v(" " + C(w(L)(`guardian.admin.policies.methods.${e}`)), 1)]))), 128))
									]),
									_("p", Le, C(w(L)("guardian.admin.policies.methods_hint")), 1),
									y(e, {
										action: w(R),
										testid: "guardian-policy-create"
									}, null, 8, ["action"]),
									y(o, {
										type: "submit",
										icon: "i-lucide-plus",
										loading: w(R).busy.value,
										"data-testid": "guardian-policy-new-submit"
									}, {
										default: D(() => [v(C(w(L)("guardian.admin.policies.create")), 1)]),
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
