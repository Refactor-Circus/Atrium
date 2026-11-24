import { a as e, i as t, n, t as r } from "./cortex-Bp7gHDgF.js";
import { t as i } from "./CortexActionError-BnFnixGr.js";
import { t as a } from "./CortexLoad-Bz-c2t3K.js";
import { t as o } from "./CortexPage-CtJD4yvP.js";
import { t as s } from "./CortexToolPicker-BvjQh2MP.js";
import { t as c } from "./CortexVersions-9-Zhh0G-.js";
import { UAlert as l, UBadge as u, UButton as d, UCard as f } from "@refactor-circus/atrium/ui";
import { computed as p, createBlock as m, createCommentVNode as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as y, isRef as b, openBlock as x, ref as S, toDisplayString as C, unref as w, vModelCheckbox as T, watch as E, withCtx as D, withDirectives as O } from "vue";
import { useI18n as k } from "vue-i18n";
import { useRoute as A } from "vue-router";
// src/pages/servers/[server]/instructions.vue?vue&type=script&setup=true&lang.ts
var j = { class: "flex flex-col gap-3" }, M = { class: "flex flex-wrap items-center gap-2" }, N = { class: "font-medium" }, P = { class: "flex flex-col gap-4" }, F = { class: "flex cursor-pointer items-center gap-2 text-sm" }, I = { class: "flex items-center gap-2" }, L = /* @__PURE__ */ y({
	__name: "instructions",
	setup(y) {
		let { t: L } = k(), R = A(), z = t(), B = p(() => String(R.params.server)), V = () => ({ params: { path: { server: B.value } } }), { client: H, data: U, pending: W, failed: G, status: K, reload: q } = e(async (e) => {
			let [t, n, i] = await Promise.all([
				e.GET("/servers/{server}/instructions", V()).then((e) => r(e).data),
				e.GET("/servers").then((e) => r(e).data),
				e.GET("/tools").then((e) => r(e).data).catch(() => [])
			]);
			return {
				instruction: t,
				server: n.find((e) => e.name === B.value) ?? null,
				registered: i
			};
		}), J = p(() => U.value?.server ?? null), Y = p(() => U.value?.instruction.published_content ?? J.value?.instructions ?? null), X = S([]), Z = S(!1), Q = S(!1);
		E(J, (e) => {
			X.value = [...e?.tools ?? []];
		}, { immediate: !0 });
		let $ = p(() => {
			let e = J.value?.tools ?? [], t = U.value?.registered ?? [];
			return [...e.map((e) => ({
				name: e,
				label: e,
				tags: t.find((t) => t.name === e)?.tags ?? []
			})), ...t.filter((t) => !e.includes(t.name)).map((e) => ({
				name: e.name,
				label: e.name,
				tags: e.tags
			}))];
		}), ee = {
			list: async () => r(await H.GET("/servers/{server}/instructions/versions", V())).data,
			store: async (e) => r(await H.POST("/servers/{server}/instructions/versions", {
				...V(),
				body: e
			})),
			publish: async (e) => r(await H.POST("/servers/{server}/instructions/versions/{version}/publish", { params: { path: {
				server: B.value,
				version: e
			} } })),
			destroy: async () => r(await H.DELETE("/servers/{server}/instructions", V()))
		};
		async function te() {
			Q.value = X.value.length === 0 && !Z.value, H && !Q.value && await z.run(async () => r(await H.PUT("/servers/{server}/tools", {
				...V(),
				body: n({ tools: X.value })
			}))) && (Z.value = !1, await q());
		}
		async function ne() {
			H && window.confirm(L("cortex.tools.confirm_restore")) && await z.run(async () => r(await H.DELETE("/servers/{server}/tools", V()))) && await q();
		}
		return (e, t) => {
			let n = u, r = l, p = d, y = f;
			return x(), m(o, {
				title: w(L)("cortex.servers.instructions_title", { server: w(B) }),
				"screen-key": "cortex.server-instructions",
				record: w(B),
				back: {
					to: "/cortex/servers",
					label: w(L)("cortex.servers.title")
				}
			}, {
				default: D(() => [v(a, {
					ready: !w(W) && w(U) !== null,
					failed: w(G),
					status: w(K)
				}, {
					default: D(() => [g("div", j, [v(c, {
						api: ee,
						live: w(Y),
						"live-title": w(L)("cortex.servers.instructions"),
						published: w(U)?.instruction.published_version ?? null,
						override: "",
						onChanged: w(q)
					}, null, 8, [
						"live",
						"live-title",
						"published",
						"onChanged"
					]), w(J) ? (x(), m(y, {
						key: 0,
						"data-testid": "cortex-server-tools"
					}, {
						header: D(() => [g("div", M, [g("h3", N, C(w(L)("cortex.agent.tools")), 1), w(J).tools_overridden ? (x(), m(n, {
							key: 0,
							color: "success",
							variant: "subtle",
							label: w(L)("cortex.tools.overridden"),
							"data-status": "overridden"
						}, null, 8, ["label"])) : (x(), m(n, {
							key: 1,
							color: "neutral",
							variant: "subtle",
							label: w(L)("cortex.versions.from_code"),
							"data-status": "from_code"
						}, null, 8, ["label"]))])]),
						default: D(() => [g("div", P, [
							v(i, {
								forbidden: w(z).forbidden.value,
								message: w(z).message.value
							}, null, 8, ["forbidden", "message"]),
							w(z).error("tools") ? (x(), m(r, {
								key: 0,
								color: "error",
								variant: "subtle",
								title: w(z).error("tools"),
								"data-testid": "cortex-tools-error"
							}, null, 8, ["title"])) : h("", !0),
							w(Q) ? (x(), m(r, {
								key: 1,
								color: "warning",
								variant: "subtle",
								title: w(L)("cortex.servers.confirm_empty_needed"),
								"data-testid": "cortex-confirm-empty-needed"
							}, null, 8, ["title"])) : h("", !0),
							v(s, {
								modelValue: w(X),
								"onUpdate:modelValue": t[0] ||= (e) => b(X) ? X.value = e : null,
								tools: w($),
								"id-prefix": "cortex-server-tool-"
							}, null, 8, ["modelValue", "tools"]),
							g("label", F, [O(g("input", {
								"onUpdate:modelValue": t[1] ||= (e) => b(Z) ? Z.value = e : null,
								type: "checkbox",
								class: "accent-(--ui-error)",
								"data-testid": "cortex-confirm-empty"
							}, null, 512), [[T, w(Z)]]), _(" " + C(w(L)("cortex.servers.confirm_empty")), 1)]),
							g("div", I, [v(p, {
								icon: "i-lucide-check",
								label: w(L)("cortex.tools.save"),
								loading: w(z).busy.value,
								"data-testid": "cortex-save-tools",
								onClick: te
							}, null, 8, ["label", "loading"]), w(J).tools_overridden ? (x(), m(p, {
								key: 0,
								color: "neutral",
								variant: "ghost",
								icon: "i-lucide-undo-2",
								label: w(L)("cortex.tools.restore"),
								"data-testid": "cortex-restore-tools",
								onClick: ne
							}, null, 8, ["label"])) : h("", !0)])
						])]),
						_: 1
					})) : h("", !0)])]),
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
export { L as default };
