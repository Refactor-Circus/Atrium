import { t as e } from "./GuardianErrors-DOoU5vfA.js";
import { a as t, c as n, n as r, o as i, t as ee } from "./SsoConnectionFields-BBomoNqB.js";
import { t as te } from "./GuardianState-DjXU16rU.js";
import { c as a, d as o, o as s, u as c } from "./guardian-Dugz84u2.js";
import { Fragment as ne, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as re, openBlock as g, reactive as _, ref as ie, toDisplayString as v, unref as y, vModelCheckbox as b, watch as ae, withCtx as x, withDirectives as S, withModifiers as oe } from "vue";
import { AtriumIntegrationScreen as C, isExternalUrl as se, navigateTo as ce, useAtriumIntegration as le, useHead as ue } from "@refactor-circus/atrium";
import { useRoute as w } from "vue-router";
import { UButton as T, UCard as E, UDashboardNavbar as D, UDashboardPanel as O, UFormField as k, UInput as A } from "@refactor-circus/atrium/ui";
import { useI18n as j } from "vue-i18n";
// src/pages/sso-connections/[connection].vue?vue&type=script&setup=true&lang.ts
var M = {
	key: 0,
	class: "space-y-4",
	"data-testid": "guardian-sso-connection"
}, N = { class: "font-semibold" }, P = { class: "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[14rem_1fr]" }, F = { class: "text-muted" }, I = {
	class: "break-all font-mono text-xs",
	"data-testid": "guardian-sso-callback-url"
}, L = { class: "text-muted" }, R = {
	class: "break-all font-mono text-xs",
	"data-testid": "guardian-sso-metadata-url"
}, z = { class: "text-muted" }, B = { "data-testid": "guardian-sso-identities-count" }, V = { class: "font-semibold" }, H = { class: "flex flex-wrap gap-4 text-sm" }, de = { class: "flex items-center gap-1" }, fe = { class: "flex items-center gap-1" }, pe = { class: "flex items-center gap-1" }, me = { class: "flex items-center gap-3" }, he = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "guardian-sso-saved"
}, ge = { class: "space-y-2" }, U = /* @__PURE__ */ re({
	__name: "[connection]",
	setup(re) {
		let { t: U } = j(), _e = w(), W = c(), G = c(), ve = le("roster"), K = l(() => String(_e.params.connection)), { client: q, data: J, pending: ye, failed: be, status: xe, reload: Y } = o(async (e) => s(await e.GET("/sso-connections/{connection}", { params: { path: { connection: K.value } } })).data, K);
		ue({ title: () => J.value?.name ?? U("guardian.sso.connection.title") });
		let X = l(() => ve.active && J.value?.organization ? i(J.value.organization) : null), Z = _({
			name: "",
			enabled: !0,
			enforced: !1,
			jit: !0
		}), Q = _({}), $ = ie(!1);
		ae(J, (e) => {
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
			}))), $.value && await Y());
		}
		async function Ce() {
			let e = J.value;
			if (!q || !e || !window.confirm(U("guardian.sso.connection.confirm_delete", { name: e.name }))) return;
			let t = X.value;
			await G.run(async () => s(await q.DELETE("/sso-connections/{connection}", { params: { path: { connection: e.slug } } }))) && await ce(t ?? "/");
		}
		return (t, n) => {
			let r = T, i = D, a = E, o = A, s = k, c = C, l = O;
			return g(), u(l, null, {
				header: x(() => [h(i, { title: y(J)?.name ?? y(U)("guardian.sso.connection.title") }, {
					leading: x(() => [y(X) ? (g(), u(r, {
						key: 0,
						to: y(X),
						variant: "ghost",
						icon: "i-lucide-arrow-left",
						"aria-label": y(U)("guardian.sso.connection.back"),
						"data-testid": "guardian-sso-back"
					}, null, 8, ["to", "aria-label"])) : d("", !0)]),
					_: 1
				}, 8, ["title"])]),
				body: x(() => [h(c, {
					"screen-key": "guardian.sso-connection",
					record: y(K)
				}, {
					default: x(() => [h(te, {
						ready: !y(ye) && y(J) !== null,
						failed: y(be),
						status: y(xe),
						"not-found": y(U)("guardian.sso.connection.not_found")
					}, {
						default: x(() => [y(J) ? (g(), f("div", M, [
							h(a, null, {
								header: x(() => [p("h2", N, v(y(U)(`guardian.sso.protocols.${y(J).protocol}`, y(J).protocol)) + " · " + v(y(J).organization), 1)]),
								default: x(() => [p("dl", P, [
									p("dt", F, v(y(U)("guardian.sso.connection.callback_url")), 1),
									p("dd", I, v(y(J).callback_url ?? "—"), 1),
									y(J).metadata_url ? (g(), f(ne, { key: 0 }, [p("dt", L, v(y(U)("guardian.sso.connection.metadata_url")), 1), p("dd", R, v(y(J).metadata_url), 1)], 64)) : d("", !0),
									p("dt", z, v(y(U)("guardian.sso.identities.title")), 1),
									p("dd", B, v(y(J).identities_count ?? "—"), 1)
								]), y(J).sign_in_url && y(se)(y(J).sign_in_url) ? (g(), u(r, {
									key: 0,
									to: y(J).sign_in_url,
									external: "",
									target: "_blank",
									rel: "noopener",
									class: "mt-3",
									variant: "ghost",
									icon: "i-lucide-external-link",
									"data-testid": "guardian-sso-test-sign-in"
								}, {
									default: x(() => [m(v(y(U)("guardian.sso.connection.test_sign_in")), 1)]),
									_: 1
								}, 8, ["to"])) : d("", !0)]),
								_: 1
							}),
							h(a, null, {
								header: x(() => [p("h2", V, v(y(U)("guardian.sso.connection.settings")), 1)]),
								default: x(() => [p("form", {
									class: "max-w-3xl space-y-4",
									"data-testid": "guardian-sso-form",
									onSubmit: oe(Se, ["prevent"])
								}, [
									h(s, {
										label: y(U)("guardian.sso.fields.name"),
										error: y(W).error("name"),
										required: ""
									}, {
										default: x(() => [h(o, {
											modelValue: y(Z).name,
											"onUpdate:modelValue": n[0] ||= (e) => y(Z).name = e,
											class: "w-72",
											"data-testid": "guardian-sso-name"
										}, null, 8, ["modelValue"])]),
										_: 1
									}, 8, ["label", "error"]),
									h(ee, {
										protocol: y(J).protocol,
										values: y(Q),
										action: y(W),
										editing: "",
										testid: "guardian-sso"
									}, null, 8, [
										"protocol",
										"values",
										"action"
									]),
									p("div", H, [
										p("label", de, [S(p("input", {
											"onUpdate:modelValue": n[1] ||= (e) => y(Z).jit = e,
											type: "checkbox",
											"data-testid": "guardian-sso-jit"
										}, null, 512), [[b, y(Z).jit]]), m(" " + v(y(U)("guardian.sso.fields.jit")), 1)]),
										p("label", fe, [S(p("input", {
											"onUpdate:modelValue": n[2] ||= (e) => y(Z).enforced = e,
											type: "checkbox",
											"data-testid": "guardian-sso-enforced"
										}, null, 512), [[b, y(Z).enforced]]), m(" " + v(y(U)("guardian.sso.fields.enforced")), 1)]),
										p("label", pe, [S(p("input", {
											"onUpdate:modelValue": n[3] ||= (e) => y(Z).enabled = e,
											type: "checkbox",
											"data-testid": "guardian-sso-enabled"
										}, null, 512), [[b, y(Z).enabled]]), m(" " + v(y(U)("guardian.sso.fields.enabled")), 1)])
									]),
									Object.keys(y(W).errors.value).length === 0 ? (g(), u(e, {
										key: 0,
										action: y(W),
										testid: "guardian-sso-save"
									}, null, 8, ["action"])) : d("", !0),
									p("div", me, [h(r, {
										type: "submit",
										icon: "i-lucide-check",
										loading: y(W).busy.value,
										"data-testid": "guardian-sso-save"
									}, {
										default: x(() => [m(v(y(U)("guardian.sso.save")), 1)]),
										_: 1
									}, 8, ["loading"]), y($) ? (g(), f("span", he, v(y(U)("guardian.sso.saved")), 1)) : d("", !0)])
								], 32)]),
								_: 1
							}),
							p("div", ge, [h(r, {
								color: "error",
								variant: "soft",
								icon: "i-lucide-trash",
								"data-testid": "guardian-sso-delete",
								onClick: Ce
							}, {
								default: x(() => [m(v(y(U)("guardian.sso.connection.delete")), 1)]),
								_: 1
							}), h(e, {
								action: y(G),
								testid: "guardian-sso-delete"
							}, null, 8, ["action"])])
						])) : d("", !0)]),
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
