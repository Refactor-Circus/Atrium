import { AtriumErrorCard as e, AtriumNoAccess as t } from "@refactor-circus/atrium";
import { createBlock as n, defineComponent as r, openBlock as i, renderSlot as a, unref as o } from "vue";
import { UAlert as s, USkeleton as c } from "@refactor-circus/atrium/ui";
import { useI18n as l } from "vue-i18n";
// src/components/two-factor/GuardianState.vue
var u = /* @__PURE__ */ r({
	__name: "GuardianState",
	props: {
		ready: { type: Boolean },
		failed: { type: Boolean },
		status: {},
		compact: { type: Boolean },
		notFound: {}
	},
	setup(r) {
		let { t: u } = l();
		return (l, d) => {
			let f = t, p = s, m = e, h = c;
			return r.failed && r.status === 403 ? (i(), n(f, {
				key: 0,
				compact: r.compact
			}, null, 8, ["compact"])) : r.failed && r.status === 404 ? (i(), n(p, {
				key: 1,
				color: "neutral",
				variant: "subtle",
				icon: "i-lucide-search-x",
				title: r.notFound ?? o(u)("guardian.state.not_found"),
				"data-testid": "guardian-not-found"
			}, null, 8, ["title"])) : r.failed ? (i(), n(m, {
				key: 2,
				message: o(u)("guardian.state.load_failed")
			}, null, 8, ["message"])) : r.ready ? a(l.$slots, "default", {}, void 0, void 0, 3) : (i(), n(h, {
				key: 4,
				class: "h-24",
				"data-testid": "guardian-loading"
			}));
		};
	}
});
export { u as t };
