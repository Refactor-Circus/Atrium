import { createBlock as e, createCommentVNode as t, defineComponent as n, openBlock as r, unref as i } from "vue";
import { AtriumNoAccess as a } from "@refactor-circus/atrium";
import { UAlert as o } from "@refactor-circus/atrium/ui";
import { useI18n as s } from "vue-i18n";
// src/components/two-factor/GuardianActionError.vue
var c = /* @__PURE__ */ n({
	__name: "GuardianActionError",
	props: { action: {} },
	setup(n) {
		let { t: c } = s();
		return (s, l) => {
			let u = a, d = o;
			return n.action.forbidden.value ? (r(), e(u, {
				key: 0,
				compact: ""
			})) : n.action.status.value === 429 ? (r(), e(d, {
				key: 1,
				color: "warning",
				variant: "subtle",
				title: i(c)("guardian.two_factor.throttled"),
				description: n.action.retryAfter.value ? i(c)("guardian.two_factor.retry_after", { seconds: n.action.retryAfter.value }) : void 0,
				"data-testid": "guardian-throttled"
			}, null, 8, ["title", "description"])) : n.action.message.value ? (r(), e(d, {
				key: 2,
				color: "error",
				variant: "subtle",
				title: n.action.message.value,
				"data-testid": "guardian-action-error"
			}, null, 8, ["title"])) : t("", !0);
		};
	}
});
export { c as t };
