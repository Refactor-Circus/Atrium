import { a as e, t } from "./cortex-Bp7gHDgF.js";
import { t as n } from "./CortexLoad-Bz-c2t3K.js";
import { t as r } from "./CortexPage-CtJD4yvP.js";
import { UBadge as i, UButton as a, UInput as o } from "@refactor-circus/atrium/ui";
import { Fragment as s, computed as c, createBlock as l, createElementBlock as u, createElementVNode as d, createVNode as f, defineComponent as p, isRef as m, openBlock as h, ref as g, renderList as _, toDisplayString as v, unref as y, watch as b, withCtx as x } from "vue";
import { useI18n as ee } from "vue-i18n";
import { useRoute as S, useRouter as C } from "vue-router";
// src/pages/tools/index.vue?vue&type=script&setup=true&lang.ts
var w = { class: "flex flex-col gap-4" }, T = {
	class: "flex flex-wrap items-center gap-2",
	"data-testid": "cortex-tags"
}, E = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "cortex-empty"
}, D = {
	key: 1,
	class: "w-full text-sm",
	"data-testid": "cortex-tools"
}, O = { class: "text-left text-muted" }, k = { class: "py-2" }, A = { class: "py-2" }, j = { class: "py-2" }, M = { class: "py-2 text-right" }, N = { class: "divide-y divide-default" }, P = ["data-testid"], F = { class: "py-2" }, I = { class: "text-xs" }, L = { class: "py-2" }, R = { class: "py-2" }, z = { class: "flex flex-wrap gap-1" }, B = { class: "py-2 text-right" }, V = /* @__PURE__ */ p({
	__name: "index",
	setup(p) {
		let { t: V } = ee(), H = S(), U = C(), W = c(() => typeof H.query.tag == "string" && H.query.tag !== "" ? H.query.tag : null), G = g(""), { data: K, pending: q, failed: J, status: Y, reload: X } = e(async (e) => ({
			tools: t(await e.GET("/tools", { params: { query: W.value === null ? {} : { tag: W.value } } })).data,
			tags: W.value === null ? null : t(await e.GET("/tools")).data.flatMap((e) => e.tags)
		}));
		b(W, () => void X());
		let Z = c(() => [...new Set(K.value?.tags ?? (K.value?.tools ?? []).flatMap((e) => e.tags))].sort()), Q = c(() => (K.value?.tools ?? []).filter((e) => G.value === "" || e.name.toLowerCase().includes(G.value.toLowerCase())));
		function $(e) {
			U.push({ query: {
				...H.query,
				tag: e ?? void 0
			} });
		}
		return (e, t) => {
			let c = a, p = o, g = i;
			return h(), l(r, {
				title: y(V)("cortex.tools.title"),
				"screen-key": "cortex.tools"
			}, {
				default: x(() => [f(n, {
					ready: !y(q),
					failed: y(J),
					status: y(Y)
				}, {
					default: x(() => [d("div", w, [d("div", T, [
						f(c, {
							size: "xs",
							color: "neutral",
							variant: y(W) === null ? "solid" : "outline",
							label: y(V)("cortex.tools.all_tags"),
							"data-testid": "cortex-tag-all",
							onClick: t[0] ||= (e) => $(null)
						}, null, 8, ["variant", "label"]),
						(h(!0), u(s, null, _(y(Z), (e) => (h(), l(c, {
							key: e,
							size: "xs",
							color: "neutral",
							variant: y(W) === e ? "solid" : "outline",
							label: e,
							"data-testid": `cortex-tag-${e}`,
							onClick: (t) => $(e)
						}, null, 8, [
							"variant",
							"label",
							"data-testid",
							"onClick"
						]))), 128)),
						f(p, {
							modelValue: y(G),
							"onUpdate:modelValue": t[1] ||= (e) => m(G) ? G.value = e : null,
							class: "ml-auto",
							icon: "i-lucide-search",
							placeholder: y(V)("cortex.tools.search"),
							"data-testid": "cortex-tool-search"
						}, null, 8, ["modelValue", "placeholder"])
					]), y(Q).length === 0 ? (h(), u("p", E, v(y(V)("cortex.tools.empty")), 1)) : (h(), u("table", D, [d("thead", O, [d("tr", null, [
						d("th", k, v(y(V)("cortex.agent.name")), 1),
						d("th", A, v(y(V)("cortex.tools.description")), 1),
						d("th", j, v(y(V)("cortex.tools.tags")), 1),
						d("th", M, v(y(V)("cortex.actions")), 1)
					])]), d("tbody", N, [(h(!0), u(s, null, _(y(Q), (e) => (h(), u("tr", {
						key: e.name,
						"data-testid": `cortex-tool-${e.name}`
					}, [
						d("td", F, [d("code", I, v(e.name), 1)]),
						d("td", L, v(e.description), 1),
						d("td", R, [d("div", z, [(h(!0), u(s, null, _(e.tags, (e) => (h(), l(g, {
							key: e,
							color: "neutral",
							variant: "subtle",
							size: "sm",
							label: e
						}, null, 8, ["label"]))), 128))])]),
						d("td", B, [f(c, {
							size: "xs",
							variant: "outline",
							icon: "i-lucide-file-text",
							to: `/cortex/tools/${e.name}/description`,
							label: y(V)("cortex.tools.edit_description"),
							"data-testid": `cortex-describe-${e.name}`
						}, null, 8, [
							"to",
							"label",
							"data-testid"
						])])
					], 8, P))), 128))])]))])]),
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
export { V as default };
