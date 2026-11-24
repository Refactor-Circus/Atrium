import { t as e } from "./KeenEntriesBrowser-CmsbGdNP.js";
import { AtriumIntegrationScreen as t, AtriumNoAccess as n, atriumStatus as r, integrationData as i, useAtriumIntegration as a, useHead as o } from "@refactor-circus/atrium";
import { computed as s, createBlock as c, createVNode as l, defineComponent as u, onMounted as d, openBlock as f, shallowRef as p, unref as m, withCtx as h } from "vue";
import { UAlert as g, UDashboardNavbar as _, UDashboardPanel as v, USkeleton as y } from "@refactor-circus/atrium/ui";
import { useI18n as b } from "vue-i18n";
import { useRoute as x } from "vue-router";
// src/pages/history/[package].vue
var S = /* @__PURE__ */ u({
	__name: "[package]",
	setup(u) {
		let S = x(), { t: C } = b(), { client: w } = a("keen"), T = s(() => String(S.params.package)), E = p(null), D = p(null), O = s(() => E.value?.find((e) => e.key === T.value) ?? null), k = s(() => r(D.value) === 403), A = s(() => C("keen.history.title", { package: O.value?.label ?? T.value }));
		return d(async () => {
			if (w) try {
				E.value = i(await w.GET("/packages")).data;
			} catch (e) {
				D.value = e, E.value = [];
			}
		}), o({ title: () => A.value }), (r, i) => {
			let a = _, o = n, s = y, u = g, d = t, p = v;
			return f(), c(p, null, {
				header: h(() => [l(a, { title: m(A) }, null, 8, ["title"])]),
				body: h(() => [l(d, { "screen-key": "keen.history" }, {
					default: h(() => [m(k) ? (f(), c(o, { key: 0 })) : m(E) === null ? (f(), c(s, {
						key: 1,
						class: "h-40"
					})) : m(O) ? (f(), c(e, {
						key: 3,
						source: m(O).key,
						"data-testid": "keen-history"
					}, null, 8, ["source"])) : (f(), c(u, {
						key: 2,
						color: "neutral",
						variant: "subtle",
						icon: "i-lucide-search-x",
						title: m(C)("keen.history.not_found"),
						description: m(C)("keen.history.not_found_description", { package: m(T) }),
						"data-testid": "keen-history-not-found"
					}, null, 8, ["title", "description"]))]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { S as default };
