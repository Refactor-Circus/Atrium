import { a as e, i as t, n, t as r } from "./cortex-Bp7gHDgF.js";
import { t as i } from "./CortexActionError-BnFnixGr.js";
import { t as a } from "./CortexLoad-Bz-c2t3K.js";
import { t as o } from "./CortexPage-CtJD4yvP.js";
import { t as s } from "./CortexToolPicker-BvjQh2MP.js";
import { t as c } from "./CortexVersions-9-Zhh0G-.js";
import { UAlert as l, UBadge as u, UButton as d, UCard as f } from "@refactor-circus/atrium/ui";
import { Fragment as p, computed as m, createBlock as h, createCommentVNode as g, createElementBlock as _, createElementVNode as v, createVNode as y, defineComponent as b, isRef as x, openBlock as S, ref as C, renderList as w, toDisplayString as T, unref as E, watch as D, withCtx as O } from "vue";
import { useI18n as k } from "vue-i18n";
import { useRoute as A } from "vue-router";
// src/pages/concrete-agents/[agent].vue?vue&type=script&setup=true&lang.ts
var j = {
	key: 0,
	class: "flex flex-col gap-3"
}, M = { class: "font-medium" }, N = {
	class: "mb-2 text-sm text-muted",
	"data-testid": "cortex-not-overridable"
}, P = { class: "overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs" }, F = { class: "flex flex-wrap items-center gap-2" }, I = { class: "font-medium" }, L = { class: "flex flex-col gap-4" }, R = { class: "flex items-center gap-2" }, z = {
	key: 2,
	class: "flex flex-col gap-1 text-sm",
	"data-testid": "cortex-agent-tools-served"
}, B = { class: "text-xs" }, V = /* @__PURE__ */ b({
	__name: "[agent]",
	setup(b) {
		let { t: V } = k(), H = A(), U = t(), W = m(() => String(H.params.agent)), G = () => ({ params: { path: { agent: W.value } } }), { client: K, data: q, pending: J, failed: Y, status: X, reload: Z } = e(async (e) => {
			let [t, n] = await Promise.all([e.GET("/concrete-agents/{agent}", G()).then((e) => r(e).data), e.GET("/tools").then((e) => r(e).data).catch(() => [])]);
			return {
				agent: t,
				registered: n
			};
		}), Q = m(() => q.value?.agent ?? null), $ = C([]);
		D(Q, (e) => {
			$.value = [...e?.tools ?? []];
		}, { immediate: !0 });
		let ee = m(() => {
			let e = Q.value?.default_tools ?? [], t = q.value?.registered ?? [];
			return [...e.map((e) => ({
				name: e,
				label: e,
				tags: t.find((t) => t.name === e)?.tags ?? []
			})), ...t.filter((t) => !e.includes(t.name)).map((e) => ({
				name: e.name,
				label: e.name,
				tags: e.tags
			}))];
		}), te = {
			list: async () => r(await K.GET("/concrete-agents/{agent}/versions", G())).data,
			store: async (e) => r(await K.POST("/concrete-agents/{agent}/versions", {
				...G(),
				body: e
			})),
			publish: async (e) => r(await K.POST("/concrete-agents/{agent}/versions/{version}/publish", { params: { path: {
				agent: W.value,
				version: e
			} } })),
			destroy: async () => r(await K.DELETE("/concrete-agents/{agent}/override", G()))
		};
		async function ne() {
			K && await U.run(async () => r(await K.PUT("/concrete-agents/{agent}/tools", {
				...G(),
				body: n({ tools: $.value })
			}))) && await Z();
		}
		async function re() {
			K && window.confirm(V("cortex.tools.confirm_restore")) && await U.run(async () => r(await K.PUT("/concrete-agents/{agent}/tools", {
				...G(),
				body: n({ tools: null })
			}))) && await Z();
		}
		return (e, t) => {
			let n = d, r = f, m = u, b = l;
			return S(), h(o, {
				title: E(W),
				"screen-key": "cortex.concrete-agent",
				record: E(W),
				back: {
					to: "/cortex/concrete-agents",
					label: E(V)("cortex.concrete_agents.title")
				}
			}, {
				actions: O(() => [y(n, {
					variant: "outline",
					icon: "i-lucide-play",
					to: `/cortex/run?agent=concrete:${E(W)}`,
					label: E(V)("cortex.run.run"),
					"data-testid": "cortex-run-agent"
				}, null, 8, ["to", "label"])]),
				default: O(() => [y(a, {
					ready: !E(J) && E(Q) !== null,
					failed: E(Y),
					status: E(X)
				}, {
					default: O(() => [E(Q) ? (S(), _("div", j, [E(Q).overridable ? (S(), h(c, {
						key: 0,
						api: te,
						live: E(Q).instructions,
						"live-title": E(V)("cortex.agent.prompt"),
						published: E(Q).published_version,
						override: "",
						onChanged: E(Z)
					}, null, 8, [
						"live",
						"live-title",
						"published",
						"onChanged"
					])) : (S(), h(r, { key: 1 }, {
						header: O(() => [v("h3", M, T(E(V)("cortex.agent.prompt")), 1)]),
						default: O(() => [v("p", N, T(E(V)("cortex.concrete_agents.not_overridable")), 1), v("pre", P, T(E(Q).instructions), 1)]),
						_: 1
					})), y(r, { "data-testid": "cortex-agent-tools" }, {
						header: O(() => [v("div", F, [v("h3", I, T(E(V)("cortex.agent.tools")), 1), E(Q).tools_overridden ? (S(), h(m, {
							key: 0,
							color: "success",
							variant: "subtle",
							label: E(V)("cortex.tools.overridden"),
							"data-status": "overridden"
						}, null, 8, ["label"])) : (S(), h(m, {
							key: 1,
							color: "neutral",
							variant: "subtle",
							label: E(V)("cortex.versions.from_code"),
							"data-status": "from_code"
						}, null, 8, ["label"]))])]),
						default: O(() => [v("div", L, [
							y(i, {
								forbidden: E(U).forbidden.value,
								message: E(U).message.value
							}, null, 8, ["forbidden", "message"]),
							E(U).error("tools") ? (S(), h(b, {
								key: 0,
								color: "error",
								variant: "subtle",
								title: E(U).error("tools"),
								"data-testid": "cortex-tools-error"
							}, null, 8, ["title"])) : g("", !0),
							E(Q).tools_overridable ? (S(), _(p, { key: 1 }, [y(s, {
								modelValue: E($),
								"onUpdate:modelValue": t[0] ||= (e) => x($) ? $.value = e : null,
								tools: E(ee),
								"id-prefix": "cortex-agent-tool-"
							}, null, 8, ["modelValue", "tools"]), v("div", R, [y(n, {
								icon: "i-lucide-check",
								label: E(V)("cortex.tools.save"),
								loading: E(U).busy.value,
								"data-testid": "cortex-save-tools",
								onClick: ne
							}, null, 8, ["label", "loading"]), E(Q).tools_overridden ? (S(), h(n, {
								key: 0,
								color: "neutral",
								variant: "ghost",
								icon: "i-lucide-undo-2",
								label: E(V)("cortex.tools.restore"),
								"data-testid": "cortex-restore-tools",
								onClick: re
							}, null, 8, ["label"])) : g("", !0)])], 64)) : (S(), _("ul", z, [(S(!0), _(p, null, w(E(Q).tools, (e) => (S(), _("li", { key: e }, [v("code", B, T(e), 1)]))), 128))]))
						])]),
						_: 1
					})])) : g("", !0)]),
					_: 1
				}, 8, [
					"ready",
					"failed",
					"status"
				])]),
				_: 1
			}, 8, [
				"title",
				"record",
				"back"
			]);
		};
	}
});
export { V as default };
