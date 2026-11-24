import { n as e } from "./entries-ofT4k6gi.js";
import { AtriumIntegrationScreen as t, AtriumNoAccess as n, atriumStatus as r, integrationData as i, useAtriumIntegration as a, useHead as o } from "@refactor-circus/atrium";
import { Fragment as s, computed as c, createBlock as l, createCommentVNode as u, createElementBlock as d, createElementVNode as f, createVNode as p, defineComponent as m, openBlock as h, ref as g, renderList as _, shallowRef as v, toDisplayString as y, unref as b, watch as x, withCtx as S } from "vue";
import { UAlert as C, UButton as w, UCard as T, UDashboardNavbar as E, UDashboardPanel as D, USkeleton as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
import { useRoute as A } from "vue-router";
// src/components/KeenChanges.vue?vue&type=script&setup=true&lang.ts
var j = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "keen-no-changes"
}, M = {
	key: 1,
	class: "overflow-x-auto"
}, N = {
	class: "w-full text-sm",
	"data-testid": "keen-changes"
}, P = { class: "border-b border-default text-left text-muted" }, F = { class: "py-2 pe-4 font-medium" }, I = { class: "py-2 pe-4 font-medium" }, L = { class: "py-2 font-medium" }, R = { class: "divide-y divide-default" }, z = { class: "py-2 pe-4" }, B = {
	class: "py-2 pe-4 break-all",
	"data-testid": "keen-change-before"
}, V = {
	class: "py-2 break-all",
	"data-testid": "keen-change-after"
}, H = /* @__PURE__ */ m({
	__name: "KeenChanges",
	props: { changes: {} },
	setup(t) {
		let n = t, { t: r } = k(), i = c(() => e(n.changes));
		return (e, t) => b(i).length === 0 ? (h(), d("p", j, y(b(r)("keen.changes.none")), 1)) : (h(), d("div", M, [f("table", N, [f("thead", null, [f("tr", P, [
			f("th", F, y(b(r)("keen.changes.field")), 1),
			f("th", I, y(b(r)("keen.changes.before")), 1),
			f("th", L, y(b(r)("keen.changes.after")), 1)
		])]), f("tbody", R, [(h(!0), d(s, null, _(b(i), (e) => (h(), d("tr", {
			key: e.field,
			"data-testid": "keen-change"
		}, [
			f("td", z, [f("code", null, y(e.field), 1)]),
			f("td", B, y(e.before), 1),
			f("td", V, y(e.after), 1)
		]))), 128))])])]));
	}
}), U = {
	key: 4,
	class: "grid gap-4 lg:grid-cols-2",
	"data-testid": "keen-entry"
}, W = { class: "font-medium" }, G = {
	key: 0,
	class: "text-sm text-muted"
}, K = {
	class: "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm",
	"data-testid": "keen-entry-details"
}, q = { class: "text-muted" }, J = ["data-testid"], Y = { class: "font-medium" }, X = {
	key: 0,
	class: "mt-4 overflow-x-auto text-xs",
	"data-testid": "keen-entry-context"
}, Z = /* @__PURE__ */ m({
	__name: "[entry]",
	setup(e) {
		let m = A(), { t: j, locale: M } = k(), { client: N } = a("keen"), P = c(() => String(m.params.entry)), F = v(null), I = v(null), L = g(!0), R = c(() => r(I.value));
		async function z() {
			if (N) {
				L.value = !0, I.value = null;
				try {
					F.value = i(await N.GET("/entries/{entry}", { params: { path: { entry: P.value } } })).data;
				} catch (e) {
					F.value = null, I.value = e;
				} finally {
					L.value = !1;
				}
			}
		}
		x(P, () => void z(), { immediate: !0 });
		let B = c(() => F.value?.action ?? j("keen.entry.title")), V = c(() => F.value ? new Date(F.value.created_at).toLocaleString(M.value) : null), Z = c(() => F.value !== null && ("ip" in F.value || "user_agent" in F.value)), Q = c(() => F.value && Object.keys(F.value.context ?? {}).length > 0 ? JSON.stringify(F.value.context, null, 2) : null), $ = c(() => {
			let e = F.value;
			if (!e) return [];
			let t = [
				{
					key: "source",
					term: j("keen.entry.source"),
					text: e.source === "app" ? j("keen.filters.source_app") : e.source
				},
				{
					key: "subject",
					term: j("keen.entry.subject"),
					text: [
						e.subject?.label ?? j("keen.entries.none"),
						e.subject?.type,
						e.subject?.id
					].filter(Boolean).join(" ")
				},
				{
					key: "actor",
					term: j("keen.entry.actor"),
					text: e.actor?.label ?? j("keen.entries.system")
				}
			];
			return e.scope && t.push({
				key: "scope",
				term: j("keen.entry.scope"),
				text: [e.scope.type, e.scope.id].filter(Boolean).join(" ")
			}), t.push({
				key: "surface",
				term: j("keen.entry.surface"),
				text: e.surface
			}), Z.value && t.push({
				key: "ip",
				term: j("keen.entry.ip"),
				text: e.ip ?? j("keen.entries.none")
			}, {
				key: "user_agent",
				term: j("keen.entry.user_agent"),
				text: e.user_agent ?? j("keen.entries.none")
			}), t.push({
				key: "hash",
				term: j("keen.entry.hash"),
				text: e.hash
			}), t;
		});
		return o({ title: () => B.value }), (e, r) => {
			let i = w, a = E, o = n, c = C, m = O, g = T, v = t, x = D;
			return h(), l(x, null, {
				header: S(() => [p(a, { title: b(B) }, {
					leading: S(() => [p(i, {
						to: "/keen/entries",
						icon: "i-lucide-arrow-left",
						color: "neutral",
						variant: "ghost",
						"aria-label": b(j)("keen.entry.back")
					}, null, 8, ["aria-label"])]),
					_: 1
				}, 8, ["title"])]),
				body: S(() => [p(v, {
					"screen-key": "keen.entry",
					record: b(P)
				}, {
					default: S(() => [b(R) === 403 ? (h(), l(o, { key: 0 })) : b(R) === 404 ? (h(), l(c, {
						key: 1,
						color: "neutral",
						variant: "subtle",
						icon: "i-lucide-search-x",
						title: b(j)("keen.entry.not_found"),
						description: b(j)("keen.entry.not_found_description"),
						"data-testid": "keen-entry-not-found"
					}, null, 8, ["title", "description"])) : b(I) ? (h(), l(c, {
						key: 2,
						color: "error",
						title: b(j)("keen.entry.load_failed"),
						"data-testid": "keen-entry-failed"
					}, null, 8, ["title"])) : b(L) && !b(F) ? (h(), l(m, {
						key: 3,
						class: "h-40"
					})) : b(F) ? (h(), d("div", U, [p(g, null, {
						header: S(() => [f("h2", W, y(b(j)("keen.entry.details")), 1), b(V) ? (h(), d("p", G, y(b(V)), 1)) : u("", !0)]),
						default: S(() => [f("dl", K, [(h(!0), d(s, null, _(b($), (e) => (h(), d(s, { key: e.key }, [f("dt", q, y(e.term), 1), f("dd", {
							class: "break-all",
							"data-testid": `keen-entry-${e.key}`
						}, y(e.text), 9, J)], 64))), 128))])]),
						_: 1
					}), p(g, null, {
						header: S(() => [f("h2", Y, y(b(j)("keen.entry.changes")), 1)]),
						default: S(() => [p(H, { changes: b(F).changes }, null, 8, ["changes"]), b(Q) ? (h(), d("pre", X, y(b(Q)), 1)) : u("", !0)]),
						_: 1
					})])) : u("", !0)]),
					_: 1
				}, 8, ["record"])]),
				_: 1
			});
		};
	}
});
export { Z as default };
