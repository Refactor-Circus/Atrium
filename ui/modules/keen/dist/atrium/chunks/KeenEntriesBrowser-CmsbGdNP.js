import { t as e } from "./KeenEntriesTable-7vgx2KoL.js";
import { i as t, r as n, t as r } from "./entries-ofT4k6gi.js";
import { AtriumNoAccess as i, atriumStatus as a, integrationData as o, useAtriumIntegration as s } from "@refactor-circus/atrium";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, isRef as _, normalizeClass as ee, openBlock as v, reactive as y, ref as b, renderList as x, shallowRef as S, toDisplayString as C, unref as w, watch as T, withCtx as E, withModifiers as te } from "vue";
import { UAlert as ne, UButton as re, UCard as ie, UFormField as ae, UInput as oe, USelect as D, USkeleton as se } from "@refactor-circus/atrium/ui";
import { useI18n as ce } from "vue-i18n";
import { useRoute as le, useRouter as O } from "vue-router";
// src/components/KeenEntriesBrowser.vue?vue&type=script&setup=true&lang.ts
var k = {
	key: 1,
	class: "space-y-4"
}, A = { class: "flex gap-2 self-end" }, ue = ["aria-label"], j = "*", M = /* @__PURE__ */ g({
	__name: "KeenEntriesBrowser",
	props: {
		source: {},
		sources: {}
	},
	setup(g, { expose: M }) {
		let N = g, P = le(), F = O(), { t: I } = ce(), { client: L } = s("keen"), R = {
			source: I("keen.filters.source"),
			action: I("keen.filters.action"),
			subject_type: I("keen.filters.subject_type"),
			subject_id: I("keen.filters.subject_id"),
			actor_type: I("keen.filters.actor_type"),
			actor_id: I("keen.filters.actor_id"),
			since: I("keen.filters.since"),
			until: I("keen.filters.until")
		}, z = r.filter((e) => e !== "source"), B = l(() => {
			let e = n(P.query);
			return N.source && (e.source = N.source), e;
		}), V = y(Object.fromEntries(r.map((e) => [e, ""])));
		T(B, (e) => {
			for (let t of r) V[t] = e[t] ?? "";
		}, { immediate: !0 });
		let H = l(() => [
			{
				value: j,
				label: I("keen.filters.all_sources")
			},
			...N.sources ?? [],
			{
				value: "app",
				label: I("keen.filters.source_app")
			}
		]), U = l({
			get: () => V.source === "" ? j : V.source,
			set: (e) => {
				V.source = e === j ? "" : e;
			}
		}), W = S([]), G = S(null), K = S(null), q = b(!1), J = l(() => a(K.value) === 403), Y = l(() => t(K.value)), X = l(() => K.value !== null && !J.value && Object.keys(Y.value).length === 0);
		async function Z() {
			if (L) {
				q.value = !0, K.value = null;
				try {
					let e = o(await L.GET("/entries", { params: { query: B.value } }));
					W.value = e.data, G.value = e.meta;
				} catch (e) {
					K.value = e, W.value = [], G.value = null;
				} finally {
					q.value = !1;
				}
			}
		}
		T(() => JSON.stringify(B.value), () => void Z(), { immediate: !0 });
		function Q() {
			let e = { ...P.query };
			for (let t of [...r, "cursor"]) delete e[t];
			return e;
		}
		function de() {
			let e = {};
			for (let t of r) V[t] !== "" && !(t === "source" && N.source) && (e[t] = V[t]);
			F.replace({ query: {
				...Q(),
				...e
			} });
		}
		function fe() {
			F.replace({ query: Q() });
		}
		function $(e) {
			let t = { ...P.query };
			delete t.cursor, F.replace({ query: e ? {
				...t,
				cursor: e
			} : t });
		}
		return M({ reload: Z }), (t, n) => {
			let r = i, a = D, o = ae, s = oe, l = re, y = ie, b = ne, S = se;
			return w(J) ? (v(), u(r, { key: 0 })) : (v(), f("div", k, [
				h(y, null, {
					default: E(() => [p("form", {
						class: "atrium-querybar",
						"data-testid": "keen-filters",
						onSubmit: te(de, ["prevent"])
					}, [
						g.source ? d("", !0) : (v(), u(o, {
							key: 0,
							label: R.source,
							name: "source",
							error: w(Y).source?.[0],
							class: "w-44"
						}, {
							default: E(() => [h(a, {
								modelValue: w(U),
								"onUpdate:modelValue": n[0] ||= (e) => _(U) ? U.value = e : null,
								items: w(H),
								class: "w-full",
								"data-testid": "keen-filter-source"
							}, null, 8, ["modelValue", "items"])]),
							_: 1
						}, 8, ["label", "error"])),
						(v(!0), f(c, null, x(w(z), (e) => (v(), u(o, {
							key: e,
							label: R[e],
							name: e,
							hint: e === "action" ? w(I)("keen.filters.action_hint") : void 0,
							error: w(Y)[e]?.[0],
							class: ee(e === "action" ? "w-56" : "w-44")
						}, {
							default: E(() => [h(s, {
								modelValue: w(V)[e],
								"onUpdate:modelValue": (t) => w(V)[e] = t,
								type: e === "since" || e === "until" ? "date" : "text",
								class: "w-full",
								"data-testid": `keen-filter-${e}`
							}, null, 8, [
								"modelValue",
								"onUpdate:modelValue",
								"type",
								"data-testid"
							])]),
							_: 2
						}, 1032, [
							"label",
							"name",
							"hint",
							"error",
							"class"
						]))), 128)),
						p("div", A, [h(l, {
							type: "submit",
							icon: "i-lucide-funnel",
							"data-testid": "keen-filter-apply"
						}, {
							default: E(() => [m(C(w(I)("keen.filters.apply")), 1)]),
							_: 1
						}), h(l, {
							type: "button",
							icon: "i-lucide-x",
							color: "neutral",
							variant: "ghost",
							"data-testid": "keen-filter-clear",
							onClick: fe
						}, {
							default: E(() => [m(C(w(I)("keen.filters.clear")), 1)]),
							_: 1
						})])
					], 32)]),
					_: 1
				}),
				w(X) ? (v(), u(b, {
					key: 0,
					color: "error",
					title: w(I)("keen.entries.load_failed"),
					"data-testid": "keen-entries-failed"
				}, null, 8, ["title"])) : w(q) && w(W).length === 0 ? (v(), u(S, {
					key: 1,
					class: "h-32"
				})) : (v(), u(y, { key: 2 }, {
					default: E(() => [h(e, { entries: w(W) }, null, 8, ["entries"])]),
					_: 1
				})),
				w(G) && (w(B).cursor || w(G).next_cursor) ? (v(), f("nav", {
					key: 3,
					class: "flex items-center justify-end gap-2",
					"aria-label": w(I)("keen.entries.pagination"),
					"data-testid": "keen-pages"
				}, [
					w(B).cursor ? (v(), u(l, {
						key: 0,
						color: "neutral",
						variant: "outline",
						size: "sm",
						"data-testid": "keen-page-newest",
						onClick: n[1] ||= (e) => $(null)
					}, {
						default: E(() => [m(C(w(I)("keen.entries.newest")), 1)]),
						_: 1
					})) : d("", !0),
					w(B).cursor && w(G).prev_cursor ? (v(), u(l, {
						key: 1,
						color: "neutral",
						variant: "outline",
						size: "sm",
						"data-testid": "keen-page-newer",
						onClick: n[2] ||= (e) => $(w(G).prev_cursor)
					}, {
						default: E(() => [m(C(w(I)("keen.entries.newer")), 1)]),
						_: 1
					})) : d("", !0),
					w(G).next_cursor ? (v(), u(l, {
						key: 2,
						color: "neutral",
						variant: "outline",
						size: "sm",
						"data-testid": "keen-page-older",
						onClick: n[3] ||= (e) => $(w(G).next_cursor)
					}, {
						default: E(() => [m(C(w(I)("keen.entries.older")), 1)]),
						_: 1
					})) : d("", !0)
				], 8, ue)) : d("", !0)
			]));
		};
	}
});
export { M as t };
