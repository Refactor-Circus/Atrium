import { Fragment as e, createCommentVNode as t, createElementBlock as n, createElementVNode as r, defineComponent as i, mergeModels as a, openBlock as o, renderList as s, toDisplayString as c, unref as l, useModel as u, vModelCheckbox as d, withDirectives as f } from "vue";
import { useI18n as p } from "vue-i18n";
// src/components/access/GuardianRolePermissions.vue?vue&type=script&setup=true&lang.ts
var m = { class: "space-y-2" }, h = { class: "mb-1 text-sm font-medium" }, g = {
	key: 0,
	class: "text-sm text-muted"
}, _ = {
	key: 1,
	class: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
}, v = ["value", "data-testid"], y = {
	key: 2,
	class: "text-sm text-error"
}, b = /* @__PURE__ */ i({
	__name: "GuardianRolePermissions",
	props: /*@__PURE__*/ a({
		permissions: {},
		idPrefix: {},
		error: {}
	}, {
		modelValue: { required: !0 },
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(i) {
		let a = i, b = u(i, "modelValue"), { t: x } = p();
		return (i, u) => (o(), n("fieldset", m, [
			r("legend", h, c(l(x)("guardian.access.roles.fields.permissions")), 1),
			a.permissions.length === 0 ? (o(), n("p", g, c(l(x)("guardian.access.roles.no_permissions")), 1)) : (o(), n("div", _, [(o(!0), n(e, null, s(a.permissions, (e) => (o(), n("label", {
				key: e.name,
				class: "flex items-center gap-2 text-sm"
			}, [f(r("input", {
				"onUpdate:modelValue": u[0] ||= (e) => b.value = e,
				type: "checkbox",
				class: "accent-(--ui-primary)",
				value: e.name,
				"data-testid": `${a.idPrefix}-permission-${e.name}`
			}, null, 8, v), [[d, b.value]]), r("code", null, c(e.name), 1)]))), 128))])),
			a.error ? (o(), n("p", y, c(a.error), 1)) : t("", !0)
		]));
	}
});
export { b as t };
