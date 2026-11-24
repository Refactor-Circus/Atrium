import "./entries-ofT4k6gi.js";
import { Fragment as e, computed as t, createBlock as n, createCommentVNode as r, createElementBlock as i, createElementVNode as a, createTextVNode as o, createVNode as s, defineComponent as c, openBlock as l, renderList as u, toDisplayString as d, unref as f, withCtx as p } from "vue";
import { UBadge as m, ULink as h } from "@refactor-circus/atrium/ui";
import { useI18n as g } from "vue-i18n";
// src/components/KeenEntriesTable.vue?vue&type=script&setup=true&lang.ts
var _ = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "keen-entries-empty"
}, v = {
	key: 1,
	class: "overflow-x-auto"
}, y = {
	class: "w-full text-sm",
	"data-testid": "keen-entries"
}, b = { class: "border-b border-default text-left text-muted" }, x = { class: "py-2 pe-4 font-medium" }, S = { class: "py-2 pe-4 font-medium" }, C = {
	key: 0,
	class: "py-2 pe-4 font-medium"
}, w = { class: "py-2 pe-4 font-medium" }, T = { class: "py-2 font-medium" }, E = { class: "divide-y divide-default" }, D = { class: "py-2 pe-4 whitespace-nowrap" }, O = { class: "py-2 pe-4" }, k = {
	key: 0,
	class: "py-2 pe-4"
}, A = { class: "py-2 pe-4" }, j = { class: "py-2" }, M = /* @__PURE__ */ c({
	__name: "KeenEntriesTable",
	props: {
		entries: {},
		withoutSubject: {
			type: Boolean,
			default: !1
		}
	},
	setup(c) {
		let M = c, { t: N, locale: P } = g();
		function F(e) {
			let t = new Date(e.created_at);
			return Number.isNaN(t.getTime()) ? e.created_at : t.toLocaleString(P.value);
		}
		let I = t(() => M.entries.map((e) => ({
			entry: e,
			when: F(e),
			subject: e.subject?.label ?? N("keen.entries.none"),
			actor: e.actor?.label ?? N("keen.entries.system")
		})));
		return (t, g) => {
			let M = h, P = m;
			return f(I).length === 0 ? (l(), i("p", _, d(f(N)("keen.entries.empty")), 1)) : (l(), i("div", v, [a("table", y, [a("thead", null, [a("tr", b, [
				a("th", x, d(f(N)("keen.entries.when")), 1),
				a("th", S, d(f(N)("keen.entries.action")), 1),
				c.withoutSubject ? r("", !0) : (l(), i("th", C, d(f(N)("keen.entries.subject")), 1)),
				a("th", w, d(f(N)("keen.entries.actor")), 1),
				a("th", T, d(f(N)("keen.entries.surface")), 1)
			])]), a("tbody", E, [(l(!0), i(e, null, u(f(I), (e) => (l(), i("tr", {
				key: e.entry.id,
				"data-testid": "keen-entry-row"
			}, [
				a("td", D, [s(M, {
					to: `/keen/entries/${e.entry.id}`,
					title: e.entry.created_at,
					class: "hover:underline"
				}, {
					default: p(() => [o(d(e.when), 1)]),
					_: 2
				}, 1032, ["to", "title"])]),
				a("td", O, [a("code", null, d(e.entry.action), 1), e.entry.source === f("app") ? (l(), n(P, {
					key: 0,
					color: "info",
					variant: "subtle",
					size: "sm",
					class: "ms-2"
				}, {
					default: p(() => [o(d(f(N)("keen.entries.app_badge")), 1)]),
					_: 1
				})) : r("", !0)]),
				c.withoutSubject ? r("", !0) : (l(), i("td", k, d(e.subject), 1)),
				a("td", A, d(e.actor), 1),
				a("td", j, [s(P, {
					color: "neutral",
					variant: "subtle",
					size: "sm"
				}, {
					default: p(() => [o(d(e.entry.surface), 1)]),
					_: 2
				}, 1024)])
			]))), 128))])])]));
		};
	}
});
export { M as t };
