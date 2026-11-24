import { t as e } from "./GuardianErrors-DtyToZz8.js";
import { a as t, c as n, n as r, o as i, t as ee } from "./SsoConnectionFields-BBomoNqB.js";
import { t as te } from "./GuardianState-DytBr9ih.js";
import { c as a, d as o, o as s, u as c } from "./guardian-D9MeowUD.js";
import { AtriumIntegrationScreen as ne, isExternalUrl as re, navigateTo as l, useAtriumIntegration as ie, useHead as ae } from "@refactor-circus/atrium";
import { Fragment as oe, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, defineComponent as se, openBlock as _, reactive as v, ref as ce, toDisplayString as y, unref as b, vModelCheckbox as x, watch as le, withCtx as S, withDirectives as C, withModifiers as ue } from "vue";
import { UButton as de, UCard as w, UDashboardNavbar as T, UDashboardPanel as E, UFormField as D, UInput as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
import { useRoute as A } from "vue-router";
// src/pages/sso-connections/[connection].vue?vue&type=script&setup=true&lang.ts
var j = {
	key: 0,
	class: "space-y-4",
	"data-testid": "guardian-sso-connection"
}, M = { class: "font-semibold" }, N = { class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[14rem_1fr]" }, P = { class: "text-muted" }, F = {
	class: "break-all font-mono text-xs",
	"data-testid": "guardian-sso-callback-url"
}, I = { class: "text-muted" }, L = {
	class: "break-all font-mono text-xs",
	"data-testid": "guardian-sso-metadata-url"
}, R = { class: "text-muted" }, z = { "data-testid": "guardian-sso-identities-count" }, B = { class: "font-semibold" }, V = { class: "flex flex-wrap gap-4 text-sm" }, H = { class: "flex items-center gap-1" }, fe = { class: "flex items-center gap-1" }, pe = { class: "flex items-center gap-1" }, me = { class: "flex items-center gap-3" }, he = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "guardian-sso-saved"
}, ge = { class: "space-y-2" }, U = /* @__PURE__ */ se({
	__name: "[connection]",
	setup(se) {
		let { t: U } = k(), _e = A(), W = c(), G = c(), ve = ie("roster"), K = u(() => String(_e.params.connection)), { client: q, data: J, pending: ye, failed: be, status: Y, reload: xe } = o(async (e) => s(await e.GET("/sso-connections/{connection}", { params: { path: { connection: K.value } } })).data, K);
		ae({ title: () => J.value?.name ?? U("guardian.sso.connection.title") });
		let X = u(() => ve.active && J.value?.organization ? i(J.value.organization) : null), Z = v({
			name: "",
			enabled: !0,
			enforced: !1,
			jit: !0
		}), Q = v({}), $ = ce(!1);
		le(J, (e) => {
			if (e) {
				Object.assign(Z, {
					name: e.name,
					enabled: e.enabled,
					enforced: e.enforced,
					jit: e.jit
				});
				for (let n of t(e.protocol)) Q[n] = r.includes(n) ? "" : e.settings?.[n] ?? "";
			}
		}, { immediate: !0 });
		async function Se() {
			let e = J.value;
			q && e && ($.value = !1, $.value = await W.run(async () => s(await q.PATCH("/sso-connections/{connection}", {
				params: { path: { connection: e.slug } },
				body: a({
					name: Z.name.trim(),
					enabled: Z.enabled,
					enforced: Z.enforced,
					jit: Z.jit,
					...n(e.protocol, Q, !0)
				})
			}))), $.value && await xe());
		}
		async function Ce() {
			let e = J.value;
			if (!q || !e || !window.confirm(U("guardian.sso.connection.confirm_delete", { name: e.name }))) return;
			let t = X.value;
			await G.run(async () => s(await q.DELETE("/sso-connections/{connection}", { params: { path: { connection: e.slug } } }))) && await l(t ?? "/");
		}
		return (t, n) => {
			let r = de, i = T, a = w, o = O, s = D, c = ne, l = E;
			return _(), d(l, null, {
				header: S(() => [g(i, { title: b(J)?.name ?? b(U)("guardian.sso.connection.title") }, {
					leading: S(() => [b(X) ? (_(), d(r, {
						key: 0,
						to: b(X),
						variant: "ghost",
						icon: "i-lucide-arrow-left",
						"aria-label": b(U)("guardian.sso.connection.back"),
						"data-testid": "guardian-sso-back"
					}, null, 8, ["to", "aria-label"])) : f("", !0)]),
					_: 1
				}, 8, ["title"])]),
				body: S(() => [g(c, {
					"screen-key": "guardian.sso-connection",
					record: b(K)
				}, {
					default: S(() => [g(te, {
						ready: !b(ye) && b(J) !== null,
						failed: b(be),
						status: b(Y),
						"not-found": b(U)("guardian.sso.connection.not_found")
					}, {
						default: S(() => [b(J) ? (_(), p("div", j, [
							g(a, null, {
								header: S(() => [m("h2", M, y(b(U)(`guardian.sso.protocols.${b(J).protocol}`, b(J).protocol)) + " · " + y(b(J).organization), 1)]),
								default: S(() => [m("dl", N, [
									m("dt", P, y(b(U)("guardian.sso.connection.callback_url")), 1),
									m("dd", F, y(b(J).callback_url ?? "—"), 1),
									b(J).metadata_url ? (_(), p(oe, { key: 0 }, [m("dt", I, y(b(U)("guardian.sso.connection.metadata_url")), 1), m("dd", L, y(b(J).metadata_url), 1)], 64)) : f("", !0),
									m("dt", R, y(b(U)("guardian.sso.identities.title")), 1),
									m("dd", z, y(b(J).identities_count ?? "—"), 1)
								]), b(J).sign_in_url && b(re)(b(J).sign_in_url) ? (_(), d(r, {
									key: 0,
									to: b(J).sign_in_url,
									external: "",
									target: "_blank",
									rel: "noopener",
									class: "mt-3",
									variant: "ghost",
									icon: "i-lucide-external-link",
									"data-testid": "guardian-sso-test-sign-in"
								}, {
									default: S(() => [h(y(b(U)("guardian.sso.connection.test_sign_in")), 1)]),
									_: 1
								}, 8, ["to"])) : f("", !0)]),
								_: 1
							}),
							g(a, null, {
								header: S(() => [m("h2", B, y(b(U)("guardian.sso.connection.settings")), 1)]),
								default: S(() => [m("form", {
									class: "max-w-3xl space-y-4",
									"data-testid": "guardian-sso-form",
									onSubmit: ue(Se, ["prevent"])
								}, [
									g(s, {
										label: b(U)("guardian.sso.fields.name"),
										error: b(W).error("name"),
										required: ""
									}, {
										default: S(() => [g(o, {
											modelValue: b(Z).name,
											"onUpdate:modelValue": n[0] ||= (e) => b(Z).name = e,
											class: "w-72",
											"data-testid": "guardian-sso-name"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label", "error"]),
									g(ee, {
										protocol: b(J).protocol,
										values: b(Q),
										action: b(W),
										editing: "",
										testid: "guardian-sso"
									}, null, 8, [
										"protocol",
										"values",
										"action"
									]),
									m("div", V, [
										m("label", H, [C(m("input", {
											"onUpdate:modelValue": n[1] ||= (e) => b(Z).jit = e,
											type: "checkbox",
											"data-testid": "guardian-sso-jit"
										}, null, 512), [[x, b(Z).jit]]), h(" " + y(b(U)("guardian.sso.fields.jit")), 1)]),
										m("label", fe, [C(m("input", {
											"onUpdate:modelValue": n[2] ||= (e) => b(Z).enforced = e,
											type: "checkbox",
											"data-testid": "guardian-sso-enforced"
										}, null, 512), [[x, b(Z).enforced]]), h(" " + y(b(U)("guardian.sso.fields.enforced")), 1)]),
										m("label", pe, [C(m("input", {
											"onUpdate:modelValue": n[3] ||= (e) => b(Z).enabled = e,
											type: "checkbox",
											"data-testid": "guardian-sso-enabled"
										}, null, 512), [[x, b(Z).enabled]]), h(" " + y(b(U)("guardian.sso.fields.enabled")), 1)])
									]),
									Object.keys(b(W).errors.value).length === 0 ? (_(), d(e, {
										key: 0,
										action: b(W),
										testid: "guardian-sso-save"
									}, null, 8, ["action"])) : f("", !0),
									m("div", me, [g(r, {
										type: "submit",
										icon: "i-lucide-check",
										loading: b(W).busy.value,
										"data-testid": "guardian-sso-save"
									}, {
										default: S(() => [h(y(b(U)("guardian.sso.save")), 1)]),
										_: 1
									}, 8, ["loading"]), b($) ? (_(), p("span", he, y(b(U)("guardian.sso.saved")), 1)) : f("", !0)])
								], 32)]),
								_: 1
							}),
							m("div", ge, [g(r, {
								color: "error",
								variant: "soft",
								icon: "i-lucide-trash",
								"data-testid": "guardian-sso-delete",
								onClick: Ce
							}, {
								default: S(() => [h(y(b(U)("guardian.sso.connection.delete")), 1)]),
								_: 1
							}), g(e, {
								action: b(G),
								testid: "guardian-sso-delete"
							}, null, 8, ["action"])])
						])) : f("", !0)]),
						_: 1
					}, 8, [
						"ready",
						"failed",
						"status",
						"not-found"
					])]),
					_: 1
				}, 8, ["record"])]),
				_: 1
			});
		};
	}
});
export { U as default };
