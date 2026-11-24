import { t as e } from "./GuardianEventList-DFBFIdtO.js";
import { a as t, c as n, r } from "./admin-_cLX5Zre.js";
import { n as i } from "./access-Dcd3BQGu.js";
import { Fragment as a, createBlock as o, createElementBlock as s, createElementVNode as c, createTextVNode as l, createVNode as u, defineComponent as d, openBlock as f, reactive as p, ref as m, renderList as h, toDisplayString as g, unref as _, vModelSelect as v, vModelText as y, withCtx as b, withDirectives as x, withModifiers as S } from "vue";
import { AtriumIntegrationScreen as C, useHead as w } from "@refactor-circus/atrium";
import { UButton as T, UDashboardNavbar as E, UDashboardPanel as D, UFormField as O, UInput as k } from "@refactor-circus/atrium/ui";
import { useI18n as A } from "vue-i18n";
// src/pages/security-events/index.vue?vue&type=script&setup=true&lang.ts
var j = {
	class: "space-y-4",
	"data-testid": "guardian-security-events"
}, M = { value: "" }, N = ["value"], P = /* @__PURE__ */ d({
	__name: "index",
	setup(d) {
		let { t: P } = A();
		w({ title: () => P("guardian.admin.events.title") });
		let F = p({
			type: "",
			user: "",
			from: "",
			to: ""
		}), I = m({});
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
			let i = E, d = O, p = k, m = T, w = C, A = D;
			return f(), o(A, null, {
				header: b(() => [u(i, { title: _(P)("guardian.admin.events.title") }, null, 8, ["title"])]),
				body: b(() => [u(w, { "screen-key": "guardian.security-events" }, {
					default: b(() => [c("div", j, [c("form", {
						class: "atrium-querybar",
						"data-testid": "guardian-events-filters",
						onSubmit: S(L, ["prevent"])
					}, [
						u(d, { label: _(P)("guardian.admin.events.fields.type") }, {
							default: b(() => [x(c("select", {
								"onUpdate:modelValue": n[0] ||= (e) => _(F).type = e,
								class: "w-64 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-type"
							}, [c("option", M, g(_(P)("guardian.admin.events.any_type")), 1), (f(!0), s(a, null, h(_(r), (e) => (f(), s("option", {
								key: e,
								value: e
							}, g(e), 9, N))), 128))], 512), [[v, _(F).type]])]),
							_: 1
						}, 8, ["label"]),
						u(d, { label: _(P)("guardian.admin.events.fields.user") }, {
							default: b(() => [u(p, {
								modelValue: _(F).user,
								"onUpdate:modelValue": n[1] ||= (e) => _(F).user = e,
								class: "w-40",
								"data-testid": "guardian-events-filter-user"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label"]),
						u(d, { label: _(P)("guardian.admin.events.from") }, {
							default: b(() => [x(c("input", {
								"onUpdate:modelValue": n[2] ||= (e) => _(F).from = e,
								type: "date",
								class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-from"
							}, null, 512), [[y, _(F).from]])]),
							_: 1
						}, 8, ["label"]),
						u(d, { label: _(P)("guardian.admin.events.to") }, {
							default: b(() => [x(c("input", {
								"onUpdate:modelValue": n[3] ||= (e) => _(F).to = e,
								type: "date",
								class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
								"data-testid": "guardian-events-filter-to"
							}, null, 512), [[y, _(F).to]])]),
							_: 1
						}, 8, ["label"]),
						u(m, {
							type: "submit",
							icon: "i-lucide-filter",
							"data-testid": "guardian-events-filter"
						}, {
							default: b(() => [l(g(_(P)("guardian.admin.filter")), 1)]),
							_: 1
						}),
						u(m, {
							variant: "ghost",
							icon: "i-lucide-x",
							"data-testid": "guardian-events-clear",
							onClick: R
						}, {
							default: b(() => [l(g(_(P)("guardian.admin.clear")), 1)]),
							_: 1
						})
					], 32), u(e, {
						filters: _(I),
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
