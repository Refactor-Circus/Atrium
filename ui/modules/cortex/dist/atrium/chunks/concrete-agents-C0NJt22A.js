import { a as e, t } from "./cortex-Bp7gHDgF.js";
import { t as n } from "./CortexLoad-Bz-c2t3K.js";
import { t as r } from "./CortexPage-CtJD4yvP.js";
import { UBadge as i, UButton as a } from "@refactor-circus/atrium/ui";
import { Fragment as o, computed as s, createBlock as c, createElementBlock as l, createElementVNode as u, createTextVNode as d, createVNode as f, defineComponent as p, openBlock as m, renderList as h, resolveComponent as g, toDisplayString as _, unref as v, withCtx as y } from "vue";
import { useI18n as b } from "vue-i18n";
// src/pages/concrete-agents/index.vue?vue&type=script&setup=true&lang.ts
var x = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "cortex-empty"
}, S = {
	key: 1,
	class: "w-full text-sm",
	"data-testid": "cortex-concrete-agents"
}, C = { class: "text-left text-muted" }, w = { class: "py-2" }, T = { class: "py-2" }, E = { class: "py-2" }, D = { class: "py-2 text-right" }, O = { class: "divide-y divide-default" }, k = ["data-testid"], A = { class: "py-2" }, j = { class: "py-2" }, M = { class: "py-2" }, N = {
	key: 1,
	class: "text-muted"
}, P = { class: "py-2" }, F = { class: "flex justify-end gap-2" }, I = /* @__PURE__ */ p({
	__name: "index",
	setup(p) {
		let { t: I } = b(), { data: L, pending: R, failed: z, status: B } = e(async (e) => t(await e.GET("/concrete-agents")).data), V = s(() => L.value ?? []);
		return (e, t) => {
			let s = g("RouterLink"), p = i, b = a;
			return m(), c(r, {
				title: v(I)("cortex.concrete_agents.title"),
				"screen-key": "cortex.concrete-agents",
				description: v(I)("cortex.concrete_agents.description")
			}, {
				default: y(() => [f(n, {
					ready: !v(R),
					failed: v(z),
					status: v(B)
				}, {
					default: y(() => [v(V).length === 0 ? (m(), l("p", x, _(v(I)("cortex.concrete_agents.empty")), 1)) : (m(), l("table", S, [u("thead", C, [u("tr", null, [
						u("th", w, _(v(I)("cortex.agent.name")), 1),
						u("th", T, _(v(I)("cortex.agent.prompt")), 1),
						u("th", E, _(v(I)("cortex.agent.tools")), 1),
						u("th", D, _(v(I)("cortex.actions")), 1)
					])]), u("tbody", O, [(m(!0), l(o, null, h(v(V), (e) => (m(), l("tr", {
						key: e.name,
						"data-testid": `cortex-agent-${e.name}`
					}, [
						u("td", A, [f(s, {
							to: `/cortex/concrete-agents/${e.name}`,
							class: "font-medium hover:underline"
						}, {
							default: y(() => [d(_(e.name), 1)]),
							_: 2
						}, 1032, ["to"])]),
						u("td", j, [e.published_version === null ? (m(), c(p, {
							key: 1,
							color: "neutral",
							variant: "subtle",
							label: v(I)("cortex.versions.from_code"),
							"data-status": "from_code"
						}, null, 8, ["label"])) : (m(), c(p, {
							key: 0,
							color: "success",
							variant: "subtle",
							label: v(I)("cortex.versions.overridden", { version: e.published_version }),
							"data-status": "overridden"
						}, null, 8, ["label"]))]),
						u("td", M, [e.tools_overridden ? (m(), c(p, {
							key: 0,
							color: "success",
							variant: "subtle",
							label: v(I)("cortex.tools.overridden")
						}, null, 8, ["label"])) : (m(), l("span", N, _(v(I)("cortex.tools.count", { count: e.tools.length })), 1))]),
						u("td", P, [u("div", F, [f(b, {
							size: "xs",
							variant: "outline",
							icon: "i-lucide-pencil",
							to: `/cortex/concrete-agents/${e.name}`,
							label: v(I)("cortex.edit")
						}, null, 8, ["to", "label"]), f(b, {
							size: "xs",
							variant: "outline",
							icon: "i-lucide-play",
							to: `/cortex/run?agent=concrete:${e.name}`,
							label: v(I)("cortex.run.run"),
							"data-testid": `cortex-run-${e.name}`
						}, null, 8, [
							"to",
							"label",
							"data-testid"
						])])])
					], 8, k))), 128))])]))]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, ["title", "description"]);
		};
	}
});
export { I as default };
