import { t as e } from "./GuardianAssignments-9aTtwmtc.js";
import { s as t } from "./access-Dcd3BQGu.js";
import { computed as n, createBlock as r, createVNode as i, defineComponent as a, openBlock as o, unref as s, withCtx as c } from "vue";
import { AtriumIntegrationScreen as l, useAtriumScreen as u, useHead as d } from "@refactor-circus/atrium";
import { UDashboardNavbar as f, UDashboardPanel as p } from "@refactor-circus/atrium/ui";
import { useI18n as m } from "vue-i18n";
// src/pages/role-assignments/index.vue
var h = /* @__PURE__ */ a({
	__name: "index",
	setup(a) {
		let { t: h } = m();
		d({ title: () => h("guardian.access.assignments.title") });
		let { data: g } = u("guardian.role-assignments"), _ = n(() => t(g.value?.data.options));
		return (t, n) => {
			let a = f, u = l, d = p;
			return o(), r(d, null, {
				header: c(() => [i(a, { title: s(h)("guardian.access.assignments.title") }, null, 8, ["title"])]),
				body: c(() => [i(u, { "screen-key": "guardian.role-assignments" }, {
					default: c(() => [i(e, {
						"scope-types": s(_),
						filters: ""
					}, null, 8, ["scope-types"])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { h as default };
