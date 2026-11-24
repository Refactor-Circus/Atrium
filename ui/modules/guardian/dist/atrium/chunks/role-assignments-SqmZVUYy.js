import { t as e } from "./GuardianAssignments-CabyQgcA.js";
import { s as t } from "./access-CMUXpA7X.js";
import { AtriumIntegrationScreen as n, useAtriumScreen as r, useHead as i } from "@refactor-circus/atrium";
import { computed as a, createBlock as o, createVNode as s, defineComponent as c, openBlock as l, unref as u, withCtx as d } from "vue";
import { UDashboardNavbar as f, UDashboardPanel as p } from "@refactor-circus/atrium/ui";
import { useI18n as m } from "vue-i18n";
// src/pages/role-assignments/index.vue
var h = /* @__PURE__ */ c({
	__name: "index",
	setup(c) {
		let { t: h } = m();
		i({ title: () => h("guardian.access.assignments.title") });
		let { data: g } = r("guardian.role-assignments"), _ = a(() => t(g.value?.data.options));
		return (t, r) => {
			let i = f, a = n, c = p;
			return l(), o(c, null, {
				header: d(() => [s(i, { title: u(h)("guardian.access.assignments.title") }, null, 8, ["title"])]),
				body: d(() => [s(a, { "screen-key": "guardian.role-assignments" }, {
					default: d(() => [s(e, {
						"scope-types": u(_),
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
