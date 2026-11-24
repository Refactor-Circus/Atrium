import { AtriumErrorCard as e, AtriumNoAccess as t } from "@refactor-circus/atrium";
import { UAlert as n } from "@refactor-circus/atrium/ui";
import { Fragment as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, defineComponent as c, openBlock as l, renderList as u, toDisplayString as d, unref as f } from "vue";
import { useI18n as p } from "vue-i18n";
// src/components/ImpexFlash.vue?vue&type=script&setup=true&lang.ts
var m = {
	key: 0,
	class: "space-y-2"
}, h = {
	key: 3,
	class: "space-y-1 rounded-md border border-error/40 p-3 text-sm text-error",
	role: "alert",
	"data-testid": "impex-field-errors"
}, g = ["data-field"], _ = /* @__PURE__ */ c({
	__name: "ImpexFlash",
	props: { action: {} },
	setup(c) {
		let _ = c, { t: v } = p(), y = i(() => _.action.notice.value), b = i(() => _.action.failure.value), x = i(() => _.action.forbidden.value), S = i(() => Object.entries(_.action.errors.value));
		return (i, c) => {
			let p = n, _ = t, C = e;
			return f(y) || f(b) || f(x) || f(S).length ? (l(), s("div", m, [
				f(y) ? (l(), a(p, {
					key: 0,
					color: "success",
					variant: "subtle",
					title: f(y),
					"data-testid": "impex-notice"
				}, null, 8, ["title"])) : o("", !0),
				f(x) ? (l(), a(_, {
					key: 1,
					compact: "",
					description: f(v)("impex.common.action_forbidden")
				}, null, 8, ["description"])) : o("", !0),
				f(b) ? (l(), a(C, {
					key: 2,
					message: f(b)
				}, null, 8, ["message"])) : o("", !0),
				f(S).length ? (l(), s("ul", h, [(l(!0), s(r, null, u(f(S), ([e, t]) => (l(), s("li", {
					key: e,
					"data-field": e
				}, d(t.join(" ")), 9, g))), 128))])) : o("", !0)
			])) : o("", !0);
		};
	}
});
export { _ as t };
