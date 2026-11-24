import { t as e } from "./ImpexState-Mg53d6po.js";
import { S as t, _ as n, f as r } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as i, integrationData as a } from "@refactor-circus/atrium";
import { UCard as o } from "@refactor-circus/atrium/ui";
import { computed as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createTextVNode as f, createVNode as p, defineComponent as m, openBlock as h, resolveComponent as g, toDisplayString as _, unref as v, withCtx as y } from "vue";
import { useI18n as b } from "vue-i18n";
import { useRoute as x } from "vue-router";
// src/pages/messages/[message].vue?vue&type=script&setup=true&lang.ts
var S = {
	class: "space-y-4",
	"data-testid": "impex-message"
}, C = {
	key: 0,
	class: "space-y-4"
}, w = { class: "text-xl font-semibold" }, T = { class: "font-mono text-sm text-muted" }, E = {
	class: "grid gap-3 text-sm sm:grid-cols-2",
	"data-testid": "impex-message-details"
}, D = { class: "text-muted" }, O = { class: "text-muted" }, k = { class: "text-muted" }, A = { class: "text-muted" }, j = { class: "text-muted" }, M = { class: "text-muted" }, N = { "data-testid": "impex-message-signature" }, P = {
	key: 0,
	class: "sm:col-span-2"
}, F = { class: "text-muted" }, I = { class: "font-medium" }, L = { class: "overflow-x-auto text-xs" }, R = { class: "font-medium" }, z = {
	class: "overflow-x-auto whitespace-pre-wrap text-xs",
	"data-testid": "impex-message-body"
}, B = {
	key: 0,
	class: "mt-2 text-sm text-muted"
}, V = { class: "font-medium" }, H = { class: "overflow-x-auto text-xs" }, U = /* @__PURE__ */ m({
	__name: "[message]",
	setup(m) {
		let { t: U } = b(), W = x(), G = s(() => String(W.params.message ?? "")), K = t(async (e) => a(await e.GET("/messages/{message}", { params: { path: { message: G.value } } })).data, G), q = s(() => {
			let e = K.data.value?.signature_valid;
			return U(e === !0 ? "impex.message.verified" : e === !1 ? "impex.message.bad_signature" : "impex.message.unsigned");
		});
		return (t, a) => {
			let s = g("RouterLink"), m = o, b = i;
			return h(), u("div", S, [p(b, {
				"screen-key": "impex.message",
				record: v(G)
			}, {
				default: y(() => [p(e, {
					error: v(K).error.value,
					ready: v(K).data.value !== null
				}, {
					default: y(() => [v(K).data.value ? (h(), u("div", C, [
						d("header", null, [d("h1", w, _(v(U)(`impex.directions.${v(K).data.value.direction}`)) + " · " + _(v(K).data.value.channel), 1), d("p", T, _(v(K).data.value.method) + " " + _(v(K).data.value.endpoint), 1)]),
						p(m, null, {
							default: y(() => [d("dl", E, [
								d("div", null, [d("dt", D, _(v(U)("impex.messages.when")), 1), d("dd", null, _(v(r)(v(K).data.value.occurred_at)), 1)]),
								d("div", null, [d("dt", O, _(v(U)("impex.messages.transport")), 1), d("dd", null, _(v(K).data.value.transport), 1)]),
								d("div", null, [d("dt", k, _(v(U)("impex.messages.status_code")), 1), d("dd", null, _(v(K).data.value.status_code ?? v(U)("impex.common.none")), 1)]),
								d("div", null, [d("dt", A, _(v(U)("impex.message.duration")), 1), d("dd", null, _(v(K).data.value.duration_ms === null ? v(U)("impex.common.none") : v(U)("impex.message.milliseconds", { count: v(K).data.value.duration_ms })), 1)]),
								d("div", null, [d("dt", j, _(v(U)("impex.message.size")), 1), d("dd", null, _(v(U)("impex.message.bytes", { count: v(K).data.value.bytes })), 1)]),
								d("div", null, [d("dt", M, _(v(U)("impex.message.signature")), 1), d("dd", N, _(v(q)), 1)]),
								v(K).data.value.run_id ? (h(), u("div", P, [d("dt", F, _(v(U)("impex.message.run")), 1), d("dd", null, [p(s, {
									to: v(n)(v(K).data.value.run_id),
									class: "font-mono hover:underline",
									"data-testid": "impex-message-run"
								}, {
									default: y(() => [f(_(v(K).data.value.run_id), 1)]),
									_: 1
								}, 8, ["to"])])])) : l("", !0)
							])]),
							_: 1
						}),
						v(K).data.value.headers && Object.keys(v(K).data.value.headers).length ? (h(), c(m, { key: 0 }, {
							header: y(() => [d("h2", I, _(v(U)("impex.message.headers")), 1)]),
							default: y(() => [d("pre", L, _(JSON.stringify(v(K).data.value.headers, null, 2)), 1)]),
							_: 1
						})) : l("", !0),
						p(m, null, {
							header: y(() => [d("h2", R, _(v(U)("impex.message.body")), 1)]),
							default: y(() => [d("pre", z, _(v(K).data.value.body_preview || v(U)("impex.message.empty_body")), 1), v(K).data.value.body_artifact_id ? (h(), u("p", B, _(v(U)("impex.message.body_on_disk", { id: v(K).data.value.body_artifact_id })), 1)) : l("", !0)]),
							_: 1
						}),
						v(K).data.value.error ? (h(), c(m, { key: 1 }, {
							header: y(() => [d("h2", V, _(v(U)("impex.run.error")), 1)]),
							default: y(() => [d("pre", H, _(JSON.stringify(v(K).data.value.error, null, 2)), 1)]),
							_: 1
						})) : l("", !0)
					])) : l("", !0)]),
					_: 1
				}, 8, ["error", "ready"])]),
				_: 1
			}, 8, ["record"])]);
		};
	}
});
export { U as default };
