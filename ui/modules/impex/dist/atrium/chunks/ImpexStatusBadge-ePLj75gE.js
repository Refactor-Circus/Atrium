import { v as e } from "./shared-N5-QMPBo.js";
import { UBadge as t } from "@refactor-circus/atrium/ui";
import { computed as n, createBlock as r, createTextVNode as i, defineComponent as a, openBlock as o, toDisplayString as s, unref as c, withCtx as l } from "vue";
import { useI18n as u } from "vue-i18n";
// src/components/ImpexStatusBadge.vue
var d = /* @__PURE__ */ a({
	__name: "ImpexStatusBadge",
	props: { status: {} },
	setup(a) {
		let d = a, { t: f, te: p } = u(), m = n(() => {
			let e = `impex.statuses.${d.status ?? ""}`;
			return d.status && p(e) ? f(e) : d.status ?? "—";
		});
		return (n, u) => {
			let d = t;
			return o(), r(d, {
				color: c(e)(a.status),
				variant: "subtle",
				"data-status": a.status ?? void 0
			}, {
				default: l(() => [i(s(c(m)), 1)]),
				_: 1
			}, 8, ["color", "data-status"]);
		};
	}
});
export { d as t };
