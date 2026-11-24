import { C as e, S as t, _ as n, a as r, f as i } from "./chunks/shared-N5-QMPBo.js";
import { t as a } from "./chunks/ImpexStatusBadge-ePLj75gE.js";
import { t as o } from "./chunks/ImpexState-Mg53d6po.js";
import { AtriumErrorCard as s, AtriumNoAccess as c, AtriumStat as l, defineAtriumModule as u, integrationData as d, mergeAtriumMessages as f, useAtriumIntegration as p } from "@refactor-circus/atrium";
import { UButton as ee, UCard as te, USkeleton as m } from "@refactor-circus/atrium/ui";
import { Fragment as h, computed as g, createBlock as _, createCommentVNode as v, createElementBlock as y, createElementVNode as b, createTextVNode as ne, createVNode as x, defineComponent as S, openBlock as C, renderList as w, resolveComponent as re, toDisplayString as T, unref as E, withCtx as D } from "vue";
import { useI18n as O } from "vue-i18n";
// src/components/MessageVolumeWidget.vue?vue&type=script&setup=true&lang.ts
var k = {
	key: 3,
	class: "grid grid-cols-2 gap-2 text-sm",
	"data-testid": "impex-message-volume"
}, A = { "data-testid": "impex-message-volume-inbound" }, j = { "data-testid": "impex-message-volume-outbound" }, M = { class: "col-span-2 text-xs text-muted" }, N = /* @__PURE__ */ S({
	__name: "MessageVolumeWidget",
	props: {
		data: {},
		settings: {}
	},
	setup(t) {
		let { t: n } = O(), r = e(), i = g(() => r.data.value?.messages ?? null);
		return (e, t) => {
			let a = c, o = s, u = m, d = l;
			return E(r).forbidden.value ? (C(), _(a, {
				key: 0,
				compact: ""
			})) : E(r).status.value === "error" ? (C(), _(o, {
				key: 1,
				message: E(n)("atrium.widget.failed")
			}, null, 8, ["message"])) : E(r).status.value === "success" ? E(i) ? (C(), y("div", k, [
				x(d, {
					label: E(n)("impex.widgets.inbound"),
					icon: "i-lucide-arrow-down-left",
					tone: "primary"
				}, {
					value: D(() => [b("span", A, T(E(i).inbound), 1)]),
					_: 1
				}, 8, ["label"]),
				x(d, {
					label: E(n)("impex.widgets.outbound"),
					icon: "i-lucide-arrow-up-right"
				}, {
					value: D(() => [b("span", j, T(E(i).outbound), 1)]),
					_: 1
				}, 8, ["label"]),
				b("p", M, T(E(n)("impex.widgets.window", { hours: E(i).window_hours })), 1)
			])) : v("", !0) : (C(), _(u, {
				key: 2,
				class: "h-10"
			}));
		};
	}
}), P = { "data-testid": "impex-recent-failures" }, F = {
	key: 3,
	class: "text-sm text-muted"
}, I = {
	key: 4,
	class: "divide-y divide-default text-sm"
}, L = { class: "shrink-0 text-xs text-muted" }, R = /* @__PURE__ */ S({
	__name: "RecentFailuresWidget",
	props: {
		data: {},
		settings: {}
	},
	setup(t) {
		let { t: r } = O(), a = e(), o = g(() => a.data.value?.runs.recent_failures ?? null);
		return (e, t) => {
			let l = c, u = s, d = m, f = re("RouterLink");
			return C(), y("div", P, [E(a).forbidden.value ? (C(), _(l, {
				key: 0,
				compact: ""
			})) : E(a).status.value === "error" ? (C(), _(u, {
				key: 1,
				message: E(r)("atrium.widget.failed")
			}, null, 8, ["message"])) : E(o) ? E(o).length === 0 ? (C(), y("p", F, T(E(r)("impex.widgets.no_failures")), 1)) : (C(), y("ul", I, [(C(!0), y(h, null, w(E(o), (e) => (C(), y("li", {
				key: e.id,
				class: "flex items-center justify-between gap-2 py-1.5"
			}, [x(f, {
				to: E(n)(e.id),
				class: "truncate font-medium hover:underline",
				"data-testid": `impex-failure-${e.id}`
			}, {
				default: D(() => [ne(T(e.flow), 1)]),
				_: 2
			}, 1032, ["to", "data-testid"]), b("span", L, T(E(i)(e.finished_at)), 1)]))), 128))])) : (C(), _(d, {
				key: 2,
				class: "h-16"
			}))]);
		};
	}
}), z = { "data-testid": "impex-run-status" }, B = {
	key: 3,
	class: "space-y-3"
}, V = {
	class: "text-sm text-muted",
	"data-testid": "impex-run-status-active"
}, H = { class: "grid grid-cols-2 gap-2 text-sm" }, U = ["data-testid"], W = { class: "font-medium tabular-nums" }, ie = /* @__PURE__ */ S({
	__name: "RunStatusWidget",
	props: {
		data: {},
		settings: {}
	},
	setup(t) {
		let { t: n } = O(), i = e(), o = g(() => i.data.value?.runs ?? null);
		return (e, t) => {
			let l = c, u = s, d = m;
			return C(), y("div", z, [E(i).forbidden.value ? (C(), _(l, {
				key: 0,
				compact: ""
			})) : E(i).status.value === "error" ? (C(), _(u, {
				key: 1,
				message: E(n)("atrium.widget.failed")
			}, null, 8, ["message"])) : E(o) ? (C(), y("div", B, [b("p", V, T(E(n)("impex.widgets.active", { count: E(o).active })), 1), b("ul", H, [(C(!0), y(h, null, w(E(r), (e) => (C(), y("li", {
				key: e,
				class: "flex items-center justify-between gap-2",
				"data-testid": `impex-run-status-${e}`
			}, [x(a, { status: e }, null, 8, ["status"]), b("span", W, T(E(o).by_status[e] ?? 0), 1)], 8, U))), 128))])])) : (C(), _(d, {
				key: 2,
				class: "h-16"
			}))]);
		};
	}
}), G = { "data-testid": "impex-settings" }, K = { class: "grid gap-4 md:grid-cols-3" }, q = { class: "font-medium" }, J = { class: "space-y-2 text-sm" }, Y = ["data-row"], ae = { class: "text-muted" }, oe = { class: "font-medium tabular-nums" }, se = /* @__PURE__ */ S({
	__name: "SettingsPanel",
	props: { data: {} },
	setup(e) {
		let { t: n } = O(), r = t(async (e) => d(await e.GET("/settings-summary")).data), i = (e) => n("impex.settings.days", { count: e }), a = (e) => n("impex.settings.seconds", { count: e }), s = (e) => n("impex.settings.bytes", { count: e }), c = g(() => {
			let e = r.data.value;
			return e ? [
				{
					key: "retention",
					title: n("impex.settings.retention"),
					rows: [
						{
							key: "completed_runs_days",
							label: n("impex.settings.completed_runs"),
							value: i(e.retention.completed_runs_days)
						},
						{
							key: "failed_runs_days",
							label: n("impex.settings.failed_runs"),
							value: i(e.retention.failed_runs_days)
						},
						{
							key: "messages_days",
							label: n("impex.settings.messages"),
							value: i(e.retention.messages_days)
						},
						{
							key: "artifacts_days",
							label: n("impex.settings.artifacts"),
							value: i(e.retention.artifacts_days)
						},
						{
							key: "events_days",
							label: n("impex.settings.events"),
							value: i(e.retention.events_days)
						},
						{
							key: "deliveries_days",
							label: n("impex.settings.deliveries"),
							value: i(e.retention.deliveries_days)
						}
					]
				},
				{
					key: "limits",
					title: n("impex.settings.limits"),
					rows: [
						{
							key: "max_step_seconds",
							label: n("impex.settings.max_step"),
							value: a(e.limits.max_step_seconds)
						},
						{
							key: "resume_margin_seconds",
							label: n("impex.settings.resume_margin"),
							value: a(e.limits.resume_margin_seconds)
						},
						{
							key: "lease_seconds",
							label: n("impex.settings.lease"),
							value: a(e.limits.lease_seconds)
						},
						{
							key: "lock_seconds",
							label: n("impex.settings.lock"),
							value: a(e.limits.lock_seconds)
						},
						{
							key: "max_resumptions",
							label: n("impex.settings.max_resumptions"),
							value: String(e.limits.max_resumptions)
						},
						{
							key: "fan_out_max",
							label: n("impex.settings.fan_out_max"),
							value: String(e.limits.fan_out_max)
						},
						{
							key: "sync_seconds",
							label: n("impex.settings.sync"),
							value: a(e.limits.sync_seconds)
						}
					]
				},
				{
					key: "artifacts",
					title: n("impex.settings.artifact_storage"),
					rows: [
						{
							key: "disk",
							label: n("impex.settings.disk"),
							value: e.artifacts.disk ?? n("impex.settings.default_disk")
						},
						{
							key: "path",
							label: n("impex.settings.path"),
							value: e.artifacts.path
						},
						{
							key: "inline_threshold",
							label: n("impex.settings.inline_threshold"),
							value: s(e.artifacts.inline_threshold)
						},
						{
							key: "memo_bytes",
							label: n("impex.settings.memo"),
							value: s(e.artifacts.memo_bytes)
						},
						{
							key: "preview_bytes",
							label: n("impex.settings.preview_bytes"),
							value: s(e.preview_bytes)
						}
					]
				}
			] : [];
		});
		return (e, t) => {
			let n = te;
			return C(), y("div", G, [x(o, {
				error: E(r).error.value,
				ready: E(r).data.value !== null
			}, {
				default: D(() => [b("div", K, [(C(!0), y(h, null, w(E(c), (e) => (C(), _(n, {
					key: e.key,
					"data-testid": `impex-settings-${e.key}`
				}, {
					header: D(() => [b("h3", q, T(e.title), 1)]),
					default: D(() => [b("dl", J, [(C(!0), y(h, null, w(e.rows, (e) => (C(), y("div", {
						key: e.key,
						class: "flex justify-between gap-3",
						"data-row": e.key
					}, [b("dt", ae, T(e.label), 1), b("dd", oe, T(e.value), 1)], 8, Y))), 128))])]),
					_: 2
				}, 1032, ["data-testid"]))), 128))])]),
				_: 1
			}, 8, ["error", "ready"])]);
		};
	}
});
// src/components/hooks/hooks.ts
function ce(e) {
	return typeof e == "number" && Number.isFinite(e) ? String(e) : typeof e == "string" && e !== "" ? e : null;
}
function le(e) {
	let t = ce(e);
	return t === null ? null : `/impex/runs/${encodeURIComponent(t)}`;
}
// src/components/hooks/ImpexRunLink.vue
var X = /* @__PURE__ */ S({
	__name: "ImpexRunLink",
	props: {
		data: {},
		record: {}
	},
	setup(e) {
		let t = e, { t: n } = O(), r = g(() => le(t.record));
		return (e, t) => {
			let i = ee;
			return E(r) ? (C(), _(i, {
				key: 0,
				to: E(r),
				size: "xs",
				color: "neutral",
				variant: "ghost",
				icon: "i-lucide-workflow",
				label: E(n)("hooks.run_link.label"),
				"data-testid": "hooks-impex-run-link"
			}, null, 8, ["to", "label"])) : v("", !0);
		};
	}
}), ue = { hooks: { run_link: { label: "Run" } } }, de = { impex: {
	common: {
		not_found_title: "Not found",
		not_found_description: "It may have been deleted, or the link is wrong.",
		load_failed: "This failed to load.",
		action_forbidden: "You may not do that.",
		filter: "Filter",
		clear: "Clear",
		none: "None",
		load_more: "Load more",
		cancel: "Cancel",
		save: "Save"
	},
	statuses: {
		pending: "Pending",
		running: "Running",
		waiting: "Waiting",
		rolling_back: "Rolling back",
		completed: "Completed",
		failed: "Failed",
		cancelled: "Cancelled",
		undone: "Undone",
		skipped: "Skipped",
		active: "Active",
		disabled: "Disabled",
		paused: "Paused",
		succeeded: "Succeeded"
	},
	directions: {
		inbound: "Inbound",
		outbound: "Outbound"
	},
	body_policies: {
		all: "Keep every body",
		failures: "Keep failed bodies only",
		none: "Keep no bodies"
	},
	widgets: {
		active: "{count} active",
		no_failures: "No failed runs.",
		inbound: "Inbound",
		outbound: "Outbound",
		window: "Over the last {hours} hours"
	},
	settings: {
		days: "{count} days",
		seconds: "{count} seconds",
		bytes: "{count} bytes",
		retention: "Retention",
		completed_runs: "Completed runs",
		failed_runs: "Failed runs",
		messages: "Messages",
		artifacts: "Artifacts",
		events: "Stream events",
		deliveries: "Deliveries",
		limits: "Limits",
		max_step: "Longest step",
		resume_margin: "Resume margin",
		lease: "Lease",
		lock: "Lock",
		max_resumptions: "Most resumptions",
		fan_out_max: "Largest fan-out",
		sync: "Synchronous wait",
		artifact_storage: "Artifact storage",
		disk: "Disk",
		default_disk: "The default disk",
		path: "Path",
		inline_threshold: "Stored inline below",
		memo: "Memo size",
		preview_bytes: "Body preview"
	},
	runs: {
		title: "Runs",
		all_statuses: "Any status",
		status: "Status",
		all_triggers: "Any trigger",
		trigger: "Trigger",
		flow: "Flow",
		empty: "No runs.",
		started: "Started",
		finished: "Finished"
	},
	run: {
		id: "Run",
		cancel: "Cancel",
		cancelled: "The run was cancelled.",
		cancelled_from_dashboard: "Cancelled from the dashboard.",
		retry: "Retry",
		retried: "The run is being retried.",
		idempotency_key: "Idempotency key",
		parent: "Parent run",
		tags: "Tags",
		error: "Error",
		signal_title: "Send a signal",
		signal_name: "Signal name",
		signal_payload: "Payload (JSON, optional)",
		send: "Send",
		signal_sent: "The signal was sent.",
		signal_ignored: "The run has finished; nothing was delivered.",
		payload_invalid: "The payload is not valid JSON.",
		steps: "Steps",
		no_steps: "No steps yet.",
		rollback: "Rollback",
		undone: "Undone",
		attempts: "{count} attempts",
		resumed: "Resumed {count} times",
		result_on_disk: "Result on disk",
		messages: "Messages",
		no_messages: "This run sent and received no messages."
	},
	flows: {
		title: "Flows",
		empty: "No flows are registered.",
		slug: "Flow",
		schedule: "Schedule",
		state: "State",
		enabled: "Enabled",
		disabled: "Disabled",
		run: "Run",
		arguments: "Arguments (JSON, optional)",
		arguments_invalid: "The arguments must be a JSON array or object."
	},
	messages: {
		title: "Messages",
		all_directions: "Any direction",
		direction: "Direction",
		channel: "Channel",
		empty: "No messages.",
		endpoint: "Endpoint",
		status_code: "Status",
		when: "When",
		transport: "Transport"
	},
	message: {
		verified: "Verified",
		bad_signature: "Bad signature",
		unsigned: "Unsigned",
		duration: "Duration",
		milliseconds: "{count} ms",
		size: "Size",
		bytes: "{count} bytes",
		signature: "Signature",
		run: "Run",
		headers: "Headers",
		body: "Body",
		empty_body: "No body was kept.",
		body_on_disk: "The full body is on the artifact disk ({id})."
	},
	channels: {
		title: "Channels",
		new: "New channel",
		empty: "No channels.",
		name: "Name",
		direction: "Direction",
		transport: "Transport",
		status: "Status",
		source: "Source",
		stored: "Stored",
		from_config: "From config"
	},
	channel: {
		create_title: "New channel",
		create: "Create channel",
		name_hint: "Lowercase, dotted or dashed. It cannot be renamed later.",
		edit: "Edit channel",
		updated: "The channel was updated.",
		body_policy: "Body policy",
		signing_secret: "Signing secret",
		signing_secret_hint: "Leave blank to keep the current secret.",
		options: "Options",
		options_hint: "The transport's settings, as a JSON object.",
		options_invalid: "The options must be a JSON object.",
		rotate_secret: "Rotate secret",
		secret_rotated: "The secret was rotated. Copy it now, it is not shown again: {secret}",
		delete: "Delete",
		delete_confirm: "Delete this channel",
		flow: "Flow",
		configured_hint: "This channel comes from config. Change it there."
	},
	subscriptions: {
		title: "Subscriptions",
		stream: "Stream",
		all_statuses: "Any status",
		status: "Status",
		empty: "No subscriptions.",
		subscriber: "Subscriber",
		endpoint: "Endpoint",
		feed_only: "Feed only",
		failures: "Failures",
		last_delivered: "Last delivered"
	},
	subscription: {
		pause: "Pause",
		paused: "The subscription was paused.",
		resume: "Resume",
		resumed: "The subscription was resumed.",
		ping: "Ping",
		ping_succeeded: "The endpoint answered.",
		ping_failed: "The ping failed: {error}",
		replay_from: "Replay from event",
		replay: "Replay",
		replaying: "The subscription will replay from that event.",
		replay_invalid: "Enter an event number.",
		topics: "Topics",
		selection: "Selection",
		format: "Format",
		cursor: "Cursor",
		paused_until: "Paused until",
		last_error: "Last error",
		deliveries: "Deliveries",
		no_deliveries: "No deliveries yet.",
		events: "Events"
	}
} }, fe = [
	{
		path: "/impex/channels/:name",
		name: "impex-channels-name",
		component: () => import("./chunks/_name_-axbgmjiq.js")
	},
	{
		path: "/impex/channels/create",
		name: "impex-channels-create",
		component: () => import("./chunks/create-CSemm9pr.js")
	},
	{
		path: "/impex/channels",
		name: "impex-channels",
		component: () => import("./chunks/channels-Db4T_mvI.js")
	},
	{
		path: "/impex/flows",
		name: "impex-flows",
		component: () => import("./chunks/flows-C0nhkDYK.js")
	},
	{
		path: "/impex/messages/:message",
		name: "impex-messages-message",
		component: () => import("./chunks/_message_-B3tEy3pn.js")
	},
	{
		path: "/impex/messages",
		name: "impex-messages",
		component: () => import("./chunks/messages-CV7PL5m6.js")
	},
	{
		path: "/impex/runs/:run",
		name: "impex-runs-run",
		component: () => import("./chunks/_run_-Df5OE-2R.js")
	},
	{
		path: "/impex/runs",
		name: "impex-runs",
		component: () => import("./chunks/runs-C8rC3vYe.js")
	},
	{
		path: "/impex/subscriptions/:subscription",
		name: "impex-subscriptions-subscription",
		component: () => import("./chunks/_subscription_-BGYOUQ4o.js")
	},
	{
		path: "/impex/subscriptions",
		name: "impex-subscriptions",
		component: () => import("./chunks/subscriptions-Beu1ZWUn.js")
	}
], Z = {
	"impex.runs": "impex-runs",
	"impex.run": "impex-runs-run",
	"impex.flows": "impex-flows",
	"impex.messages": "impex-messages",
	"impex.message": "impex-messages-message",
	"impex.channels": "impex-channels",
	"impex.channel-create": "impex-channels-create",
	"impex.channel": "impex-channels-name",
	"impex.subscriptions": "impex-subscriptions",
	"impex.subscription": "impex-subscriptions-subscription"
};
async function Q(e, t) {
	let { client: r } = p("impex");
	return r ? d(await r.GET("/search", { params: { query: {
		q: e,
		limit: t.limit
	} } })).data.slice(0, t.limit).map((e) => ({
		title: e.flow,
		subtitle: e.status,
		icon: null,
		group: null,
		link: {
			path: n(e.id),
			external: !1
		}
	})) : [];
}
async function $() {
	let { client: e } = p("impex");
	if (!e) return { badge: null };
	try {
		let t = d(await e.GET("/stats")).data.runs.active;
		return { badge: t > 0 ? t : null };
	} catch {
		return { badge: null };
	}
}
var pe = u({
	key: "impex",
	routes: fe,
	screens: Z,
	widgets: {
		"impex.run-status": ie,
		"impex.recent-failures": R,
		"impex.message-volume": N
	},
	extensions: { "impex.run-link": X },
	settingsPanels: { impex: se },
	liveResolvers: { "impex.active-runs": $ },
	searchSources: { impex: Q },
	messages: { en: f(ue, de) }
});
export { $ as activeRuns, pe as default, Z as screens, Q as searchRuns };
