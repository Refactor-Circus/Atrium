import { t as e } from "./CortexAgentForm-DdgfEbYS.js";
import { t } from "./CortexPage-CtJD4yvP.js";
import { createBlock as n, createVNode as r, defineComponent as i, openBlock as a, unref as o, withCtx as s } from "vue";
import { useI18n as c } from "vue-i18n";
import { useRouter as l } from "vue-router";
// src/pages/virtual-agents/create.vue
var u = /* @__PURE__ */ i({
	__name: "create",
	setup(i) {
		let { t: u } = c(), d = l();
		function f(e) {
			d.push(`/cortex/virtual-agents/${e.slug}`);
		}
		return (i, c) => (a(), n(t, {
			title: o(u)("cortex.virtual_agents.new"),
			"screen-key": "cortex.virtual-agent-create",
			back: {
				to: "/cortex/virtual-agents",
				label: o(u)("cortex.virtual_agents.title")
			}
		}, {
			default: s(() => [r(e, {
				agent: null,
				onSaved: f
			})]),
			_: 1
		}, 8, ["title", "back"]));
	}
});
export { u as default };
