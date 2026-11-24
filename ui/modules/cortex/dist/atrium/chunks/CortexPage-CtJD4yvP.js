import { AtriumIntegrationScreen as e, useHead as t } from "@refactor-circus/atrium";
import { UButton as n, UDashboardNavbar as r, UDashboardPanel as i } from "@refactor-circus/atrium/ui";
import { createBlock as a, createCommentVNode as o, createElementBlock as s, createSlots as c, createVNode as l, defineComponent as u, openBlock as d, renderSlot as f, toDisplayString as p, withCtx as m } from "vue";
// src/components/CortexPage.vue?vue&type=script&setup=true&lang.ts
var h = {
	key: 0,
	class: "mb-4 text-sm text-muted"
}, g = /* @__PURE__ */ u({
	__name: "CortexPage",
	props: {
		title: {},
		screenKey: {},
		record: {},
		description: {},
		back: {}
	},
	setup(u) {
		let g = u;
		return t({ title: () => g.title }), (t, g) => {
			let _ = n, v = r, y = e, b = i;
			return d(), a(b, null, {
				header: m(() => [l(v, { title: u.title }, c({
					right: m(() => [f(t.$slots, "actions")]),
					_: 2
				}, [u.back ? {
					name: "leading",
					fn: m(() => [l(_, {
						to: u.back.to,
						icon: "i-lucide-arrow-left",
						color: "neutral",
						variant: "ghost",
						"aria-label": u.back.label,
						"data-testid": "cortex-back"
					}, null, 8, ["to", "aria-label"])]),
					key: "0"
				} : void 0]), 1032, ["title"])]),
				body: m(() => [u.description ? (d(), s("p", h, p(u.description), 1)) : o("", !0), l(y, {
					"screen-key": u.screenKey,
					record: u.record ?? null
				}, {
					default: m(() => [f(t.$slots, "default")]),
					_: 3
				}, 8, ["screen-key", "record"])]),
				_: 3
			});
		};
	}
});
export { g as t };
