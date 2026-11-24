import { AtriumNoAccess as e } from "@refactor-circus/atrium";
import { createBlock as t, createCommentVNode as n, defineComponent as r, openBlock as i, unref as a } from "vue";
import { UAlert as o } from "@refactor-circus/atrium/ui";
import { useI18n as s } from "vue-i18n";
// src/components/two-factor/GuardianActionError.vue
var c = /* @__PURE__ */ r({
	__name: "GuardianActionError",
	props: { action: {} },
	setup(r) {
		let { t: c } = s();
		return (s, l) => {
			let u = e, d = o;
			return r.action.forbidden.value ? (i(), t(u, {
				key: 0,
				compact: ""
			})) : r.action.status.value === 429 ? (i(), t(d, {
				key: 1,
				color: "warning",
				variant: "subtle",
				title: a(c)("guardian.two_factor.throttled"),
				description: r.action.retryAfter.value ? a(c)("guardian.two_factor.retry_after", { seconds: r.action.retryAfter.value }) : void 0,
				"data-testid": "guardian-throttled"
			}, null, 8, ["title", "description"])) : r.action.message.value ? (i(), t(d, {
				key: 2,
				color: "error",
				variant: "subtle",
				title: r.action.message.value,
				"data-testid": "guardian-action-error"
			}, null, 8, ["title"])) : n("", !0);
		};
	}
});
export { c as t };
