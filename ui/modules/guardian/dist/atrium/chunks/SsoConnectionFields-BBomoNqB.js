import { Fragment as e, computed as t, createBlock as n, createElementBlock as r, defineComponent as i, normalizeClass as a, openBlock as o, renderList as s, unref as c, withCtx as l } from "vue";
import { UFormField as u, UInput as d, UTextarea as f } from "@refactor-circus/atrium/ui";
import { useI18n as p } from "vue-i18n";
// src/components/sso/sso.ts
var m = [
	"oidc",
	"azure",
	"saml"
], h = {
	oidc: [
		"issuer",
		"client_id",
		"client_secret"
	],
	azure: [
		"tenant",
		"client_id",
		"client_secret"
	],
	saml: [
		"metadata_url",
		"entity_id",
		"sso_url",
		"certificate"
	]
}, g = ["client_secret", "certificate"];
function _(e) {
	return m.includes(e) ? h[e] : [];
}
function v(e, t, n = !1) {
	let r = {};
	for (let i of _(e)) {
		let e = (t[i] ?? "").trim();
		e === "" ? n && !g.includes(i) && (r[i] = null) : r[i] = e;
	}
	return r;
}
function y(e) {
	return `/guardian/sso-connections/${encodeURIComponent(e)}`;
}
function b(e) {
	return `/roster/organizations/${encodeURIComponent(e)}?tab=guardian.sso`;
}
function x(e, t, n) {
	if (!e) return null;
	let r;
	try {
		r = new URL(e).origin;
	} catch {
		return null;
	}
	let i = typeof t == "string" && t.replace(/^\/+|\/+$/g, "") !== "" ? `/${t.replace(/^\/+|\/+$/g, "")}` : "/scim/v2";
	return `${r}${i}/${encodeURIComponent(n)}`;
}
// src/components/sso/SsoConnectionFields.vue?vue&type=script&setup=true&lang.ts
var S = ["data-testid"], C = /* @__PURE__ */ i({
	__name: "SsoConnectionFields",
	props: {
		protocol: {},
		values: {},
		action: {},
		editing: { type: Boolean },
		testid: {}
	},
	setup(i) {
		let m = i, { t: h } = p(), g = t(() => _(m.protocol));
		return (t, p) => {
			let m = f, _ = d, v = u;
			return o(), r("div", {
				class: "grid gap-3 sm:grid-cols-2",
				"data-testid": `${i.testid}-fields`
			}, [(o(!0), r(e, null, s(c(g), (e) => (o(), n(v, {
				key: e,
				class: a(e === "certificate" ? "sm:col-span-2" : void 0),
				label: c(h)(`guardian.sso.fields.${e}`),
				hint: e === "tenant" ? c(h)("guardian.sso.tenant_hint") : i.editing && (e === "client_secret" || e === "certificate") ? c(h)("guardian.sso.secret_hint") : void 0,
				error: i.action.error(e)
			}, {
				default: l(() => [e === "certificate" ? (o(), n(m, {
					key: 0,
					modelValue: i.values[e],
					"onUpdate:modelValue": (t) => i.values[e] = t,
					rows: 3,
					class: "w-full font-mono",
					"data-testid": `${i.testid}-${e}`
				}, null, 8, [
					"modelValue",
					"onUpdate:modelValue",
					"data-testid"
				])) : (o(), n(_, {
					key: 1,
					modelValue: i.values[e],
					"onUpdate:modelValue": (t) => i.values[e] = t,
					type: e === "client_secret" ? "password" : "text",
					autocomplete: e === "client_secret" ? "new-password" : "off",
					class: "w-full",
					"data-testid": `${i.testid}-${e}`
				}, null, 8, [
					"modelValue",
					"onUpdate:modelValue",
					"type",
					"autocomplete",
					"data-testid"
				]))]),
				_: 2
			}, 1032, [
				"class",
				"label",
				"hint",
				"error"
			]))), 128))], 8, S);
		};
	}
});
export { _ as a, v as c, y as i, g as n, b as o, m as r, x as s, C as t };
