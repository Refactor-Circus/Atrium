import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { t } from "./GuardianPager-DnfHQ8Kk.js";
import { i as ee, n } from "./access-Dcd3BQGu.js";
import { a as r, s as i } from "./admin-_cLX5Zre.js";
import { t as te } from "./GuardianState-DjXU16rU.js";
import { d as a, i as ne, o, u as s } from "./guardian-Dugz84u2.js";
import { Fragment as re, computed as c, createBlock as l, createCommentVNode as u, createElementBlock as d, createElementVNode as f, createTextVNode as p, createVNode as m, defineComponent as h, openBlock as g, reactive as _, ref as v, renderList as ie, toDisplayString as y, unref as b, vModelSelect as ae, vModelText as oe, withCtx as x, withDirectives as S, withModifiers as se } from "vue";
import { AtriumIntegrationScreen as ce, useAtriumScreen as le, useHead as ue } from "@refactor-circus/atrium";
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
}, F = { class: "text-muted" }, I = { class: "py-2 pr-3 font-medium" }, L = { class: "py-2 pr-3 font-medium" }, R = { class: "py-2 pr-3 font-medium" }, z = { class: "py-2 pr-3 font-medium" }, B = { class: "divide-y divide-default" }, V = ["data-testid"], pe = { class: "py-2 pr-3 font-mono" }, me = { class: "py-2 pr-3" }, he = { class: "py-2 pr-3" }, ge = { class: "py-2 pr-3 text-muted" }, _e = { class: "py-2 text-right" }, ve = { class: "font-medium" }, ye = { value: "allow" }, be = { value: "deny" }, xe = { class: "mt-3" }, H = /* @__PURE__ */ h({
	__name: "index",
	setup(h) {
		let { t: H } = k(), U = s(), W = s();
		ue({ title: () => H("guardian.admin.ip_rules.title") });
		let { data: Se } = le("guardian.ip-rules"), G = c(() => i(Se.value?.data.options)), K = v(1), q = c(() => ({
			per_page: 25,
			...K.value > 1 ? { page: K.value } : {}
		})), { client: J, data: Y, pending: Ce, failed: we, status: Te, reload: X } = a(async (e) => o(await e.GET("/ip-rules", { params: { query: q.value } })), q), Z = c(() => Y.value?.data ?? []), Q = c(() => ee(Y.value)), $ = _({
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
			let r = T, i = de, a = fe, o = C, s = O, c = D, h = w, _ = ce, v = E;
			return g(), l(v, null, {
				header: x(() => [m(r, { title: b(H)("guardian.admin.ip_rules.title") }, null, 8, ["title"])]),
				body: x(() => [m(_, { "screen-key": "guardian.ip-rules" }, {
					default: x(() => [f("div", A, [
						f("p", j, y(b(H)(`guardian.admin.ip_rules.mode.${b(G)}`)), 1),
						b(G) === "allowlist" ? (g(), l(i, {
							key: 0,
							color: "warning",
							variant: "subtle",
							icon: "i-lucide-triangle-alert",
							title: b(H)("guardian.admin.ip_rules.allowlist_warning"),
							"data-testid": "guardian-ip-rules-allowlist"
						}, null, 8, ["title"])) : u("", !0),
						m(te, {
							ready: !b(Ce) && b(Y) !== null,
							failed: b(we),
							status: b(Te)
						}, {
							default: x(() => [f("div", M, [
								m(e, {
									action: b(W),
									testid: "guardian-ip-rule-delete"
								}, null, 8, ["action"]),
								b(Z).length === 0 ? (g(), d("p", N, y(b(H)("guardian.admin.ip_rules.empty")), 1)) : (g(), d("table", P, [f("thead", F, [f("tr", null, [
									f("th", I, y(b(H)("guardian.admin.ip_rules.fields.cidr")), 1),
									f("th", L, y(b(H)("guardian.admin.ip_rules.fields.action")), 1),
									f("th", R, y(b(H)("guardian.admin.ip_rules.fields.description")), 1),
									f("th", z, y(b(H)("guardian.admin.ip_rules.fields.expires_at")), 1),
									n[4] ||= f("th", { class: "py-2" }, null, -1)
								])]), f("tbody", B, [(g(!0), d(re, null, ie(b(Z), (e) => (g(), d("tr", {
									key: e.id,
									"data-testid": `guardian-ip-rule-${e.id}`
								}, [
									f("td", pe, y(e.cidr), 1),
									f("td", me, [m(a, {
										color: e.action === "allow" ? "success" : "error",
										variant: "subtle"
									}, {
										default: x(() => [p(y(b(H)(`guardian.admin.ip_rules.actions.${e.action === "allow" ? "allow" : "deny"}`)), 1)]),
										_: 2
									}, 1032, ["color"])]),
									f("td", he, y(e.description ?? "—"), 1),
									f("td", ge, y(b(ne)(e.expires_at) ?? b(H)("guardian.admin.never")), 1),
									f("td", _e, [m(o, {
										size: "xs",
										color: "error",
										variant: "ghost",
										icon: "i-lucide-trash",
										"data-testid": `guardian-ip-rule-delete-${e.id}`,
										onClick: (t) => De(e)
									}, {
										default: x(() => [p(y(b(H)("guardian.admin.delete")), 1)]),
										_: 1
									}, 8, ["data-testid", "onClick"])])
								], 8, V))), 128))])])),
								m(t, {
									current: b(Q).current,
									last: b(Q).last,
									testid: "guardian-ip-rules",
									onGo: Oe
								}, null, 8, ["current", "last"]),
								m(h, null, {
									header: x(() => [f("h2", ve, y(b(H)("guardian.admin.ip_rules.new")), 1)]),
									default: x(() => [f("form", {
										class: "flex flex-wrap items-end gap-3",
										"data-testid": "guardian-ip-rule-form",
										onSubmit: se(Ee, ["prevent"])
									}, [
										m(c, {
											label: b(H)("guardian.admin.ip_rules.fields.cidr"),
											hint: b(H)("guardian.admin.ip_rules.cidr_hint"),
											error: b(U).error("cidr"),
											required: ""
										}, {
											default: x(() => [m(s, {
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
										m(c, {
											label: b(H)("guardian.admin.ip_rules.fields.action"),
											error: b(U).error("action"),
											required: ""
										}, {
											default: x(() => [S(f("select", {
												"onUpdate:modelValue": n[1] ||= (e) => b($).action = e,
												class: "w-32 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-ip-rule-action"
											}, [f("option", ye, y(b(H)("guardian.admin.ip_rules.actions.allow")), 1), f("option", be, y(b(H)("guardian.admin.ip_rules.actions.deny")), 1)], 512), [[ae, b($).action]])]),
											_: 1
										}, 8, ["label", "error"]),
										m(c, {
											label: b(H)("guardian.admin.ip_rules.fields.description"),
											error: b(U).error("description")
										}, {
											default: x(() => [m(s, {
												modelValue: b($).description,
												"onUpdate:modelValue": n[2] ||= (e) => b($).description = e,
												class: "w-64",
												"data-testid": "guardian-ip-rule-description"
											}, null, 8, ["modelValue"])]),
											_: 1
										}, 8, ["label", "error"]),
										m(c, {
											label: b(H)("guardian.admin.ip_rules.fields.expires_at"),
											error: b(U).error("expires_at")
										}, {
											default: x(() => [S(f("input", {
												"onUpdate:modelValue": n[3] ||= (e) => b($).expires = e,
												type: "date",
												class: "rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
												"data-testid": "guardian-ip-rule-expires"
											}, null, 512), [[oe, b($).expires]])]),
											_: 1
										}, 8, ["label", "error"]),
										m(o, {
											type: "submit",
											icon: "i-lucide-plus",
											loading: b(U).busy.value,
											"data-testid": "guardian-ip-rule-submit"
										}, {
											default: x(() => [p(y(b(H)("guardian.admin.ip_rules.create")), 1)]),
											_: 1
										}, 8, ["loading"])
									], 32), f("div", xe, [Object.keys(b(U).errors.value).length === 0 ? (g(), l(e, {
										key: 0,
										action: b(U),
										testid: "guardian-ip-rule-create"
									}, null, 8, ["action"])) : u("", !0)])]),
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
