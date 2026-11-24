import { AtriumNoAccess as e } from "@refactor-circus/atrium";
import { UAlert as t } from "@refactor-circus/atrium/ui";
import { createBlock as n, createCommentVNode as r, defineComponent as i, openBlock as a, unref as o } from "vue";
import { useI18n as s } from "vue-i18n";
// src/components/CortexActionError.vue
var c = /* @__PURE__ */ i({
	__name: "CortexActionError",
	props: {
		forbidden: { type: Boolean },
		message: {}
	},
	setup(i) {
		let { t: c } = s();
		return (s, l) => {
			let u = e, d = t;
			return i.forbidden ? (a(), n(u, {
				key: 0,
				compact: "",
				title: o(c)("cortex.state.action_forbidden")
			}, null, 8, ["title"])) : i.message ? (a(), n(d, {
				key: 1,
				color: "error",
				variant: "subtle",
				title: i.message,
				"data-testid": "cortex-action-error"
			}, null, 8, ["title"])) : r("", !0);
		};
	}
});
export { c as t };
