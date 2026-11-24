import { a as e, t } from "./cortex-Bp7gHDgF.js";
import { t as n } from "./CortexLoad-Bz-c2t3K.js";
import { t as r } from "./CortexPage-CtJD4yvP.js";
import { t as i } from "./CortexVersions-9-Zhh0G-.js";
import { computed as a, createBlock as o, createVNode as s, defineComponent as c, openBlock as l, unref as u, withCtx as d } from "vue";
import { useI18n as f } from "vue-i18n";
import { useRoute as p } from "vue-router";
// src/pages/tools/[tool]/description.vue
var m = /* @__PURE__ */ c({
	__name: "description",
	setup(c) {
		let { t: m } = f(), h = p(), g = a(() => String(h.params.tool)), _ = () => ({ params: { path: { tool: g.value } } }), { client: v, data: y, pending: b, failed: x, status: S, reload: C } = e(async (e) => {
			let [n, r] = await Promise.all([e.GET("/tools/{tool}/description", _()).then((e) => t(e).data), e.GET("/tools").then((e) => t(e).data).catch(() => [])]);
			return {
				override: n,
				own: r.find((e) => e.name === g.value)?.description ?? null
			};
		}), w = a(() => y.value?.override.published_content ?? y.value?.own ?? null), T = {
			list: async () => t(await v.GET("/tools/{tool}/description/versions", _())).data,
			store: async (e) => t(await v.POST("/tools/{tool}/description/versions", {
				..._(),
				body: e
			})),
			publish: async (e) => t(await v.POST("/tools/{tool}/description/versions/{version}/publish", { params: { path: {
				tool: g.value,
				version: e
			} } })),
			destroy: async () => t(await v.DELETE("/tools/{tool}/description", _()))
		};
		return (e, t) => (l(), o(r, {
			title: u(m)("cortex.tools.description_title", { tool: u(g) }),
			"screen-key": "cortex.tool-description",
			record: u(g),
			back: {
				to: "/cortex/tools",
				label: u(m)("cortex.tools.title")
			}
		}, {
			default: d(() => [s(n, {
				ready: !u(b) && u(y) !== null,
				failed: u(x),
				status: u(S)
			}, {
				default: d(() => [s(i, {
					api: T,
					live: u(w),
					"live-title": u(m)("cortex.tools.description"),
					published: u(y)?.override.published_version ?? null,
					override: "",
					onChanged: u(C)
				}, null, 8, [
					"live",
					"live-title",
					"published",
					"onChanged"
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
		]));
	}
});
export { m as default };
