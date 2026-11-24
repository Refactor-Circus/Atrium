import { a as e, t } from "./cortex-Bp7gHDgF.js";
import { t as n } from "./CortexLoad-Bz-c2t3K.js";
import { t as r } from "./CortexPage-CtJD4yvP.js";
import { UBadge as i, UButton as a } from "@refactor-circus/atrium/ui";
import { Fragment as o, computed as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createVNode as f, defineComponent as p, openBlock as m, renderList as h, toDisplayString as g, unref as _, withCtx as v } from "vue";
import { useI18n as y } from "vue-i18n";
// src/pages/servers/index.vue?vue&type=script&setup=true&lang.ts
var b = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "cortex-empty"
}, x = {
	key: 1,
	class: "w-full text-sm",
	"data-testid": "cortex-servers"
}, S = { class: "text-left text-muted" }, C = { class: "py-2" }, w = { class: "py-2" }, T = { class: "py-2 text-right" }, E = { class: "divide-y divide-default" }, D = ["data-testid"], O = { class: "py-2" }, k = { class: "text-xs" }, A = { class: "py-2" }, j = { class: "flex flex-wrap items-center gap-2" }, M = { class: "py-2 text-right" }, N = /* @__PURE__ */ p({
	__name: "index",
	setup(p) {
		let { t: N } = y(), { data: P, pending: F, failed: I, status: L } = e(async (e) => t(await e.GET("/servers")).data), R = s(() => P.value ?? []);
		return (e, t) => {
			let s = i, p = a;
			return m(), c(r, {
				title: _(N)("cortex.servers.title"),
				"screen-key": "cortex.servers"
			}, {
				default: v(() => [f(n, {
					ready: !_(F),
					failed: _(I),
					status: _(L)
				}, {
					default: v(() => [_(R).length === 0 ? (m(), u("p", b, g(_(N)("cortex.servers.empty")), 1)) : (m(), u("table", x, [d("thead", S, [d("tr", null, [
						d("th", C, g(_(N)("cortex.agent.name")), 1),
						d("th", w, g(_(N)("cortex.agent.tools")), 1),
						d("th", T, g(_(N)("cortex.actions")), 1)
					])]), d("tbody", E, [(m(!0), u(o, null, h(_(R), (e) => (m(), u("tr", {
						key: e.name,
						"data-testid": `cortex-server-${e.name}`
					}, [
						d("td", O, [d("code", k, g(e.name), 1)]),
						d("td", A, [d("div", j, [
							d("span", null, g(_(N)("cortex.tools.count", { count: e.tools.length })), 1),
							e.tools_overridden ? (m(), c(s, {
								key: 0,
								color: "success",
								variant: "subtle",
								label: _(N)("cortex.tools.overridden")
							}, null, 8, ["label"])) : l("", !0),
							e.missing_tools.length ? (m(), c(s, {
								key: 1,
								color: "warning",
								variant: "subtle",
								label: _(N)("cortex.servers.missing_tools", { tools: e.missing_tools.join(", ") }),
								"data-testid": "cortex-missing-tools"
							}, null, 8, ["label"])) : l("", !0)
						])]),
						d("td", M, [f(p, {
							size: "xs",
							variant: "outline",
							icon: "i-lucide-file-text",
							to: `/cortex/servers/${e.name}/instructions`,
							label: _(N)("cortex.servers.edit_instructions"),
							"data-testid": `cortex-instructions-${e.name}`
						}, null, 8, [
							"to",
							"label",
							"data-testid"
						])])
					], 8, D))), 128))])]))]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, ["title"]);
		};
	}
});
export { N as default };
