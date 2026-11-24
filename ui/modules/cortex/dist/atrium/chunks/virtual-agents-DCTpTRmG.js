import { a as e, i as t, t as n } from "./cortex-Bp7gHDgF.js";
import { t as r } from "./CortexActionError-BnFnixGr.js";
import { t as i } from "./CortexLoad-Bz-c2t3K.js";
import { t as a } from "./CortexPage-CtJD4yvP.js";
import { UButton as o } from "@refactor-circus/atrium/ui";
import { Fragment as s, computed as c, createBlock as ee, createCommentVNode as te, createElementBlock as l, createElementVNode as u, createTextVNode as d, createVNode as f, defineComponent as ne, openBlock as p, renderList as m, resolveComponent as h, toDisplayString as g, unref as _, watch as re, withCtx as v } from "vue";
import { useI18n as y } from "vue-i18n";
import { useRoute as b, useRouter as x } from "vue-router";
// src/pages/virtual-agents/index.vue?vue&type=script&setup=true&lang.ts
var S = { class: "flex flex-col gap-4" }, C = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "cortex-empty"
}, w = {
	key: 1,
	class: "w-full text-sm",
	"data-testid": "cortex-virtual-agents"
}, T = { class: "text-left text-muted" }, E = { class: "py-2" }, D = { class: "py-2" }, O = { class: "py-2" }, k = { class: "py-2" }, A = { class: "py-2" }, j = { class: "py-2 text-right" }, M = { class: "divide-y divide-default" }, N = ["data-testid"], P = { class: "py-2" }, F = { class: "py-2" }, I = { class: "text-xs" }, L = { class: "py-2" }, ie = { class: "py-2" }, R = { class: "py-2" }, z = { class: "py-2" }, B = { class: "flex justify-end gap-2" }, V = {
	key: 2,
	class: "flex items-center gap-2",
	"data-testid": "cortex-pages"
}, H = { class: "text-sm text-muted" }, U = /* @__PURE__ */ ne({
	__name: "index",
	setup(ne) {
		let { t: U } = y(), W = b(), G = x(), K = t(), q = c(() => Math.max(1, Number(W.query.page) || 1)), { client: J, data: Y, pending: ae, failed: oe, status: se, reload: X } = e(async (e) => n(await e.GET("/virtual-agents", { params: { query: { page: q.value } } })));
		re(q, () => void X());
		let Z = c(() => Y.value?.data ?? []), Q = c(() => Y.value?.meta?.last_page ?? 1);
		function $(e) {
			G.push({ query: {
				...W.query,
				page: e > 1 ? String(e) : void 0
			} });
		}
		async function ce(e) {
			J && window.confirm(U("cortex.virtual_agents.confirm_delete")) && await K.run(async () => n(await J.DELETE("/virtual-agents/{agent}", { params: { path: { agent: e.slug } } }))) && await X();
		}
		return (e, t) => {
			let n = o, c = h("RouterLink");
			return p(), ee(a, {
				title: _(U)("cortex.virtual_agents.title"),
				"screen-key": "cortex.virtual-agents"
			}, {
				actions: v(() => [f(n, {
					to: "/cortex/virtual-agents/create",
					icon: "i-lucide-plus",
					label: _(U)("cortex.virtual_agents.new"),
					"data-testid": "cortex-new-agent"
				}, null, 8, ["label"])]),
				default: v(() => [f(i, {
					ready: !_(ae),
					failed: _(oe),
					status: _(se)
				}, {
					default: v(() => [u("div", S, [
						f(r, {
							forbidden: _(K).forbidden.value,
							message: _(K).message.value
						}, null, 8, ["forbidden", "message"]),
						_(Z).length === 0 ? (p(), l("p", C, g(_(U)("cortex.virtual_agents.empty")), 1)) : (p(), l("table", w, [u("thead", T, [u("tr", null, [
							u("th", E, g(_(U)("cortex.agent.name")), 1),
							u("th", D, g(_(U)("cortex.agent.slug")), 1),
							u("th", O, g(_(U)("cortex.agent.prompt")), 1),
							u("th", k, g(_(U)("cortex.agent.provider")), 1),
							u("th", A, g(_(U)("cortex.agent.model")), 1),
							u("th", j, g(_(U)("cortex.actions")), 1)
						])]), u("tbody", M, [(p(!0), l(s, null, m(_(Z), (e) => (p(), l("tr", {
							key: e.slug,
							"data-testid": `cortex-agent-${e.slug}`
						}, [
							u("td", P, [f(c, {
								to: `/cortex/virtual-agents/${e.slug}`,
								class: "font-medium hover:underline"
							}, {
								default: v(() => [d(g(e.name), 1)]),
								_: 2
							}, 1032, ["to"])]),
							u("td", F, [u("code", I, g(e.slug), 1)]),
							u("td", L, g(e.published_version ? `v${e.published_version}` : "—"), 1),
							u("td", ie, g(e.provider ?? "—"), 1),
							u("td", R, g(e.model ?? "—"), 1),
							u("td", z, [u("div", B, [
								f(n, {
									size: "xs",
									variant: "outline",
									icon: "i-lucide-pencil",
									to: `/cortex/virtual-agents/${e.slug}`,
									label: _(U)("cortex.edit"),
									"data-testid": `cortex-edit-${e.slug}`
								}, null, 8, [
									"to",
									"label",
									"data-testid"
								]),
								f(n, {
									size: "xs",
									variant: "outline",
									icon: "i-lucide-play",
									to: `/cortex/run?agent=virtual:${e.slug}`,
									label: _(U)("cortex.run.run"),
									"data-testid": `cortex-run-${e.slug}`
								}, null, 8, [
									"to",
									"label",
									"data-testid"
								]),
								f(n, {
									size: "xs",
									color: "error",
									variant: "outline",
									icon: "i-lucide-trash",
									label: _(U)("cortex.delete"),
									"data-testid": `cortex-delete-${e.slug}`,
									onClick: (t) => ce(e)
								}, null, 8, [
									"label",
									"data-testid",
									"onClick"
								])
							])])
						], 8, N))), 128))])])),
						_(Q) > 1 ? (p(), l("div", V, [
							f(n, {
								size: "xs",
								variant: "outline",
								icon: "i-lucide-chevron-left",
								disabled: _(q) <= 1,
								"aria-label": _(U)("cortex.previous"),
								"data-testid": "cortex-previous",
								onClick: t[0] ||= (e) => $(_(q) - 1)
							}, null, 8, ["disabled", "aria-label"]),
							u("span", H, g(_(U)("cortex.page", {
								page: _(q),
								last: _(Q)
							})), 1),
							f(n, {
								size: "xs",
								variant: "outline",
								icon: "i-lucide-chevron-right",
								disabled: _(q) >= _(Q),
								"aria-label": _(U)("cortex.next"),
								"data-testid": "cortex-next",
								onClick: t[1] ||= (e) => $(_(q) + 1)
							}, null, 8, ["disabled", "aria-label"])
						])) : te("", !0)
					])]),
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
export { U as default };
