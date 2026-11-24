import { AtriumStat as e, defineAtriumModule as t } from "@refactor-circus/atrium";
import { UBadge as n, UButton as r, UCard as i, UChip as a, UProgress as o, USwitch as s } from "@refactor-circus/atrium/ui";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, openBlock as _, renderList as v, toDisplayString as y, unref as b, withCtx as x } from "vue";
// src/components/extensions/SettingsHelp.vue?vue&type=script&setup=true&lang.ts
var S = { class: "text-sm text-muted" }, C = /* @__PURE__ */ g({
	__name: "SettingsHelp",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let r = i;
			return _(), u(r, null, {
				default: x(() => [n[0] ||= p("h3", { class: "mb-2 font-medium" }, "About these settings", -1), p("p", S, y(e.data.text), 1)]),
				_: 1
			});
		};
	}
}), w = { class: "grid grid-cols-[8rem_1fr] gap-y-2 text-sm" }, T = /* @__PURE__ */ g({
	__name: "StorefrontTab",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let r = i;
			return _(), u(r, null, {
				default: x(() => [p("dl", w, [
					n[0] ||= p("dt", { class: "text-muted" }, "Name", -1),
					p("dd", null, y(e.data.name), 1),
					n[1] ||= p("dt", { class: "text-muted" }, "URL", -1),
					p("dd", null, y(e.data.url), 1),
					n[2] ||= p("dt", { class: "text-muted" }, "Currency", -1),
					p("dd", null, y(e.data.currency), 1),
					n[3] ||= p("dt", { class: "text-muted" }, "Time zone", -1),
					p("dd", null, y(e.data.timezone), 1)
				])]),
				_: 1
			});
		};
	}
}), E = { class: "flex justify-end" }, D = /* @__PURE__ */ g({
	__name: "VisitStore",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let i = r;
			return _(), f("div", E, [e.data.url ? (_(), u(i, {
				key: 0,
				to: e.data.url,
				target: "_blank",
				rel: "noopener noreferrer",
				icon: "i-lucide-external-link",
				variant: "outline"
			}, {
				default: x(() => [...n[0] ||= [m(" Visit store ", -1)]]),
				_: 1
			}, 8, ["to"])) : d("", !0)]);
		};
	}
}), O = { class: "mb-1 flex justify-between text-sm" }, k = { class: "text-muted" }, A = /* @__PURE__ */ g({
	__name: "GoalsWidget",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let r = o;
			return _(), f("div", null, [n[0] ||= p("h3", { class: "mb-3 font-medium" }, "Quarterly goals", -1), (_(!0), f(c, null, v(e.data.goals ?? [], (e) => (_(), f("div", {
				key: e.label,
				class: "mb-3"
			}, [p("div", O, [p("span", null, y(e.label), 1), p("span", k, y(e.value) + "/" + y(e.max), 1)]), h(r, {
				"model-value": e.value,
				max: e.max
			}, null, 8, ["model-value", "max"])]))), 128))]);
		};
	}
}), j = { class: "divide-y divide-default text-sm" }, M = { class: "font-mono" }, N = { class: "flex-1 truncate" }, P = { class: "tabular-nums" }, F = /* @__PURE__ */ g({
	__name: "RecentOrdersWidget",
	props: { data: {} },
	setup(e) {
		let t = {
			paid: "success",
			shipped: "primary",
			pending: "info",
			refunded: "warning",
			failed: "error"
		};
		return (r, i) => {
			let a = n;
			return _(), f("div", null, [i[0] ||= p("h3", { class: "mb-2 font-medium" }, "Recent orders", -1), p("ul", j, [(_(!0), f(c, null, v(e.data.orders ?? [], (e) => (_(), f("li", {
				key: e.number,
				class: "flex items-center gap-3 py-2"
			}, [
				p("span", M, y(e.number), 1),
				p("span", N, y(e.customer), 1),
				p("span", P, "$" + y(e.total.toLocaleString(void 0, { minimumFractionDigits: 2 })), 1),
				h(a, {
					color: t[e.status] ?? "neutral",
					variant: "subtle"
				}, {
					default: x(() => [m(y(e.status), 1)]),
					_: 2
				}, 1032, ["color"])
			]))), 128))])]);
		};
	}
}), I = { class: "space-y-2 text-sm" }, L = { class: "flex-1" }, R = { class: "text-muted" }, z = /* @__PURE__ */ g({
	__name: "ServicesWidget",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let r = a;
			return _(), f("div", null, [n[0] ||= p("h3", { class: "mb-2 font-medium" }, "Service status", -1), p("ul", I, [(_(!0), f(c, null, v(e.data.services ?? [], (e) => (_(), f("li", {
				key: e.name,
				class: "flex items-center gap-2"
			}, [
				h(r, {
					color: e.status,
					standalone: "",
					inset: ""
				}, null, 8, ["color"]),
				p("span", L, y(e.name), 1),
				p("span", R, y(e.label), 1)
			]))), 128))])]);
		};
	}
}), B = { class: "space-y-2" }, V = /* @__PURE__ */ g({
	__name: "ShopSettings",
	props: { data: {} },
	setup(e) {
		return (t, n) => {
			let r = s, a = i;
			return _(), u(a, null, {
				default: x(() => [n[0] ||= p("h3", { class: "mb-3 font-medium" }, "Feature flags", -1), p("ul", B, [(_(!0), f(c, null, v(e.data.features ?? {}, (e, t) => (_(), f("li", {
					key: t,
					class: "flex items-center justify-between"
				}, [p("span", null, y(t), 1), h(r, {
					"model-value": e,
					disabled: ""
				}, null, 8, ["model-value"])]))), 128))])]),
				_: 1
			});
		};
	}
}), H = /* @__PURE__ */ g({
	__name: "StatWidget",
	props: { data: {} },
	setup(t) {
		let n = t, r = l(() => {
			let e = [...n.data.label ?? ""].reduce((e, t) => e + t.charCodeAt(0), 0), t = n.data.trend === "down" ? -.6 : .8;
			return Array.from({ length: 14 }, (n, r) => (e = (e * 9301 + 49297) % 233280, 10 + r * t + e / 233280 * 4));
		}), i = l(() => n.data.trend === "up" ? "success" : n.data.trend === "down" ? "error" : "primary");
		return (n, a) => {
			let o = e;
			return _(), u(o, {
				class: "h-full",
				label: t.data.label ?? "",
				value: t.data.value,
				icon: t.data.icon,
				delta: t.data.change?.split(" ")[0] ?? null,
				hint: t.data.change?.split(" ").slice(1).join(" ") || null,
				series: b(r),
				tone: b(i)
			}, null, 8, [
				"label",
				"value",
				"icon",
				"delta",
				"hint",
				"series",
				"tone"
			]);
		};
	}
}), U = (e, t) => {
	let n = e.__vccOpts || e;
	for (let [e, r] of t) n[e] = r;
	return n;
}, W = {}, G = { class: "space-y-2 text-sm" };
function K(e, t) {
	return _(), f("div", G, [...t[0] ||= [p("h3", { class: "font-medium" }, "Headless Atrium", -1), p("p", { class: "text-muted" }, " Every widget here is a Vue component registered by key. Its data comes from the widget's PHP resolver through Atrium's JSON API. ", -1)]]);
}
// src/atrium.ts
var q = t({
	key: "demo",
	widgets: {
		"demo.revenue": H,
		"demo.orders": H,
		"demo.conversion": H,
		"demo.users": H,
		"demo.recent-orders": F,
		"demo.services": z,
		"demo.goals": A,
		"demo.welcome": /* @__PURE__ */ U(W, [["render", K]])
	},
	settingsPanels: { demo: V },
	extensions: {
		"demo.storefront": T,
		"demo.visit-store": D,
		"demo.help": C
	}
});
export { q as default };
