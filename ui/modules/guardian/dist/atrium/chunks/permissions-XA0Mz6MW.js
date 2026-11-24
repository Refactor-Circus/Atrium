import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { i as n, n as r } from "./access-CMUXpA7X.js";
import { t as ee } from "./GuardianState-DytBr9ih.js";
import { d as i, o as a, u as o } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as te, useHead as s } from "@refactor-circus/atrium";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, isRef as _, openBlock as v, reactive as y, ref as b, renderList as x, toDisplayString as S, unref as C, watch as w, withCtx as T, withModifiers as E } from "vue";
import { UBadge as ne, UButton as re, UCard as ie, UDashboardNavbar as ae, UDashboardPanel as oe, UFormField as se, UInput as ce } from "@refactor-circus/atrium/ui";
import { useI18n as le } from "vue-i18n";
// src/pages/permissions/index.vue?vue&type=script&setup=true&lang.ts
var ue = {
	class: "space-y-4",
	"data-testid": "guardian-permissions"
}, de = { class: "space-y-4" }, fe = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-permissions-empty"
}, D = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-permissions-table"
}, O = { class: "text-muted" }, k = { class: "py-2 pr-3 font-medium" }, A = { class: "py-2 pr-3 font-medium" }, j = { class: "divide-y divide-default" }, M = ["data-testid"], N = { class: "py-2 pr-3" }, P = { class: "flex items-center gap-2" }, F = { class: "py-2 pr-3" }, I = { class: "py-2 text-right whitespace-nowrap" }, L = { class: "font-medium" }, R = /* @__PURE__ */ g({
	__name: "index",
	setup(g) {
		let { t: R } = le(), z = o(), B = o(), V = o();
		s({ title: () => R("guardian.access.permissions.title") });
		let H = b(1), U = b(""), W = b(""), G = l(() => ({
			per_page: 50,
			...W.value ? { search: W.value } : {},
			...H.value > 1 ? { page: H.value } : {}
		})), { client: K, data: q, pending: pe, failed: me, status: he, reload: J } = i(async (e) => a(await e.GET("/permissions", { params: { query: G.value } })), G), Y = l(() => q.value?.data ?? []), X = l(() => n(q.value)), Z = y({}), Q = y({
			name: "",
			description: ""
		});
		w(Y, (e) => {
			for (let t of e) Z[t.name] = {
				name: t.name,
				description: t.description ?? ""
			};
		}, { immediate: !0 });
		function ge() {
			H.value = 1, W.value = U.value.trim();
		}
		function $(e) {
			H.value = e;
		}
		async function _e() {
			K && await z.run(async () => a(await K.POST("/permissions", { body: {
				name: Q.name.trim(),
				description: r(Q.description)
			} }))) && (Q.name = "", Q.description = "", await J());
		}
		async function ve(e) {
			let t = Z[e.name];
			if (!K || !t) return;
			let n = e.system ? { description: r(t.description) } : {
				name: t.name.trim(),
				description: r(t.description)
			};
			await B.run(async () => a(await K.PATCH("/permissions/{permission}", {
				params: { path: { permission: e.name } },
				body: n
			}))) && await J();
		}
		async function ye(e) {
			K && !e.system && window.confirm(R("guardian.access.permissions.confirm_delete", { name: e.name })) && await V.run(async () => a(await K.DELETE("/permissions/{permission}", { params: { path: { permission: e.name } } }))) && await J();
		}
		return (n, r) => {
			let i = ae, a = ce, o = se, s = re, l = ne, g = ie, y = te, b = oe;
			return v(), u(b, null, {
				header: T(() => [h(i, { title: C(R)("guardian.access.permissions.title") }, null, 8, ["title"])]),
				body: T(() => [h(y, { "screen-key": "guardian.permissions" }, {
					default: T(() => [p("div", ue, [p("form", {
						class: "flex flex-wrap items-end gap-3",
						"data-testid": "guardian-permissions-search",
						onSubmit: E(ge, ["prevent"])
					}, [h(o, { label: C(R)("guardian.access.permissions.search") }, {
						default: T(() => [h(a, {
							modelValue: C(U),
							"onUpdate:modelValue": r[0] ||= (e) => _(U) ? U.value = e : null,
							class: "w-64",
							"data-testid": "guardian-permissions-search-input"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label"]), h(s, {
						type: "submit",
						icon: "i-lucide-search"
					}, {
						default: T(() => [m(S(C(R)("guardian.access.filter")), 1)]),
						_: 1
					})], 32), h(ee, {
						ready: !C(pe) && C(q) !== null,
						failed: C(me),
						status: C(he)
					}, {
						default: T(() => [p("div", de, [
							h(e, {
								action: C(B),
								testid: "guardian-permission-update"
							}, null, 8, ["action"]),
							h(e, {
								action: C(V),
								testid: "guardian-permission-delete"
							}, null, 8, ["action"]),
							C(Y).length === 0 ? (v(), f("p", fe, S(C(R)("guardian.access.permissions.empty")), 1)) : (v(), f("table", D, [p("thead", O, [p("tr", null, [
								p("th", k, S(C(R)("guardian.access.permissions.fields.name")), 1),
								p("th", A, S(C(R)("guardian.access.permissions.fields.description")), 1),
								r[3] ||= p("th", { class: "py-2" }, null, -1)
							])]), p("tbody", j, [(v(!0), f(c, null, x(C(Y), (e) => (v(), f("tr", {
								key: e.name,
								"data-testid": `guardian-permission-${e.name}`
							}, [
								p("td", N, [p("div", P, [C(Z)[e.name] ? (v(), u(a, {
									key: 0,
									modelValue: C(Z)[e.name].name,
									"onUpdate:modelValue": (t) => C(Z)[e.name].name = t,
									disabled: e.system,
									class: "w-56",
									"data-testid": "guardian-permission-name"
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"disabled"
								])) : d("", !0), e.system ? (v(), u(l, {
									key: 1,
									color: "neutral",
									variant: "subtle"
								}, {
									default: T(() => [m(S(C(R)("guardian.access.permissions.built_in")), 1)]),
									_: 1
								})) : d("", !0)])]),
								p("td", F, [C(Z)[e.name] ? (v(), u(a, {
									key: 0,
									modelValue: C(Z)[e.name].description,
									"onUpdate:modelValue": (t) => C(Z)[e.name].description = t,
									class: "w-full",
									"data-testid": "guardian-permission-description"
								}, null, 8, ["modelValue", "onUpdate:modelValue"])) : d("", !0)]),
								p("td", I, [h(s, {
									size: "xs",
									variant: "soft",
									"data-testid": "guardian-permission-save",
									onClick: (t) => ve(e)
								}, {
									default: T(() => [m(S(C(R)("guardian.access.save")), 1)]),
									_: 1
								}, 8, ["onClick"]), h(s, {
									size: "xs",
									color: "error",
									variant: "ghost",
									disabled: e.system,
									"data-testid": "guardian-permission-delete",
									onClick: (t) => ye(e)
								}, {
									default: T(() => [m(S(C(R)("guardian.access.permissions.delete")), 1)]),
									_: 1
								}, 8, ["disabled", "onClick"])])
							], 8, M))), 128))])])),
							h(t, {
								current: C(X).current,
								last: C(X).last,
								testid: "guardian-permissions",
								onGo: $
							}, null, 8, ["current", "last"]),
							h(g, null, {
								header: T(() => [p("h2", L, S(C(R)("guardian.access.permissions.new")), 1)]),
								default: T(() => [p("form", {
									class: "flex flex-wrap items-end gap-3",
									"data-testid": "guardian-permission-new-form",
									onSubmit: E(_e, ["prevent"])
								}, [
									h(o, {
										label: C(R)("guardian.access.permissions.fields.name"),
										hint: C(R)("guardian.access.permissions.name_hint"),
										error: C(z).error("name"),
										required: ""
									}, {
										default: T(() => [h(a, {
											modelValue: C(Q).name,
											"onUpdate:modelValue": r[1] ||= (e) => C(Q).name = e,
											class: "w-56",
											"data-testid": "guardian-permission-new-name"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, [
										"label",
										"hint",
										"error"
									]),
									h(o, {
										label: C(R)("guardian.access.permissions.fields.description"),
										error: C(z).error("description")
									}, {
										default: T(() => [h(a, {
											modelValue: C(Q).description,
											"onUpdate:modelValue": r[2] ||= (e) => C(Q).description = e,
											class: "w-72",
											"data-testid": "guardian-permission-new-description"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label", "error"]),
									h(s, {
										type: "submit",
										icon: "i-lucide-plus",
										loading: C(z).busy.value,
										"data-testid": "guardian-permission-new-submit"
									}, {
										default: T(() => [m(S(C(R)("guardian.access.permissions.create")), 1)]),
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
export { R as default };
