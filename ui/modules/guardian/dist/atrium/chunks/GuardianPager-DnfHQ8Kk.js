import { createCommentVNode as e, createElementBlock as t, createElementVNode as n, createTextVNode as r, createVNode as i, defineComponent as a, openBlock as o, toDisplayString as s, unref as c, withCtx as l } from "vue";
import { UButton as u } from "@refactor-circus/atrium/ui";
import { useI18n as d } from "vue-i18n";
// src/components/access/GuardianPager.vue?vue&type=script&setup=true&lang.ts
var f = {
	key: 0,
	class: "flex items-center gap-3 text-sm"
}, p = ["data-testid"], m = /* @__PURE__ */ a({
	__name: "GuardianPager",
	props: {
		current: {},
		last: {},
		testid: {}
	},
	emits: ["go"],
	setup(a, { emit: m }) {
		let h = a, g = m, { t: _ } = d();
		return (d, m) => {
			let v = u;
			return h.last > 1 ? (o(), t("div", f, [
				i(v, {
					variant: "outline",
					size: "sm",
					icon: "i-lucide-chevron-left",
					disabled: h.current <= 1,
					"data-testid": `${a.testid}-prev`,
					onClick: m[0] ||= (e) => g("go", h.current - 1)
				}, {
					default: l(() => [r(s(c(_)("guardian.access.pager.previous")), 1)]),
					_: 1
				}, 8, ["disabled", "data-testid"]),
				n("span", {
					class: "text-muted",
					"data-testid": `${a.testid}-page`
				}, s(c(_)("guardian.access.pager.page", {
					current: h.current,
					last: h.last
				})), 9, p),
				i(v, {
					variant: "outline",
					size: "sm",
					"trailing-icon": "i-lucide-chevron-right",
					disabled: h.current >= h.last,
					"data-testid": `${a.testid}-next`,
					onClick: m[1] ||= (e) => g("go", h.current + 1)
				}, {
					default: l(() => [r(s(c(_)("guardian.access.pager.next")), 1)]),
					_: 1
				}, 8, ["disabled", "data-testid"])
			])) : e("", !0);
		};
	}
});
export { m as t };
