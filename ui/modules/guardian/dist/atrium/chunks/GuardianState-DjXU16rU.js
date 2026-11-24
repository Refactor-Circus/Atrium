import { createBlock as e, defineComponent as t, openBlock as n, renderSlot as r, unref as i } from "vue";
import { AtriumErrorCard as a, AtriumNoAccess as o } from "@refactor-circus/atrium";
import { UAlert as s, USkeleton as c } from "@refactor-circus/atrium/ui";
import { useI18n as l } from "vue-i18n";
// src/components/two-factor/GuardianState.vue
var u = /* @__PURE__ */ t({
	__name: "GuardianState",
	props: {
		ready: { type: Boolean },
		failed: { type: Boolean },
		status: {},
		compact: { type: Boolean },
		notFound: {}
	},
	setup(t) {
		let { t: u } = l();
		return (l, d) => {
			let f = o, p = s, m = a, h = c;
			return t.failed && t.status === 403 ? (n(), e(f, {
				key: 0,
				compact: t.compact
			}, null, 8, ["compact"])) : t.failed && t.status === 404 ? (n(), e(p, {
				key: 1,
				color: "neutral",
				variant: "subtle",
				icon: "i-lucide-search-x",
				title: t.notFound ?? i(u)("guardian.state.not_found"),
				"data-testid": "guardian-not-found"
			}, null, 8, ["title"])) : t.failed ? (n(), e(m, {
				key: 2,
				message: i(u)("guardian.state.load_failed")
			}, null, 8, ["message"])) : t.ready ? r(l.$slots, "default", {}, void 0, void 0, 3) : (n(), e(h, {
				key: 4,
				class: "h-24",
				"data-testid": "guardian-loading"
			}));
		};
	}
});
export { u as t };
