import { AtriumErrorCard as e, AtriumNoAccess as t, atriumStatus as n } from "@refactor-circus/atrium";
import { USkeleton as r } from "@refactor-circus/atrium/ui";
import { computed as i, createBlock as a, createElementBlock as o, createElementVNode as s, defineComponent as c, openBlock as l, renderSlot as u, toDisplayString as d, unref as f } from "vue";
import { useI18n as p } from "vue-i18n";
// src/components/ImpexState.vue?vue&type=script&setup=true&lang.ts
var m = {
	key: 1,
	class: "rounded-md border border-default p-4 text-sm",
	role: "status",
	"data-testid": "impex-not-found"
}, h = { class: "font-medium" }, g = { class: "text-muted" }, _ = /* @__PURE__ */ c({
	__name: "ImpexState",
	props: {
		error: {},
		ready: { type: Boolean }
	},
	setup(c) {
		let _ = c, { t: v } = p(), y = i(() => n(_.error));
		return (n, i) => {
			let p = t, _ = e, b = r;
			return f(y) === 403 ? (l(), a(p, { key: 0 })) : f(y) === 404 ? (l(), o("div", m, [s("p", h, d(f(v)("impex.common.not_found_title")), 1), s("p", g, d(f(v)("impex.common.not_found_description")), 1)])) : c.error ? (l(), a(_, {
				key: 2,
				message: f(v)("impex.common.load_failed")
			}, null, 8, ["message"])) : c.ready ? u(n.$slots, "default", {}, void 0, void 0, 4) : (l(), a(b, {
				key: 3,
				class: "h-24"
			}));
		};
	}
});
export { _ as t };
