import { t as e } from "./GuardianActionError-DKEMy_E4.js";
import { r as t } from "./access-CMUXpA7X.js";
import { Fragment as n, computed as r, createBlock as i, createElementBlock as a, createElementVNode as o, defineComponent as s, openBlock as c, renderList as l, toDisplayString as u, unref as d, withCtx as f } from "vue";
import { UAlert as p } from "@refactor-circus/atrium/ui";
// src/components/access/GuardianErrors.vue?vue&type=script&setup=true&lang.ts
var m = { class: "list-disc pl-4" }, h = /* @__PURE__ */ s({
	__name: "GuardianErrors",
	props: {
		action: {},
		testid: {}
	},
	setup(s) {
		let h = s, g = r(() => t(h.action));
		return (t, r) => {
			let h = p;
			return d(g).length > 0 ? (c(), i(h, {
				key: 0,
				color: "error",
				variant: "subtle",
				"data-testid": `${s.testid}-errors`
			}, {
				description: f(() => [o("ul", m, [(c(!0), a(n, null, l(d(g), (e) => (c(), a("li", { key: e }, u(e), 1))), 128))])]),
				_: 1
			}, 8, ["data-testid"])) : (c(), i(e, {
				key: 1,
				action: s.action
			}, null, 8, ["action"]));
		};
	}
});
export { h as t };
