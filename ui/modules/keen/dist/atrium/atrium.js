import { t as e } from "./chunks/KeenEntriesTable-7vgx2KoL.js";
import { atriumStatus as t, defineAtriumModule as n, integrationData as r, mergeAtriumMessages as i, useAtriumIntegration as a, useAtriumShellStore as o } from "@refactor-circus/atrium";
import { computed as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createSlots as f, createTextVNode as p, createVNode as m, defineComponent as h, openBlock as g, ref as _, shallowRef as v, toDisplayString as y, unref as b, watch as x, withCtx as S } from "vue";
import { UCard as C, ULink as w, USkeleton as T } from "@refactor-circus/atrium/ui";
import { useI18n as E } from "vue-i18n";
// src/components/history.ts
var D = 90;
function O(e) {
	let t = Array.isArray(e.exclude) ? e.exclude.filter((e) => typeof e == "string") : [], n = {};
	if (typeof e.groups == "object" && e.groups !== null && !Array.isArray(e.groups)) for (let [t, r] of Object.entries(e.groups)) typeof r == "string" && r !== "" && (n[t] = r);
	return {
		exclude: t,
		groups: n,
		sort: typeof e.sort == "number" ? e.sort : D
	};
}
function k(e, t) {
	let n = t.toLowerCase();
	return e.find((e) => e.key === `group-${n}` || e.label.toLowerCase() === n)?.label ?? t;
}
function A(e, t) {
	return e.label.localeCompare(t.label, void 0, { sensitivity: "base" });
}
function j(e) {
	return {
		label: e.label,
		icon: null,
		link: {
			path: `/keen/history/${encodeURIComponent(e.key)}`,
			external: !1
		},
		badge: null,
		live: null,
		children: []
	};
}
function M(e, t, n = (e) => e) {
	let r = [], i = /* @__PURE__ */ new Map();
	for (let a of e) {
		if (t.exclude.includes(a.key)) continue;
		let e = t.groups[a.key];
		if (e === void 0) {
			r.push(j(a));
			continue;
		}
		let o = n(e), s = i.get(o);
		s || (s = {
			label: o,
			icon: null,
			link: null,
			badge: null,
			live: null,
			children: []
		}, i.set(o, s)), s.children.push(j(a));
	}
	for (let e of i.values()) e.children.sort(A);
	return [...r, ...i.values()].sort(A);
}
async function N(e) {
	let { client: t } = a("keen"), n = o().shell?.navigation ?? [];
	if (!t) throw Error("The Keen integration is not active.");
	let i = r(await t.GET("/packages")).data;
	return { children: M(i, O(e), (e) => k(n, e)) };
}
// src/components/hooks/hooks.ts
function P(e) {
	return typeof e == "number" && Number.isFinite(e) ? String(e) : typeof e == "string" && e !== "" ? e : null;
}
function F(e) {
	return typeof e == "string" && e !== "" ? e : null;
}
function I(e, t) {
	let n = F(e.source);
	if (n === null) return null;
	let r = F(e.subject_type), i = P(t);
	return r && i ? {
		source: n,
		subject_type: r,
		subject_id: i
	} : { source: n };
}
function L(e, t) {
	let n = F(e.source), r = F(e.subject_type), i = P(t);
	return n === null || r === null || i === null ? null : e.scope === !1 ? {
		source: n,
		subject_type: r,
		subject_id: i
	} : {
		source: n,
		scope_type: r,
		scope_id: i
	};
}
// src/components/hooks/KeenHookEntries.vue?vue&type=script&setup=true&lang.ts
var R = { class: "font-medium" }, z = {
	key: 1,
	class: "text-sm text-error",
	"data-testid": "hooks-keen-failed"
}, B = /* @__PURE__ */ h({
	__name: "KeenHookEntries",
	props: {
		query: {},
		withoutSubject: { type: Boolean },
		linkable: { type: Boolean }
	},
	setup(n) {
		let i = n, { t: o } = E(), { client: h } = a("keen"), D = _("loading"), O = v([]), k = _(!1);
		async function A() {
			let e = i.query;
			if (!h || !e?.source) D.value = "hidden";
			else {
				D.value = "loading";
				try {
					if (!r(await h.GET("/packages")).data.some((t) => t.key === e.source)) {
						D.value = "hidden";
						return;
					}
					let t = r(await h.GET("/entries", { params: { query: {
						...e,
						per_page: 20
					} } }));
					O.value = t.data, k.value = t.meta.next_cursor !== null, D.value = "ready";
				} catch (e) {
					D.value = t(e) === 403 ? "hidden" : "failed";
				}
			}
		}
		x(() => JSON.stringify(i.query), () => void A(), { immediate: !0 });
		let j = s(() => {
			let e = i.query;
			if (!e?.source) return null;
			let t = i.linkable && e.subject_type && e.subject_id ? {
				subject_type: e.subject_type,
				subject_id: e.subject_id
			} : {};
			return {
				path: `/keen/history/${encodeURIComponent(e.source)}`,
				query: t
			};
		});
		return (t, r) => {
			let i = T, a = w, s = C;
			return b(D) === "hidden" ? l("", !0) : (g(), c(s, {
				key: 0,
				"data-testid": "hooks-keen-entries"
			}, f({
				header: S(() => [d("h3", R, y(b(o)("hooks.keen.history")), 1)]),
				default: S(() => [b(D) === "loading" ? (g(), c(i, {
					key: 0,
					class: "h-16"
				})) : b(D) === "failed" ? (g(), u("p", z, y(b(o)("hooks.keen.load_failed")), 1)) : (g(), c(e, {
					key: 2,
					entries: b(O),
					"without-subject": n.withoutSubject
				}, null, 8, ["entries", "without-subject"]))]),
				_: 2
			}, [b(D) === "ready" && b(k) && b(j) ? {
				name: "footer",
				fn: S(() => [m(a, {
					to: b(j),
					class: "text-sm hover:underline",
					"data-testid": "hooks-keen-view-all"
				}, {
					default: S(() => [p(y(b(o)("hooks.keen.view_all")), 1)]),
					_: 1
				}, 8, ["to"])]),
				key: "0"
			} : void 0]), 1024));
		};
	}
}), V = /* @__PURE__ */ h({
	__name: "KeenActivityTab",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = s(() => L(t.data, t.record));
		return (e, t) => (g(), c(B, {
			query: b(n),
			"without-subject": !!b(n)?.subject_id,
			linkable: !!b(n)?.subject_id,
			"data-testid": "hooks-keen-activity"
		}, null, 8, [
			"query",
			"without-subject",
			"linkable"
		]));
	}
}), H = /* @__PURE__ */ h({
	__name: "KeenHistorySection",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, n = s(() => I(t.data, t.record));
		return (e, t) => (g(), c(B, {
			query: b(n),
			"without-subject": !!b(n)?.subject_id,
			linkable: "",
			"data-testid": "hooks-keen-history"
		}, null, 8, ["query", "without-subject"]));
	}
}), U = { hooks: { keen: {
	history: "History",
	view_all: "View all",
	load_failed: "The history could not be loaded."
} } }, W = { keen: {
	audit_log: "Audit log",
	filters: {
		source: "Source",
		all_sources: "All sources",
		source_app: "Application",
		action: "Action",
		action_hint: "Exact, or a prefix ending in a dot: product.",
		subject_type: "Record type",
		subject_id: "Record key",
		actor_type: "Actor type",
		actor_id: "Actor key",
		since: "Since",
		until: "Until",
		apply: "Filter",
		clear: "Clear"
	},
	entries: {
		when: "When",
		action: "Action",
		subject: "Record",
		actor: "By",
		surface: "Through",
		app_badge: "App",
		none: "—",
		system: "System",
		empty: "Nothing has been recorded yet.",
		load_failed: "The audit log could not be loaded",
		pagination: "Pagination",
		newest: "Newest",
		newer: "Newer",
		older: "Older"
	},
	record: {
		title: "Record an event",
		action: "Action",
		action_hint: "Dotted and lower case, such as invoice.paid.",
		subject: "Record",
		note: "Note",
		submit: "Record",
		recorded: "Event recorded.",
		failed: "The event could not be recorded.",
		forbidden: "You don't have permission to record events."
	},
	entry: {
		title: "Audit entry",
		back: "Audit log",
		details: "Details",
		source: "Source",
		subject: "Record",
		actor: "By",
		scope: "Scope",
		surface: "Through",
		ip: "IP address",
		user_agent: "User agent",
		hash: "Hash",
		changes: "Changes",
		not_found: "Entry not found",
		not_found_description: "No audit entry has this key, or it is not yours to see.",
		load_failed: "This entry could not be loaded"
	},
	changes: {
		none: "No fields changed.",
		field: "Field",
		before: "Before",
		after: "After"
	},
	history: {
		title: "{package} audit log",
		not_found: "No history here",
		not_found_description: "{package} does not audit, or its history is not yours to read."
	}
} }, G = [
	{
		path: "/keen/entries/:entry",
		name: "keen-entries-entry",
		component: () => import("./chunks/_entry_-C6jPC6jv.js")
	},
	{
		path: "/keen/entries",
		name: "keen-entries",
		component: () => import("./chunks/entries-B9TG9_Q5.js")
	},
	{
		path: "/keen/history/:package",
		name: "keen-history-package",
		component: () => import("./chunks/_package_-TR91xka7.js")
	}
], K = {
	"keen.entries": "keen-entries",
	"keen.entry": "keen-entries-entry",
	"keen.history": "keen-history-package"
}, q = n({
	key: "keen",
	routes: G,
	screens: K,
	extensions: {
		"keen.history": H,
		"keen.activity": V
	},
	liveResolvers: { "keen.history": N },
	messages: { en: i(U, W) }
});
export { q as default, K as screens };
