import { a as e, i as t, t as n } from "./cortex-Bp7gHDgF.js";
import { t as r } from "./CortexActionError-BnFnixGr.js";
import { t as i } from "./CortexAgentForm-DdgfEbYS.js";
import { t as a } from "./CortexLoad-Bz-c2t3K.js";
import { t as o } from "./CortexPage-CtJD4yvP.js";
import { t as s } from "./CortexVersions-9-Zhh0G-.js";
import { UButton as c } from "@refactor-circus/atrium/ui";
import { computed as l, createBlock as u, createElementVNode as d, createVNode as f, defineComponent as p, openBlock as m, unref as h, withCtx as g } from "vue";
import { useI18n as _ } from "vue-i18n";
import { useRoute as v, useRouter as y } from "vue-router";
// src/pages/virtual-agents/[slug].vue?vue&type=script&setup=true&lang.ts
var b = { class: "flex flex-col gap-3" }, x = /* @__PURE__ */ p({
	__name: "[slug]",
	setup(p) {
		let { t: x } = _(), S = v(), C = y(), w = t(), T = l(() => String(S.params.slug)), { client: E, data: D, pending: O, failed: k, status: A, reload: j } = e(async (e) => n(await e.GET("/virtual-agents/{agent}", { params: { path: { agent: T.value } } })).data), M = () => ({ params: { path: { agent: T.value } } }), N = {
			list: async () => n(await E.GET("/virtual-agents/{agent}/versions", { params: {
				path: { agent: T.value },
				query: { per_page: 100 }
			} })).data,
			store: async (e) => n(await E.POST("/virtual-agents/{agent}/versions", {
				...M(),
				body: e
			})),
			publish: async (e) => n(await E.POST("/virtual-agents/{agent}/versions/{version}/publish", { params: { path: {
				agent: T.value,
				version: e
			} } }))
		};
		async function P() {
			E && window.confirm(x("cortex.virtual_agents.confirm_delete")) && await w.run(async () => n(await E.DELETE("/virtual-agents/{agent}", M()))) && await C.push("/cortex/virtual-agents");
		}
		return (e, t) => {
			let n = c;
			return m(), u(o, {
				title: h(D)?.name ?? h(x)("cortex.virtual_agents.title"),
				"screen-key": "cortex.virtual-agent",
				record: h(T),
				back: {
					to: "/cortex/virtual-agents",
					label: h(x)("cortex.virtual_agents.title")
				}
			}, {
				actions: g(() => [f(n, {
					variant: "outline",
					icon: "i-lucide-play",
					to: `/cortex/run?agent=virtual:${h(T)}`,
					label: h(x)("cortex.run.run"),
					"data-testid": "cortex-run-agent"
				}, null, 8, ["to", "label"]), f(n, {
					color: "error",
					variant: "outline",
					icon: "i-lucide-trash",
					label: h(x)("cortex.delete"),
					"data-testid": "cortex-delete-agent",
					onClick: P
				}, null, 8, ["label"])]),
				default: g(() => [f(a, {
					ready: !h(O) && h(D) !== null,
					failed: h(k),
					status: h(A)
				}, {
					default: g(() => [d("div", b, [
						f(r, {
							forbidden: h(w).forbidden.value,
							message: h(w).message.value
						}, null, 8, ["forbidden", "message"]),
						f(i, {
							agent: h(D),
							onSaved: h(j)
						}, null, 8, ["agent", "onSaved"]),
						f(s, {
							api: N,
							live: h(D)?.instructions ?? null,
							"live-title": h(x)("cortex.agent.prompt"),
							published: h(D)?.published_version ?? null,
							onChanged: h(j)
						}, null, 8, [
							"live",
							"live-title",
							"published",
							"onChanged"
						])
					])]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, [
				"title",
				"record",
				"back"
			]);
		};
	}
});
export { x as default };
