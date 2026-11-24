import { t as e } from "./ImpexFlash-BLiiWCOe.js";
import { t } from "./ImpexState-Mg53d6po.js";
import { t as n } from "./ImpexStatusBadge-ePLj75gE.js";
import { S as r, b as i, d as a, f as o, p as s } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as ee, integrationData as c } from "@refactor-circus/atrium";
import { UButton as te, UCard as ne, UFormField as re, UInput as ie } from "@refactor-circus/atrium/ui";
import { Fragment as ae, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, isRef as oe, openBlock as _, ref as v, renderList as se, resolveComponent as ce, toDisplayString as y, unref as b, withCtx as x, withModifiers as le } from "vue";
import { useI18n as ue } from "vue-i18n";
import { useRoute as de } from "vue-router";
// src/pages/subscriptions/[subscription].vue?vue&type=script&setup=true&lang.ts
var S = {
	class: "space-y-4",
	"data-testid": "impex-subscription"
}, C = {
	key: 0,
	class: "space-y-4"
}, w = { class: "flex flex-wrap items-center justify-between gap-3" }, T = { class: "flex items-center gap-3" }, E = { class: "text-xl font-semibold" }, D = { class: "flex gap-2" }, O = {
	class: "grid gap-3 text-sm sm:grid-cols-2",
	"data-testid": "impex-subscription-details"
}, k = { class: "text-muted" }, A = { class: "text-muted" }, j = { class: "text-muted" }, M = { class: "text-muted" }, N = { class: "text-muted" }, P = { class: "font-mono" }, F = { class: "text-muted" }, I = { class: "tabular-nums" }, L = { key: 0 }, R = { class: "text-muted" }, z = {
	key: 1,
	class: "sm:col-span-2"
}, B = { class: "text-muted" }, V = { class: "font-medium" }, H = {
	key: 0,
	class: "text-sm text-muted"
}, U = {
	key: 1,
	class: "w-full text-left text-sm",
	"data-testid": "impex-subscription-deliveries"
}, fe = { class: "text-muted" }, pe = { class: "py-2 pr-3 font-medium" }, me = { class: "py-2 pr-3 font-medium" }, he = { class: "py-2 pr-3 font-medium" }, ge = { class: "py-2 font-medium" }, _e = { class: "divide-y divide-default" }, ve = ["data-testid"], ye = { class: "py-2 pr-3" }, be = {
	key: 0,
	class: "text-xs text-muted"
}, xe = { class: "py-2 pr-3 tabular-nums" }, Se = { class: "py-2 pr-3" }, Ce = { class: "py-2" }, we = { key: 1 }, W = /* @__PURE__ */ g({
	__name: "[subscription]",
	setup(g) {
		let { t: W } = ue(), Te = de(), G = l(() => String(Te.params.subscription ?? "")), K = r(async (e) => c(await e.GET("/subscriptions/{subscription}", { params: { path: { subscription: G.value } } })).data, G), q = r(async (e) => c(await e.GET("/subscriptions/{subscription}/deliveries", { params: {
			path: { subscription: G.value },
			query: { per_page: 20 }
		} })).data, G), J = i(), Y = v(""), X = l(() => a(K.data.value?.endpoint)), Z = l(() => {
			let e = K.data.value?.last_error?.message;
			return typeof e == "string" ? e : null;
		});
		async function Q() {
			await Promise.all([K.reload(), q.reload()]);
		}
		async function $(e, t) {
			let n = K.client;
			n && await J.run(async () => c(await n.PATCH("/subscriptions/{subscription}", {
				params: { path: { subscription: G.value } },
				body: e
			})), async () => (await Q(), t));
		}
		async function Ee() {
			await $({ status: "paused" }, W("impex.subscription.paused"));
		}
		async function De() {
			await $({ status: "active" }, W("impex.subscription.resumed"));
		}
		async function Oe() {
			let e = String(Y.value).trim(), t = Number(e);
			e === "" || !Number.isInteger(t) || t < 0 ? J.invalid("replay_from", W("impex.subscription.replay_invalid")) : (await $({ replay_from: t }, W("impex.subscription.replaying")), Y.value = "");
		}
		async function ke() {
			let e = K.client;
			e && await J.run(async () => c(await e.POST("/subscriptions/{subscription}/ping", { params: { path: { subscription: G.value } } })), async (e) => (await Q(), s(e.data.successful) ? W("impex.subscription.ping_succeeded") : W("impex.subscription.ping_failed", { error: String(e.data.error ?? "") })));
		}
		return (r, i) => {
			let a = te, s = ne, c = ie, l = re, g = ce("RouterLink"), v = ee;
			return _(), f("div", S, [h(v, {
				"screen-key": "impex.subscription",
				record: b(G)
			}, {
				default: x(() => [h(t, {
					error: b(K).error.value,
					ready: b(K).data.value !== null
				}, {
					default: x(() => [b(K).data.value ? (_(), f("div", C, [
						p("header", w, [p("div", T, [p("h1", E, y(b(K).data.value.stream), 1), h(n, { status: b(K).data.value.status }, null, 8, ["status"])]), p("div", D, [b(K).data.value.status === "active" ? (_(), u(a, {
							key: 0,
							variant: "outline",
							icon: "i-lucide-pause",
							loading: b(J).busy.value,
							"data-testid": "impex-subscription-pause",
							onClick: Ee
						}, {
							default: x(() => [m(y(b(W)("impex.subscription.pause")), 1)]),
							_: 1
						}, 8, ["loading"])) : (_(), u(a, {
							key: 1,
							variant: "outline",
							icon: "i-lucide-play",
							loading: b(J).busy.value,
							"data-testid": "impex-subscription-resume",
							onClick: De
						}, {
							default: x(() => [m(y(b(W)("impex.subscription.resume")), 1)]),
							_: 1
						}, 8, ["loading"])), b(X) ? (_(), u(a, {
							key: 2,
							variant: "outline",
							icon: "i-lucide-send",
							loading: b(J).busy.value,
							"data-testid": "impex-subscription-ping",
							onClick: ke
						}, {
							default: x(() => [m(y(b(W)("impex.subscription.ping")), 1)]),
							_: 1
						}, 8, ["loading"])) : d("", !0)])]),
						h(e, { action: b(J) }, null, 8, ["action"]),
						h(s, null, {
							default: x(() => [p("dl", O, [
								p("div", null, [p("dt", k, y(b(W)("impex.subscription.topics")), 1), p("dd", null, y(b(K).data.value.topics.join(", ") || b(W)("impex.common.none")), 1)]),
								p("div", null, [p("dt", A, y(b(W)("impex.subscription.selection")), 1), p("dd", null, y(b(K).data.value.selection), 1)]),
								p("div", null, [p("dt", j, y(b(W)("impex.subscription.format")), 1), p("dd", null, y(b(K).data.value.format), 1)]),
								p("div", null, [p("dt", M, y(b(W)("impex.subscriptions.endpoint")), 1), p("dd", null, y(b(X) ?? b(W)("impex.subscriptions.feed_only")), 1)]),
								p("div", null, [p("dt", N, y(b(W)("impex.subscription.cursor")), 1), p("dd", P, y(b(K).data.value.cursor), 1)]),
								p("div", null, [p("dt", F, y(b(W)("impex.subscriptions.failures")), 1), p("dd", I, y(b(K).data.value.failures), 1)]),
								b(K).data.value.paused_until ? (_(), f("div", L, [p("dt", R, y(b(W)("impex.subscription.paused_until")), 1), p("dd", null, y(b(o)(b(K).data.value.paused_until)), 1)])) : d("", !0),
								b(Z) ? (_(), f("div", z, [p("dt", B, y(b(W)("impex.subscription.last_error")), 1), p("dd", null, y(b(Z)), 1)])) : d("", !0)
							])]),
							_: 1
						}),
						h(s, null, {
							default: x(() => [p("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "impex-subscription-replay",
								onSubmit: le(Oe, ["prevent"])
							}, [h(l, {
								label: b(W)("impex.subscription.replay_from"),
								class: "w-48"
							}, {
								default: x(() => [h(c, {
									modelValue: b(Y),
									"onUpdate:modelValue": i[0] ||= (e) => oe(Y) ? Y.value = e : null,
									name: "replay_from",
									type: "number",
									min: "0"
								}, null, 8, ["modelValue"])]),
								_: 1
							}, 8, ["label"]), h(a, {
								type: "submit",
								icon: "i-lucide-rotate-ccw",
								loading: b(J).busy.value
							}, {
								default: x(() => [m(y(b(W)("impex.subscription.replay")), 1)]),
								_: 1
							}, 8, ["loading"])], 32)]),
							_: 1
						}),
						h(s, null, {
							header: x(() => [p("h2", V, y(b(W)("impex.subscription.deliveries")), 1)]),
							default: x(() => [h(t, {
								error: b(q).error.value,
								ready: b(q).data.value !== null
							}, {
								default: x(() => [(b(q).data.value ?? []).length === 0 ? (_(), f("p", H, y(b(W)("impex.subscription.no_deliveries")), 1)) : (_(), f("table", U, [p("thead", fe, [p("tr", null, [
									p("th", pe, y(b(W)("impex.subscriptions.status")), 1),
									p("th", me, y(b(W)("impex.subscription.events")), 1),
									p("th", he, y(b(W)("impex.message.duration")), 1),
									p("th", ge, y(b(W)("impex.messages.when")), 1)
								])]), p("tbody", _e, [(_(!0), f(ae, null, se(b(q).data.value, (e) => (_(), f("tr", {
									key: e.id,
									"data-testid": `impex-delivery-${e.id}`
								}, [
									p("td", ye, [
										h(n, { status: e.status }, null, 8, ["status"]),
										i[1] ||= m(),
										e.status_code ? (_(), f("span", be, y(e.status_code), 1)) : d("", !0)
									]),
									p("td", xe, y(e.events), 1),
									p("td", Se, y(e.duration_ms === null ? b(W)("impex.common.none") : b(W)("impex.message.milliseconds", { count: e.duration_ms })), 1),
									p("td", Ce, [e.message_id ? (_(), u(g, {
										key: 0,
										to: `/impex/messages/${encodeURIComponent(e.message_id)}`,
										class: "hover:underline"
									}, {
										default: x(() => [m(y(b(o)(e.attempted_at)), 1)]),
										_: 2
									}, 1032, ["to"])) : (_(), f("span", we, y(b(o)(e.attempted_at)), 1))])
								], 8, ve))), 128))])]))]),
								_: 1
							}, 8, ["error", "ready"])]),
							_: 1
						})
					])) : d("", !0)]),
					_: 1
				}, 8, ["error", "ready"])]),
				_: 1
			}, 8, ["record"])]);
		};
	}
});
export { W as default };
