import { a as e, i as t, t as n } from "./chunks/cortex-Bp7gHDgF.js";
import { t as r } from "./chunks/CortexLoad-Bz-c2t3K.js";
import { t as i } from "./chunks/CortexActionError-BnFnixGr.js";
import { AtriumNoAccess as a, defineAtriumModule as o, integrationData as s, mergeAtriumMessages as c, useAtriumI18n as l, useAtriumIntegration as u } from "@refactor-circus/atrium";
import { UAlert as d, UBadge as f, UButton as p, UCard as m, UFormField as h, UInput as g, USkeleton as _ } from "@refactor-circus/atrium/ui";
import { Fragment as v, computed as y, createBlock as b, createCommentVNode as x, createElementBlock as S, createElementVNode as C, createVNode as w, defineComponent as T, isRef as E, openBlock as D, ref as O, renderList as k, toDisplayString as A, unref as j, withCtx as M, withModifiers as N } from "vue";
import { useI18n as P } from "vue-i18n";
// src/components/CortexSettingsPanel.vue?vue&type=script&setup=true&lang.ts
var F = { "data-testid": "cortex-settings-panel" }, I = { class: "flex flex-col gap-4" }, L = { class: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" }, R = { class: "text-sm text-muted" }, z = { class: "text-2xl font-semibold" }, B = { class: "font-medium" }, V = /* @__PURE__ */ T({
	__name: "CortexSettingsPanel",
	props: { data: {} },
	setup(t) {
		let { t: i } = P(), { data: a, pending: o, failed: s, status: c } = e(async (e) => n(await e.GET("/settings-summary")).data), l = y(() => a.value ? [
			{
				key: "providers",
				label: i("cortex.settings.providers"),
				value: a.value.providers.length
			},
			{
				key: "tools",
				label: i("cortex.settings.tools"),
				value: a.value.tool_count
			},
			{
				key: "agents",
				label: i("cortex.settings.concrete_agents"),
				value: a.value.agent_count
			},
			{
				key: "servers",
				label: i("cortex.settings.servers"),
				value: a.value.server_count
			}
		] : []);
		return (e, t) => {
			let n = m, u = f;
			return D(), S("div", F, [w(r, {
				ready: !j(o) && j(a) !== null,
				failed: j(s),
				status: j(c)
			}, {
				default: M(() => [C("div", I, [C("div", L, [(D(!0), S(v, null, k(j(l), (e) => (D(), b(n, {
					key: e.key,
					"data-testid": `cortex-stat-${e.key}`
				}, {
					default: M(() => [C("p", R, A(e.label), 1), C("p", z, A(e.value), 1)]),
					_: 2
				}, 1032, ["data-testid"]))), 128))]), w(n, null, {
					header: M(() => [C("h3", B, A(j(i)("cortex.settings.cache")), 1)]),
					default: M(() => [w(u, {
						color: j(a)?.cache_enabled ? "success" : "neutral",
						variant: "subtle",
						label: j(a)?.cache_enabled ? j(i)("cortex.settings.enabled") : j(i)("cortex.settings.disabled"),
						"data-status": j(a)?.cache_enabled ? "enabled" : "disabled",
						"data-testid": "cortex-cache"
					}, null, 8, [
						"color",
						"label",
						"data-status"
					])]),
					_: 1
				})])]),
				_: 1
			}, 8, [
				"ready",
				"failed",
				"status"
			])]);
		};
	}
});
// src/components/hooks/hooks.ts
function H(e) {
	return typeof e == "number" && Number.isFinite(e) ? String(e) : typeof e == "string" && e !== "" ? e : null;
}
function U(e) {
	return typeof e == "string" && e !== "" ? e : null;
}
function W(e, t) {
	let n = U(e.owner_type), r = H(t);
	return n && r ? {
		type: n,
		id: r
	} : null;
}
// src/components/hooks/CortexRedirectDomains.vue?vue&type=script&setup=true&lang.ts
var G = {
	key: 0,
	class: "space-y-3",
	"data-testid": "hooks-redirect-domains"
}, K = { class: "text-sm text-muted" }, q = {
	key: 0,
	class: "atrium-empty",
	"data-testid": "hooks-redirect-domains-empty"
}, J = {
	key: 1,
	class: "divide-y divide-default text-sm"
}, Y = ["data-testid"], ee = { class: "truncate text-xs" }, X = /* @__PURE__ */ T({
	__name: "CortexRedirectDomains",
	props: {
		data: {},
		record: {}
	},
	setup(r) {
		let o = r, { t: s } = P(), c = t(), l = c.busy, u = y(() => W(o.data, o.record)), f = O(""), { client: m, data: T, pending: F, failed: I, status: L, reload: R } = e(async (e) => u.value ? n(await e.GET("/redirect-domains", { params: { query: {
			owner_type: u.value.type,
			owner_id: u.value.id
		} } })).data : []), z = y(() => T.value ?? []);
		async function B() {
			let e = u.value;
			m && e && await c.run(async () => n(await m.POST("/redirect-domains", { body: {
				domain: f.value,
				owner_type: e.type,
				owner_id: e.id
			} }))) && (f.value = "", await R());
		}
		async function V(e) {
			m && await c.run(async () => n(await m.DELETE("/redirect-domains/{domain}", { params: { path: { domain: e.id } } }))) && await R();
		}
		return (e, t) => {
			let n = a, r = d, o = _, y = p, T = g, O = h;
			return j(u) && j(m) ? (D(), S("div", G, [j(L) === 403 ? (D(), b(n, {
				key: 0,
				compact: ""
			})) : j(I) ? (D(), b(r, {
				key: 1,
				color: "error",
				variant: "subtle",
				title: j(s)("hooks.redirect_domains.load_failed"),
				"data-testid": "hooks-redirect-domains-failed"
			}, null, 8, ["title"])) : j(F) ? (D(), b(o, {
				key: 2,
				class: "h-16"
			})) : (D(), S(v, { key: 3 }, [
				C("p", K, A(j(s)("hooks.redirect_domains.description")), 1),
				w(i, {
					forbidden: j(c).forbidden.value,
					message: j(c).message.value
				}, null, 8, ["forbidden", "message"]),
				j(z).length === 0 ? (D(), S("p", q, A(j(s)("hooks.redirect_domains.empty")), 1)) : (D(), S("ul", J, [(D(!0), S(v, null, k(j(z), (e) => (D(), S("li", {
					key: e.id,
					class: "flex items-center justify-between gap-2 py-2",
					"data-testid": `hooks-redirect-domain-${e.id}`
				}, [C("code", ee, A(e.domain), 1), w(y, {
					size: "xs",
					color: "neutral",
					variant: "ghost",
					icon: "i-lucide-trash",
					label: j(s)("hooks.redirect_domains.remove"),
					loading: j(l),
					"data-testid": `hooks-remove-redirect-domain-${e.id}`,
					onClick: (t) => V(e)
				}, null, 8, [
					"label",
					"loading",
					"data-testid",
					"onClick"
				])], 8, Y))), 128))])),
				C("form", {
					class: "flex flex-wrap items-end gap-2",
					"data-testid": "hooks-add-redirect-domain-form",
					onSubmit: N(B, ["prevent"])
				}, [w(O, {
					label: j(s)("hooks.redirect_domains.domain"),
					error: j(c).error("domain"),
					class: "min-w-48 flex-1",
					required: ""
				}, {
					default: M(() => [w(T, {
						modelValue: j(f),
						"onUpdate:modelValue": t[0] ||= (e) => E(f) ? f.value = e : null,
						placeholder: "https://claude.ai",
						class: "w-full",
						"data-testid": "hooks-redirect-domain"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label", "error"]), w(y, {
					type: "submit",
					icon: "i-lucide-plus",
					label: j(s)("hooks.redirect_domains.add"),
					loading: j(l),
					"data-testid": "hooks-add-redirect-domain"
				}, null, 8, ["label", "loading"])], 32)
			], 64))])) : x("", !0);
		};
	}
}), te = { cortex: {
	actions: "Actions",
	edit: "Edit",
	delete: "Delete",
	previous: "Previous page",
	next: "Next page",
	page: "Page {page} of {last}",
	state: {
		not_found: "Not found.",
		load_failed: "Cortex could not be reached.",
		action_forbidden: "You may not do that."
	},
	agent: {
		name: "Name",
		slug: "Slug",
		slug_hint: "Letters, numbers, dashes and underscores. This cannot be changed later.",
		description: "Description",
		prompt: "Prompt",
		prompt_hint: "Saving a changed prompt adds a new version and publishes it. Earlier versions can be republished below.",
		provider: "Provider",
		provider_default: "Default",
		model: "Model",
		settings: "Settings",
		temperature: "Temperature",
		max_steps: "Max steps",
		max_tokens: "Max tokens",
		top_p: "Top p",
		tools: "Tools",
		sub_agents: "Sub-agents",
		concrete_sub_agents: "Concrete sub-agents",
		save: "Save agent",
		cancel: "Cancel"
	},
	virtual_agents: {
		title: "Virtual agents",
		new: "New virtual agent",
		empty: "No virtual agents yet.",
		confirm_delete: "Are you sure? This cannot be undone."
	},
	concrete_agents: {
		title: "Concrete agents",
		description: "Agents defined in code. Their prompt and tools can be overridden here.",
		empty: "No concrete agents are registered.",
		not_overridable: "This agent does not support overrides, so its prompt cannot be overridden here."
	},
	tools: {
		title: "Tools",
		empty: "No tools match.",
		search: "Search tools",
		selected_only: "Selected only",
		selected: "{count} selected",
		all_tags: "All tags",
		tags: "Tags",
		description: "Description",
		description_title: "Description of {tool}",
		edit_description: "Description",
		overridden: "Overridden",
		count: "Tools: {count}",
		save: "Save tools",
		restore: "Use the tools declared in code",
		confirm_restore: "Use the tools declared in code again? The saved tool list is removed."
	},
	servers: {
		title: "Servers",
		empty: "No MCP servers are registered.",
		instructions: "Instructions",
		instructions_title: "Instructions of {server}",
		edit_instructions: "Instructions and tools",
		missing_tools: "Missing: {tools}",
		confirm_empty: "Serve no tools",
		confirm_empty_needed: "Check \"Serve no tools\" to save with no tool checked: the server then serves no tools at all."
	},
	versions: {
		title: "Versions",
		none: "No versions yet.",
		published: "Published",
		overridden: "Overridden (v{version})",
		from_code: "From code",
		override_hint: "The published override replaces what is declared in code.",
		no_override_hint: "No override exists, so the value declared in code is used.",
		view: "View",
		hide: "Hide",
		publish: "Publish",
		new: "New version",
		content: "Content",
		publish_now: "Publish it now",
		add: "Save version",
		remove: "Remove override",
		confirm_remove: "Remove the override? The value declared in code is used again."
	},
	redirect_domains: {
		title: "Redirect domains",
		description: "Every origin MCP clients may register OAuth redirect URIs on: global ones added here, and those organizations and users add. Each user still approves the client.",
		add: "Add domain",
		domain: "Domain",
		domain_hint: "A host, origin or full redirect URL; only the origin is kept. A bare host is taken as https.",
		source: "Source",
		global: "Global",
		created: "Created",
		remove: "Remove",
		empty: "No redirect domains yet."
	},
	run: {
		title: "Run agent",
		run: "Run",
		none: "There are no agents you may run.",
		agent: "Agent",
		select_agent: "Select an agent",
		input: "Input",
		response: "Response",
		usage: "Usage"
	},
	settings: {
		providers: "Providers",
		tools: "Registered tools",
		concrete_agents: "Concrete agents",
		servers: "MCP servers",
		cache: "Cache",
		enabled: "Enabled",
		disabled: "Disabled"
	},
	search: {
		virtual_agent: "Virtual agent",
		concrete_agent: "Concrete agent"
	}
} }, ne = { hooks: { redirect_domains: {
	description: "The OAuth redirect domains this record's MCP clients may use.",
	empty: "No redirect domains yet.",
	domain: "Domain",
	add: "Add domain",
	remove: "Remove",
	load_failed: "The redirect domains could not be loaded."
} } }, re = [
	{
		path: "/cortex/concrete-agents/:agent",
		name: "cortex-concrete-agents-agent",
		component: () => import("./chunks/_agent_-CSAjUzyx.js")
	},
	{
		path: "/cortex/concrete-agents",
		name: "cortex-concrete-agents",
		component: () => import("./chunks/concrete-agents-C0NJt22A.js")
	},
	{
		path: "/cortex/redirect-domains",
		name: "cortex-redirect-domains",
		component: () => import("./chunks/redirect-domains-HWJnWKkO.js")
	},
	{
		path: "/cortex/run",
		name: "cortex-run",
		component: () => import("./chunks/run-DwgMeIwc.js")
	},
	{
		path: "/cortex/servers/:server/instructions",
		name: "cortex-servers-server-instructions",
		component: () => import("./chunks/instructions-BjIUK3XN.js")
	},
	{
		path: "/cortex/servers",
		name: "cortex-servers",
		component: () => import("./chunks/servers-lZ0dYN2i.js")
	},
	{
		path: "/cortex/tools/:tool/description",
		name: "cortex-tools-tool-description",
		component: () => import("./chunks/description-DVj0ak8m.js")
	},
	{
		path: "/cortex/tools",
		name: "cortex-tools",
		component: () => import("./chunks/tools-ByTelfDQ.js")
	},
	{
		path: "/cortex/virtual-agents/:slug",
		name: "cortex-virtual-agents-slug",
		component: () => import("./chunks/_slug_-48BB78_8.js")
	},
	{
		path: "/cortex/virtual-agents/create",
		name: "cortex-virtual-agents-create",
		component: () => import("./chunks/create-h4vWqo6W.js")
	},
	{
		path: "/cortex/virtual-agents",
		name: "cortex-virtual-agents",
		component: () => import("./chunks/virtual-agents-DCTpTRmG.js")
	}
], Z = {
	"cortex.virtual-agents": "cortex-virtual-agents",
	"cortex.virtual-agent-create": "cortex-virtual-agents-create",
	"cortex.virtual-agent": "cortex-virtual-agents-slug",
	"cortex.concrete-agents": "cortex-concrete-agents",
	"cortex.concrete-agent": "cortex-concrete-agents-agent",
	"cortex.tools": "cortex-tools",
	"cortex.tool-description": "cortex-tools-tool-description",
	"cortex.servers": "cortex-servers",
	"cortex.server-instructions": "cortex-servers-server-instructions",
	"cortex.redirect-domains": "cortex-redirect-domains",
	"cortex.run": "cortex-run"
};
function Q(e) {
	return e.type === "concrete_agent" ? `/cortex/concrete-agents/${encodeURIComponent(e.key)}` : `/cortex/virtual-agents/${encodeURIComponent(e.key)}`;
}
async function $(e, { limit: t }) {
	let { client: n } = u("cortex"), { t: r } = l();
	return n ? s(await n.GET("/search", { params: { query: { q: e } } })).data.slice(0, t).map((e) => ({
		title: e.name,
		subtitle: e.type === "concrete_agent" ? r("cortex.search.concrete_agent") : r("cortex.search.virtual_agent"),
		icon: e.type === "concrete_agent" ? "i-lucide-cpu" : "i-lucide-sparkles",
		group: null,
		link: {
			path: Q(e),
			external: !1
		}
	})) : [];
}
var ie = o({
	key: "cortex",
	routes: re,
	screens: Z,
	extensions: {
		"cortex.mcp": X,
		"cortex.redirect-domains": X
	},
	settingsPanels: { cortex: V },
	searchSources: { cortex: $ },
	messages: { en: c(te, ne) }
});
export { Q as cortexAgentPath, ie as default, Z as screens, $ as searchCortex };
