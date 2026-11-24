import { t as e } from "./ImpexFlash-BLiiWCOe.js";
import { t } from "./ImpexState-Mg53d6po.js";
import { t as n } from "./ImpexStatusBadge-ePLj75gE.js";
import { S as r, _ as ee, b as i, f as a, h as o, m as s } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as te, integrationData as c } from "@refactor-circus/atrium";
import { UBadge as ne, UButton as re, UCard as ie, UInput as ae } from "@refactor-circus/atrium/ui";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, defineComponent as _, openBlock as v, reactive as y, renderList as b, resolveComponent as oe, toDisplayString as x, unref as S, withCtx as C, withModifiers as se } from "vue";
import { useI18n as ce } from "vue-i18n";
import { useRoute as le } from "vue-router";
// src/pages/runs/[run].vue?vue&type=script&setup=true&lang.ts
var ue = {
	class: "space-y-4",
	"data-testid": "impex-run"
}, w = {
	key: 0,
	class: "space-y-4"
}, T = { class: "flex flex-wrap items-center justify-between gap-3" }, E = { class: "flex items-center gap-3" }, D = { class: "text-xl font-semibold" }, O = { class: "flex gap-2" }, k = {
	class: "grid gap-3 text-sm sm:grid-cols-2",
	"data-testid": "impex-run-details"
}, A = { class: "text-muted" }, j = { class: "font-mono" }, M = { class: "text-muted" }, N = { class: "text-muted" }, P = { class: "text-muted" }, F = { key: 0 }, I = { class: "text-muted" }, L = { class: "font-mono" }, R = { key: 1 }, z = { class: "text-muted" }, B = {
	key: 2,
	class: "sm:col-span-2"
}, V = { class: "text-muted" }, H = { class: "flex flex-wrap gap-1" }, U = {
	key: 3,
	class: "sm:col-span-2"
}, de = { class: "text-muted" }, fe = { class: "overflow-x-auto rounded-md bg-elevated p-2 text-xs" }, pe = { class: "font-medium" }, me = { class: "font-medium" }, he = {
	key: 0,
	class: "text-sm text-muted"
}, ge = {
	key: 1,
	class: "divide-y divide-default text-sm",
	"data-testid": "impex-run-steps"
}, _e = ["data-testid"], ve = { class: "flex items-center gap-2" }, ye = { class: "text-muted tabular-nums" }, be = { class: "font-medium" }, xe = { class: "text-xs text-muted" }, Se = { class: "flex items-center gap-2 text-xs text-muted" }, Ce = { key: 0 }, we = { key: 1 }, Te = { class: "font-medium" }, Ee = {
	key: 0,
	class: "text-sm text-muted"
}, De = {
	key: 1,
	class: "divide-y divide-default text-sm",
	"data-testid": "impex-run-messages"
}, Oe = { class: "text-xs text-muted" }, W = /* @__PURE__ */ _({
	__name: "[run]",
	setup(_) {
		let { t: W } = ce(), G = le(), K = u(() => String(G.params.run ?? "")), q = r(async (e) => c(await e.GET("/runs/{run}", { params: { path: { run: K.value } } })).data, K), J = r(async (e) => c(await e.GET("/runs/{run}/steps", { params: { path: { run: K.value } } })).data, K), Y = r(async (e) => c(await e.GET("/messages", { params: { query: { run: K.value } } })).data, K), X = i(), Z = y({
			name: "",
			payload: ""
		}), Q = u(() => [
			"completed",
			"failed",
			"cancelled"
		].includes(q.data.value?.status ?? ""));
		async function $() {
			await Promise.all([
				q.reload(),
				J.reload(),
				Y.reload()
			]);
		}
		async function ke() {
			let e = q.client;
			e && await X.run(async () => c(await e.POST("/runs/{run}/cancel", {
				params: { path: { run: K.value } },
				body: { reason: W("impex.run.cancelled_from_dashboard") }
			})), async () => (await $(), W("impex.run.cancelled")));
		}
		async function Ae() {
			let e = q.client;
			e && await X.run(async () => c(await e.POST("/runs/{run}/retry", { params: { path: { run: K.value } } })), async () => (await $(), W("impex.run.retried")));
		}
		async function je() {
			let e = q.client, t = o(Z.payload);
			if (!e) return;
			if (t && !("value" in t)) {
				X.invalid("payload", W("impex.run.payload_invalid"));
				return;
			}
			let n = s({
				name: Z.name,
				...t && "value" in t ? { payload: t.value } : {}
			});
			await X.run(async () => c(await e.POST("/runs/{run}/signals", {
				params: { path: { run: K.value } },
				body: n
			})), async (e) => (Z.name = "", Z.payload = "", await $(), "data" in e && e.data ? W("impex.run.signal_sent") : W("impex.run.signal_ignored")));
		}
		return (r, i) => {
			let o = re, s = oe("RouterLink"), c = ne, u = ie, _ = ae, y = te;
			return v(), p("div", ue, [g(y, {
				"screen-key": "impex.run",
				record: S(K)
			}, {
				default: C(() => [g(t, {
					error: S(q).error.value,
					ready: S(q).data.value !== null
				}, {
					default: C(() => [S(q).data.value ? (v(), p("div", w, [
						m("header", T, [m("div", E, [m("h1", D, x(S(q).data.value.flow), 1), g(n, { status: S(q).data.value.status }, null, 8, ["status"])]), m("div", O, [S(Q) ? f("", !0) : (v(), d(o, {
							key: 0,
							variant: "outline",
							icon: "i-lucide-circle-stop",
							loading: S(X).busy.value,
							"data-testid": "impex-run-cancel",
							onClick: ke
						}, {
							default: C(() => [h(x(S(W)("impex.run.cancel")), 1)]),
							_: 1
						}, 8, ["loading"])), S(q).data.value.status === "failed" ? (v(), d(o, {
							key: 1,
							variant: "outline",
							icon: "i-lucide-rotate-cw",
							loading: S(X).busy.value,
							"data-testid": "impex-run-retry",
							onClick: Ae
						}, {
							default: C(() => [h(x(S(W)("impex.run.retry")), 1)]),
							_: 1
						}, 8, ["loading"])) : f("", !0)])]),
						g(e, { action: S(X) }, null, 8, ["action"]),
						g(u, null, {
							default: C(() => [m("dl", k, [
								m("div", null, [m("dt", A, x(S(W)("impex.run.id")), 1), m("dd", j, x(S(q).data.value.id), 1)]),
								m("div", null, [m("dt", M, x(S(W)("impex.runs.trigger")), 1), m("dd", null, x(S(q).data.value.trigger), 1)]),
								m("div", null, [m("dt", N, x(S(W)("impex.runs.started")), 1), m("dd", null, x(S(a)(S(q).data.value.started_at) ?? S(W)("impex.common.none")), 1)]),
								m("div", null, [m("dt", P, x(S(W)("impex.runs.finished")), 1), m("dd", null, x(S(a)(S(q).data.value.finished_at) ?? S(W)("impex.common.none")), 1)]),
								S(q).data.value.idempotency_key ? (v(), p("div", F, [m("dt", I, x(S(W)("impex.run.idempotency_key")), 1), m("dd", L, x(S(q).data.value.idempotency_key), 1)])) : f("", !0),
								S(q).data.value.parent_run_id ? (v(), p("div", R, [m("dt", z, x(S(W)("impex.run.parent")), 1), m("dd", null, [g(s, {
									to: S(ee)(S(q).data.value.parent_run_id),
									class: "font-mono hover:underline"
								}, {
									default: C(() => [h(x(S(q).data.value.parent_run_id), 1)]),
									_: 1
								}, 8, ["to"])])])) : f("", !0),
								S(q).data.value.tags && Object.keys(S(q).data.value.tags).length ? (v(), p("div", B, [m("dt", V, x(S(W)("impex.run.tags")), 1), m("dd", H, [(v(!0), p(l, null, b(S(q).data.value.tags, (e, t) => (v(), d(c, {
									key: t,
									variant: "outline",
									color: "neutral"
								}, {
									default: C(() => [h(x(t) + ": " + x(e), 1)]),
									_: 2
								}, 1024))), 128))])])) : f("", !0),
								S(q).data.value.error ? (v(), p("div", U, [m("dt", de, x(S(W)("impex.run.error")), 1), m("dd", null, [m("pre", fe, x(JSON.stringify(S(q).data.value.error, null, 2)), 1)])])) : f("", !0)
							])]),
							_: 1
						}),
						S(Q) ? f("", !0) : (v(), d(u, { key: 0 }, {
							header: C(() => [m("h2", pe, x(S(W)("impex.run.signal_title")), 1)]),
							default: C(() => [m("form", {
								class: "flex flex-wrap items-end gap-3",
								"data-testid": "impex-run-signal",
								onSubmit: se(je, ["prevent"])
							}, [
								g(_, {
									modelValue: S(Z).name,
									"onUpdate:modelValue": i[0] ||= (e) => S(Z).name = e,
									name: "name",
									placeholder: S(W)("impex.run.signal_name"),
									required: "",
									class: "w-56"
								}, null, 8, ["modelValue", "placeholder"]),
								g(_, {
									modelValue: S(Z).payload,
									"onUpdate:modelValue": i[1] ||= (e) => S(Z).payload = e,
									name: "payload",
									placeholder: S(W)("impex.run.signal_payload"),
									class: "w-72"
								}, null, 8, ["modelValue", "placeholder"]),
								g(o, {
									type: "submit",
									icon: "i-lucide-send",
									loading: S(X).busy.value
								}, {
									default: C(() => [h(x(S(W)("impex.run.send")), 1)]),
									_: 1
								}, 8, ["loading"])
							], 32)]),
							_: 1
						})),
						g(u, null, {
							header: C(() => [m("h2", me, x(S(W)("impex.run.steps")), 1)]),
							default: C(() => [g(t, {
								error: S(J).error.value,
								ready: S(J).data.value !== null
							}, {
								default: C(() => [(S(J).data.value ?? []).length === 0 ? (v(), p("p", he, x(S(W)("impex.run.no_steps")), 1)) : (v(), p("ol", ge, [(v(!0), p(l, null, b(S(J).data.value, (e) => (v(), p("li", {
									key: e.id,
									class: "flex flex-wrap items-center justify-between gap-2 py-2",
									"data-testid": `impex-step-${e.sequence}`
								}, [m("span", ve, [
									m("span", ye, x(e.sequence), 1),
									m("span", be, x(e.name), 1),
									m("span", xe, x(e.type), 1),
									e.phase === "rollback" ? (v(), d(c, {
										key: 0,
										variant: "outline",
										color: "warning"
									}, {
										default: C(() => [h(x(S(W)("impex.run.rollback")), 1)]),
										_: 1
									})) : f("", !0),
									e.undone ? (v(), d(c, {
										key: 1,
										variant: "outline",
										color: "neutral"
									}, {
										default: C(() => [h(x(S(W)("impex.run.undone")), 1)]),
										_: 1
									})) : f("", !0)
								]), m("span", Se, [
									m("span", null, x(S(W)("impex.run.attempts", { count: e.attempts })), 1),
									e.resumptions > 0 ? (v(), p("span", Ce, x(S(W)("impex.run.resumed", { count: e.resumptions })), 1)) : f("", !0),
									e.result_artifact_id ? (v(), p("span", we, x(S(W)("impex.run.result_on_disk")), 1)) : f("", !0),
									g(n, { status: e.status }, null, 8, ["status"])
								])], 8, _e))), 128))]))]),
								_: 1
							}, 8, ["error", "ready"])]),
							_: 1
						}),
						g(u, null, {
							header: C(() => [m("h2", Te, x(S(W)("impex.run.messages")), 1)]),
							default: C(() => [g(t, {
								error: S(Y).error.value,
								ready: S(Y).data.value !== null
							}, {
								default: C(() => [(S(Y).data.value ?? []).length === 0 ? (v(), p("p", Ee, x(S(W)("impex.run.no_messages")), 1)) : (v(), p("ul", De, [(v(!0), p(l, null, b(S(Y).data.value, (e) => (v(), p("li", {
									key: e.id,
									class: "flex justify-between gap-2 py-2"
								}, [g(s, {
									to: `/impex/messages/${encodeURIComponent(e.id)}`,
									class: "hover:underline"
								}, {
									default: C(() => [h(x(e.direction) + " · " + x(e.channel), 1)]),
									_: 2
								}, 1032, ["to"]), m("span", Oe, x(S(a)(e.occurred_at)), 1)]))), 128))]))]),
								_: 1
							}, 8, ["error", "ready"])]),
							_: 1
						})
					])) : f("", !0)]),
					_: 1
				}, 8, ["error", "ready"])]),
				_: 1
			}, 8, ["record"])]);
		};
	}
});
export { W as default };
