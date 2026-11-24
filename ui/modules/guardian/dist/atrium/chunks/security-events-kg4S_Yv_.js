import { t as e } from "./GuardianEventList-CgC-DVe6.js";
import { a as t, c as n, r } from "./admin-_cLX5Zre.js";
import { n as i } from "./access-CMUXpA7X.js";
import { AtriumIntegrationScreen as a, useHead as o } from "@refactor-circus/atrium";
import { Fragment as s, createBlock as c, createElementBlock as l, createElementVNode as u, createTextVNode as d, createVNode as f, defineComponent as p, openBlock as m, reactive as h, ref as g, renderList as _, toDisplayString as v, unref as y, vModelSelect as b, vModelText as x, withCtx as S, withDirectives as C, withModifiers as w } from "vue";
import { UButton as T, UDashboardNavbar as E, UDashboardPanel as D, UFormField as O, UInput as k } from "@refactor-circus/atrium/ui";
import { useI18n as A } from "vue-i18n";
// src/pages/security-events/index.vue?vue&type=script&setup=true&lang.ts
var j = {
	class: "space-y-4",
	"data-testid": "guardian-security-events"
}, M = { value: "" }, N = ["value"], P = /* @__PURE__ */ p({
	__name: "index",
	setup(p) {
		let { t: P } = A();
		o({ title: () => P("guardian.admin.events.title") });
		let F = h({
			type: "",
			user: "",
			from: "",
			to: ""
		}), I = g({});
		function L() {
			I.value = {
				type: i(F.type),
				user: i(F.user),
				from: n(F.from),
				to: t(F.to)
			};
		}
		function R() {
			Object.assign(F, {
				type: "",
				user: "",
				from: "",
				to: ""
			}), L();
		}
		return (t, n) => {
			let i = E, o = O, p = k, h = T, g = a, A = D;
			return m(), c(A, null, {
				header: S(() => [f(i, { title: y(P)("guardian.admin.events.title") }, null, 8, ["title"])]),
				body: S(() => [f(g, { "screen-key": "guardian.security-events" }, {
					default: S(() => [u("div", j, [u("form", {
						class: "atrium-querybar",
						"data-testid": "guardian-events-filters",
						onSubmit: w(L, ["prevent"])
					}, [
						f(o, { label: y(P)("guardian.admin.events.fields.type") }, {
							default: S(() => [C(u("select", {
								"onUpdate:modelValue": n[0] ||= (e) => y(F).type = e,
								class: "w-64 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-type"
							}, [u("option", M, v(y(P)("guardian.admin.events.any_type")), 1), (m(!0), l(s, null, _(y(r), (e) => (m(), l("option", {
								key: e,
								value: e
							}, v(e), 9, N))), 128))], 512), [[b, y(F).type]])]),
							_: 1
						}, 8, ["label"]),
						f(o, { label: y(P)("guardian.admin.events.fields.user") }, {
							default: S(() => [f(p, {
								modelValue: y(F).user,
								"onUpdate:modelValue": n[1] ||= (e) => y(F).user = e,
								class: "w-40",
								"data-testid": "guardian-events-filter-user"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label"]),
						f(o, { label: y(P)("guardian.admin.events.from") }, {
							default: S(() => [C(u("input", {
								"onUpdate:modelValue": n[2] ||= (e) => y(F).from = e,
								type: "date",
								class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-from"
							}, null, 512), [[x, y(F).from]])]),
							_: 1
						}, 8, ["label"]),
						f(o, { label: y(P)("guardian.admin.events.to") }, {
							default: S(() => [C(u("input", {
								"onUpdate:modelValue": n[3] ||= (e) => y(F).to = e,
								type: "date",
								class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-to"
							}, null, 512), [[x, y(F).to]])]),
							_: 1
						}, 8, ["label"]),
						f(h, {
							type: "submit",
							icon: "i-lucide-filter",
							"data-testid": "guardian-events-filter"
						}, {
							default: S(() => [d(v(y(P)("guardian.admin.filter")), 1)]),
							_: 1
						}),
						f(h, {
							variant: "ghost",
							icon: "i-lucide-x",
							"data-testid": "guardian-events-clear",
							onClick: R
						}, {
							default: S(() => [d(v(y(P)("guardian.admin.clear")), 1)]),
							_: 1
						})
					], 32), f(e, {
						filters: y(I),
						testid: "guardian-events"
					}, null, 8, ["filters"])])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { P as default };
