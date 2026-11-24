import { t as e } from "./ImpexState-Mg53d6po.js";
import { t } from "./ImpexStatusBadge-ePLj75gE.js";
import { S as n } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as r, integrationData as i } from "@refactor-circus/atrium";
import { UButton as a } from "@refactor-circus/atrium/ui";
import { Fragment as o, createElementBlock as s, createElementVNode as c, createTextVNode as l, createVNode as u, defineComponent as d, openBlock as f, renderList as p, resolveComponent as m, toDisplayString as h, unref as g, withCtx as _ } from "vue";
import { useI18n as v } from "vue-i18n";
// src/pages/channels/index.vue?vue&type=script&setup=true&lang.ts
var y = {
	class: "space-y-4",
	"data-testid": "impex-channels"
}, b = { class: "flex items-center justify-between gap-3" }, x = { class: "text-xl font-semibold" }, S = {
	key: 0,
	class: "text-sm text-muted"
}, C = {
	key: 1,
	class: "w-full text-left text-sm"
}, w = { class: "text-muted" }, T = { class: "py-2 pr-3 font-medium" }, E = { class: "py-2 pr-3 font-medium" }, D = { class: "py-2 pr-3 font-medium" }, O = { class: "py-2 pr-3 font-medium" }, k = { class: "py-2 font-medium" }, A = { class: "divide-y divide-default" }, j = ["data-testid"], M = { class: "py-2 pr-3" }, N = { class: "py-2 pr-3" }, P = { class: "py-2 pr-3" }, F = { class: "py-2 pr-3" }, I = { class: "py-2" }, L = /* @__PURE__ */ d({
	__name: "index",
	setup(d) {
		let { t: L } = v(), R = n(async (e) => i(await e.GET("/channels")).data);
		return (n, i) => {
			let d = a, v = m("RouterLink"), z = r;
			return f(), s("div", y, [c("header", b, [c("h1", x, h(g(L)("impex.channels.title")), 1), u(d, {
				to: "/impex/channels/create",
				icon: "i-lucide-plus",
				"data-testid": "impex-new-channel"
			}, {
				default: _(() => [l(h(g(L)("impex.channels.new")), 1)]),
				_: 1
			})]), u(z, { "screen-key": "impex.channels" }, {
				default: _(() => [u(e, {
					error: g(R).error.value,
					ready: g(R).data.value !== null
				}, {
					default: _(() => [(g(R).data.value ?? []).length === 0 ? (f(), s("p", S, h(g(L)("impex.channels.empty")), 1)) : (f(), s("table", C, [c("thead", w, [c("tr", null, [
						c("th", T, h(g(L)("impex.channels.name")), 1),
						c("th", E, h(g(L)("impex.channels.direction")), 1),
						c("th", D, h(g(L)("impex.channels.transport")), 1),
						c("th", O, h(g(L)("impex.channels.status")), 1),
						c("th", k, h(g(L)("impex.channels.source")), 1)
					])]), c("tbody", A, [(f(!0), s(o, null, p(g(R).data.value, (e) => (f(), s("tr", {
						key: e.name,
						"data-testid": `impex-channel-row-${e.name}`
					}, [
						c("td", M, [u(v, {
							to: `/impex/channels/${encodeURIComponent(e.name)}`,
							class: "font-medium hover:underline"
						}, {
							default: _(() => [l(h(e.name), 1)]),
							_: 2
						}, 1032, ["to"])]),
						c("td", N, h(g(L)(`impex.directions.${e.direction}`)), 1),
						c("td", P, h(e.transport), 1),
						c("td", F, [u(t, { status: e.status }, null, 8, ["status"])]),
						c("td", I, h(e.stored ? g(L)("impex.channels.stored") : g(L)("impex.channels.from_config")), 1)
					], 8, j))), 128))])]))]),
					_: 1
				}, 8, ["error", "ready"])]),
				_: 1
			})]);
		};
	}
});
export { L as default };
