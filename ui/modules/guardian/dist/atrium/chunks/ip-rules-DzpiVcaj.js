import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { i as ee, n } from "./access-CMUXpA7X.js";
import { a as r, s as i } from "./admin-_cLX5Zre.js";
import { t as te } from "./GuardianState-DytBr9ih.js";
import { d as a, i as ne, o, u as s } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as re, useAtriumScreen as c, useHead as l } from "@refactor-circus/atrium";
import { Fragment as ie, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, defineComponent as _, openBlock as v, reactive as ae, ref as oe, renderList as se, toDisplayString as y, unref as b, vModelSelect as ce, vModelText as le, withCtx as x, withDirectives as S, withModifiers as ue } from "vue";
import { UAlert as de, UBadge as fe, UButton as C, UCard as w, UDashboardNavbar as T, UDashboardPanel as E, UFormField as D, UInput as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
// src/pages/ip-rules/index.vue?vue&type=script&setup=true&lang.ts
var A = {
	class: "space-y-4",
	"data-testid": "guardian-ip-rules"
}, j = {
	class: "text-sm text-muted",
	"data-testid": "guardian-ip-rules-mode"
}, M = { class: "space-y-4" }, N = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "guardian-ip-rules-empty"
}, P = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "guardian-ip-rules-table"
}, F = { class: "text-muted" }, I = { class: "py-2 pr-3 font-medium" }, L = { class: "py-2 pr-3 font-medium" }, R = { class: "py-2 pr-3 font-medium" }, z = { class: "py-2 pr-3 font-medium" }, B = { class: "divide-y divide-default" }, V = ["data-testid"], pe = { class: "py-2 pr-3 font-mono" }, me = { class: "py-2 pr-3" }, he = { class: "py-2 pr-3" }, ge = { class: "py-2 pr-3 text-muted" }, _e = { class: "py-2 text-right" }, ve = { class: "font-medium" }, ye = { value: "allow" }, be = { value: "deny" }, xe = { class: "mt-3" }, H = /* @__PURE__ */ _({
	__name: "index",
	setup(_) {
		let { t: H } = k(), U = s(), W = s();
		l({ title: () => H("guardian.admin.ip_rules.title") });
		let { data: Se } = c("guardian.ip-rules"), G = u(() => i(Se.value?.data.options)), K = oe(1), q = u(() => ({
			per_page: 25,
			...K.value > 1 ? { page: K.value } : {}
		})), { client: J, data: Y, pending: Ce, failed: we, status: Te, reload: X } = a(async (e) => o(await e.GET("/ip-rules", { params: { query: q.value } })), q), Z = u(() => Y.value?.data ?? []), Q = u(() => ee(Y.value)), $ = ae({
			cidr: "",
			action: "deny",
			description: "",
			expires: ""
		});
		async function Ee() {
			if (!J) return;
			let e = {
				cidr: $.cidr.trim(),
				action: $.action,
				description: n($.description),
				expires_at: r($.expires)
			};
			await U.run(async () => o(await J.POST("/ip-rules", { body: e }))) && (Object.assign($, {
				cidr: "",
				action: "deny",
				description: "",
				expires: ""
			}), await X());
		}
		async function De(e) {
			J && window.confirm(H("guardian.admin.ip_rules.confirm_delete", { cidr: e.cidr })) && (G.value !== "allowlist" || e.action !== "allow" || window.confirm(H("guardian.admin.ip_rules.confirm_allow_delete", { cidr: e.cidr }))) && await W.run(async () => o(await J.DELETE("/ip-rules/{rule}", { params: { path: { rule: e.id } } }))) && await X();
		}
		function Oe(e) {
			K.value = e;
		}
		return (ee, n) => {
			let r = T, i = de, a = fe, o = C, s = O, c = D, l = w, u = re, _ = E;
			return v(), d(_, null, {
				header: x(() => [g(r, { title: b(H)("guardian.admin.ip_rules.title") }, null, 8, ["title"])]),
				body: x(() => [g(u, { "screen-key": "guardian.ip-rules" }, {
					default: x(() => [m("div", A, [
						m("p", j, y(b(H)(`guardian.admin.ip_rules.mode.${b(G)}`)), 1),
						b(G) === "allowlist" ? (v(), d(i, {
							key: 0,
							color: "warning",
							variant: "subtle",
							icon: "i-lucide-triangle-alert",
							title: b(H)("guardian.admin.ip_rules.allowlist_warning"),
							"data-testid": "guardian-ip-rules-allowlist"
						}, null, 8, ["title"])) : f("", !0),
						g(te, {
							ready: !b(Ce) && b(Y) !== null,
							failed: b(we),
							status: b(Te)
						}, {
							default: x(() => [m("div", M, [
								g(e, {
									action: b(W),
									testid: "guardian-ip-rule-delete"
								}, null, 8, ["action"]),
								b(Z).length === 0 ? (v(), p("p", N, y(b(H)("guardian.admin.ip_rules.empty")), 1)) : (v(), p("table", P, [m("thead", F, [m("tr", null, [
									m("th", I, y(b(H)("guardian.admin.ip_rules.fields.cidr")), 1),
									m("th", L, y(b(H)("guardian.admin.ip_rules.fields.action")), 1),
									m("th", R, y(b(H)("guardian.admin.ip_rules.fields.description")), 1),
									m("th", z, y(b(H)("guardian.admin.ip_rules.fields.expires_at")), 1),
									n[4] ||= m("th", { class: "py-2" }, null, -1)
								])]), m("tbody", B, [(v(!0), p(ie, null, se(b(Z), (e) => (v(), p("tr", {
									key: e.id,
									"data-testid": `guardian-ip-rule-${e.id}`
								}, [
									m("td", pe, y(e.cidr), 1),
									m("td", me, [g(a, {
										color: e.action === "allow" ? "success" : "error",
										variant: "subtle"
									}, {
										default: x(() => [h(y(b(H)(`guardian.admin.ip_rules.actions.${e.action === "allow" ? "allow" : "deny"}`)), 1)]),
										_: 2
									}, 1032, ["color"])]),
									m("td", he, y(e.description ?? "—"), 1),
									m("td", ge, y(b(ne)(e.expires_at) ?? b(H)("guardian.admin.never")), 1),
									m("td", _e, [g(o, {
										size: "xs",
										color: "error",
										variant: "ghost",
										icon: "i-lucide-trash",
										"data-testid": `guardian-ip-rule-delete-${e.id}`,
										onClick: (t) => De(e)
									}, {
										default: x(() => [h(y(b(H)("guardian.admin.delete")), 1)]),
										_: 1
									}, 8, ["data-testid", "onClick"])])
								], 8, V))), 128))])])),
								g(t, {
									current: b(Q).current,
									last: b(Q).last,
									testid: "guardian-ip-rules",
									onGo: Oe
								}, null, 8, ["current", "last"]),
								g(l, null, {
									header: x(() => [m("h2", ve, y(b(H)("guardian.admin.ip_rules.new")), 1)]),
									default: x(() => [m("form", {
										class: "flex flex-wrap items-end gap-3",
										"data-testid": "guardian-ip-rule-form",
										onSubmit: ue(Ee, ["prevent"])
									}, [
										g(c, {
											label: b(H)("guardian.admin.ip_rules.fields.cidr"),
											hint: b(H)("guardian.admin.ip_rules.cidr_hint"),
											error: b(U).error("cidr"),
											required: ""
										}, {
											default: x(() => [g(s, {
												modelValue: b($).cidr,
												"onUpdate:modelValue": n[0] ||= (e) => b($).cidr = e,
												class: "w-48 font-mono",
												"data-testid": "guardian-ip-rule-cidr"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, [
											"label",
											"hint",
											"error"
										]),
										g(c, {
											label: b(H)("guardian.admin.ip_rules.fields.action"),
											error: b(U).error("action"),
											required: ""
										}, {
											default: x(() => [S(m("select", {
												"onUpdate:modelValue": n[1] ||= (e) => b($).action = e,
												class: "w-32 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-ip-rule-action"
											}, [m("option", ye, y(b(H)("guardian.admin.ip_rules.actions.allow")), 1), m("option", be, y(b(H)("guardian.admin.ip_rules.actions.deny")), 1)], 512), [[ce, b($).action]])]),
											_: 1
										}, 8, ["label", "error"]),
										g(c, {
											label: b(H)("guardian.admin.ip_rules.fields.description"),
											error: b(U).error("description")
										}, {
											default: x(() => [g(s, {
												modelValue: b($).description,
												"onUpdate:modelValue": n[2] ||= (e) => b($).description = e,
												class: "w-64",
												"data-testid": "guardian-ip-rule-description"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label", "error"]),
										g(c, {
											label: b(H)("guardian.admin.ip_rules.fields.expires_at"),
											error: b(U).error("expires_at")
										}, {
											default: x(() => [S(m("input", {
												"onUpdate:modelValue": n[3] ||= (e) => b($).expires = e,
												type: "date",
												class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-ip-rule-expires"
											}, null, 512), [[le, b($).expires]])]),
											_: 1
										}, 8, ["label", "error"]),
										g(o, {
											type: "submit",
											icon: "i-lucide-plus",
											loading: b(U).busy.value,
											"data-testid": "guardian-ip-rule-submit"
										}, {
											default: x(() => [h(y(b(H)("guardian.admin.ip_rules.create")), 1)]),
											_: 1
										}, 8, ["loading"])
									], 32), m("div", xe, [Object.keys(b(U).errors.value).length === 0 ? (v(), d(e, {
										key: 0,
										action: b(U),
										testid: "guardian-ip-rule-create"
									}, null, 8, ["action"])) : f("", !0)])]),
									_: 1
								})
							])]),
							_: 1
						}, 8, [
							"ready",
							"failed",
							"status"
						])
					])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { H as default };
