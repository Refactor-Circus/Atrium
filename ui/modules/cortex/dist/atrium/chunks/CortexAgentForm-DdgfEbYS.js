import { i as e, n as t, r as n, t as r } from "./cortex-Bp7gHDgF.js";
import { t as i } from "./CortexActionError-BnFnixGr.js";
import { t as a } from "./CortexToolPicker-BvjQh2MP.js";
import { UButton as o, UCard as s, UFormField as c, UInput as l, UTextarea as u } from "@refactor-circus/atrium/ui";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as y, openBlock as b, reactive as x, renderList as S, shallowRef as C, toDisplayString as w, unref as T, vModelCheckbox as E, vModelSelect as D, watch as O, withCtx as k, withDirectives as A, withModifiers as ee } from "vue";
import { useI18n as te } from "vue-i18n";
// src/components/CortexAgentForm.vue?vue&type=script&setup=true&lang.ts
var ne = { class: "grid gap-4 sm:grid-cols-2" }, re = { value: "" }, ie = ["value"], ae = { value: "" }, oe = ["value"], se = { class: "flex flex-col gap-3" }, ce = { class: "mb-2 text-sm font-medium" }, j = { class: "grid gap-3 sm:grid-cols-2" }, M = { class: "flex flex-col gap-2" }, N = ["value", "data-testid"], P = { class: "flex flex-col gap-2" }, F = ["value", "data-testid"], I = { class: "flex items-center gap-2" }, L = /* @__PURE__ */ y({
	__name: "CortexAgentForm",
	props: { agent: {} },
	emits: ["saved"],
	setup(y, { emit: L }) {
		let R = y, z = L, B = [
			"temperature",
			"max_steps",
			"max_tokens",
			"top_p"
		], { t: V } = te(), H = n(), U = e(), W = C([]), G = C([]), K = C([]), q = C([]);
		function J() {
			let e = R.agent?.settings ?? {};
			return {
				name: R.agent?.name ?? "",
				slug: "",
				description: R.agent?.description ?? "",
				instructions: R.agent?.instructions ?? "",
				provider: R.agent?.provider ?? "",
				model: R.agent?.model ?? "",
				settings: Object.fromEntries(B.map((t) => [t, e[t] === void 0 || e[t] === null ? "" : String(e[t])])),
				tools: [...R.agent?.tools ?? []],
				sub_agents: [...R.agent?.sub_agents ?? []],
				concrete_sub_agents: [...R.agent?.concrete_sub_agents ?? []]
			};
		}
		let Y = x(J());
		O(() => R.agent, () => Object.assign(Y, J()));
		let le = f(() => {
			let e = W.value.map((e) => e.name);
			return Y.provider && !e.includes(Y.provider) ? [Y.provider, ...e] : e;
		}), ue = f(() => [.../* @__PURE__ */ new Set([...W.value.flatMap((e) => e.models), ...R.agent?.model ? [R.agent.model] : []])]), X = f(() => G.value.map((e) => ({
			name: e.name,
			label: e.name,
			tags: e.tags
		}))), Z = f(() => K.value.filter((e) => e.slug !== R.agent?.slug));
		function Q() {
			let e = W.value.find((e) => e.name === Y.provider)?.default_model;
			e && !Y.model && (Y.model = e);
		}
		async function de() {
			if (!H) return;
			let [e, t, n, i] = await Promise.allSettled([
				H.GET("/providers").then((e) => r(e).data),
				H.GET("/tools").then((e) => r(e).data),
				H.GET("/virtual-agents", { params: { query: { per_page: 100 } } }).then((e) => r(e).data),
				H.GET("/concrete-agents").then((e) => r(e).data)
			]);
			W.value = e.status === "fulfilled" ? e.value : [], G.value = t.status === "fulfilled" ? t.value : [], K.value = n.status === "fulfilled" ? n.value : [], q.value = i.status === "fulfilled" ? i.value : [];
		}
		function $() {
			let e = Object.fromEntries(B.filter((e) => String(Y.settings[e] ?? "").trim() !== "").map((e) => [e, Number(Y.settings[e])]));
			return {
				name: Y.name,
				...R.agent ? {} : { slug: Y.slug },
				description: Y.description === "" ? null : Y.description,
				instructions: Y.instructions,
				provider: Y.provider === "" ? null : Y.provider,
				model: Y.model === "" ? null : Y.model,
				settings: Object.keys(e).length ? e : null,
				tools: Y.tools,
				sub_agents: Y.sub_agents,
				concrete_sub_agents: Y.concrete_sub_agents
			};
		}
		async function fe() {
			if (!H) return;
			let e = null, n = R.agent;
			await U.run(async () => {
				let i = n ? await H.PATCH("/virtual-agents/{agent}", {
					params: { path: { agent: n.slug } },
					body: t($())
				}) : await H.POST("/virtual-agents", { body: t($()) });
				e = r(i).data;
			}) && e && z("saved", e);
		}
		return de(), (e, t) => {
			let n = l, r = c, f = u, x = o, C = s;
			return b(), p(C, null, {
				default: k(() => [g("form", {
					class: "flex flex-col gap-4",
					"data-testid": "cortex-agent-form",
					onSubmit: ee(fe, ["prevent"])
				}, [
					v(i, {
						forbidden: T(U).forbidden.value,
						message: T(U).message.value
					}, null, 8, ["forbidden", "message"]),
					v(r, {
						label: T(V)("cortex.agent.name"),
						error: T(U).error("name"),
						required: ""
					}, {
						default: k(() => [v(n, {
							modelValue: T(Y).name,
							"onUpdate:modelValue": t[0] ||= (e) => T(Y).name = e,
							class: "w-full",
							"data-testid": "cortex-agent-name"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"]),
					y.agent ? m("", !0) : (b(), p(r, {
						key: 0,
						label: T(V)("cortex.agent.slug"),
						hint: T(V)("cortex.agent.slug_hint"),
						error: T(U).error("slug"),
						required: ""
					}, {
						default: k(() => [v(n, {
							modelValue: T(Y).slug,
							"onUpdate:modelValue": t[1] ||= (e) => T(Y).slug = e,
							class: "w-full",
							"data-testid": "cortex-agent-slug"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, [
						"label",
						"hint",
						"error"
					])),
					v(r, {
						label: T(V)("cortex.agent.description"),
						error: T(U).error("description")
					}, {
						default: k(() => [v(f, {
							modelValue: T(Y).description,
							"onUpdate:modelValue": t[2] ||= (e) => T(Y).description = e,
							class: "w-full",
							"data-testid": "cortex-agent-description"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"]),
					v(r, {
						label: T(V)("cortex.agent.prompt"),
						help: T(V)("cortex.agent.prompt_hint"),
						error: T(U).error("instructions"),
						required: ""
					}, {
						default: k(() => [v(f, {
							modelValue: T(Y).instructions,
							"onUpdate:modelValue": t[3] ||= (e) => T(Y).instructions = e,
							rows: 10,
							class: "w-full font-mono",
							"data-testid": "cortex-agent-instructions"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, [
						"label",
						"help",
						"error"
					]),
					g("div", ne, [v(r, {
						label: T(V)("cortex.agent.provider"),
						error: T(U).error("provider")
					}, {
						default: k(() => [A(g("select", {
							"onUpdate:modelValue": t[4] ||= (e) => T(Y).provider = e,
							class: "w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "cortex-agent-provider",
							onChange: Q
						}, [g("option", re, w(T(V)("cortex.agent.provider_default")), 1), (b(!0), h(d, null, S(T(le), (e) => (b(), h("option", {
							key: e,
							value: e
						}, w(e), 9, ie))), 128))], 544), [[D, T(Y).provider]])]),
						_: 1
					}, 8, ["label", "error"]), v(r, {
						label: T(V)("cortex.agent.model"),
						error: T(U).error("model")
					}, {
						default: k(() => [A(g("select", {
							"onUpdate:modelValue": t[5] ||= (e) => T(Y).model = e,
							class: "w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "cortex-agent-model"
						}, [g("option", ae, w(T(V)("cortex.agent.provider_default")), 1), (b(!0), h(d, null, S(T(ue), (e) => (b(), h("option", {
							key: e,
							value: e
						}, w(e), 9, oe))), 128))], 512), [[D, T(Y).model]])]),
						_: 1
					}, 8, ["label", "error"])]),
					g("fieldset", se, [g("legend", ce, w(T(V)("cortex.agent.settings")), 1), g("div", j, [
						v(r, {
							label: T(V)("cortex.agent.temperature"),
							error: T(U).error("settings.temperature")
						}, {
							default: k(() => [v(n, {
								modelValue: T(Y).settings.temperature,
								"onUpdate:modelValue": t[6] ||= (e) => T(Y).settings.temperature = e,
								type: "number",
								step: "0.1",
								min: "0",
								max: "2",
								class: "w-full",
								"data-testid": "cortex-agent-temperature"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"]),
						v(r, {
							label: T(V)("cortex.agent.max_steps"),
							error: T(U).error("settings.max_steps")
						}, {
							default: k(() => [v(n, {
								modelValue: T(Y).settings.max_steps,
								"onUpdate:modelValue": t[7] ||= (e) => T(Y).settings.max_steps = e,
								type: "number",
								min: "1",
								class: "w-full",
								"data-testid": "cortex-agent-max-steps"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"]),
						v(r, {
							label: T(V)("cortex.agent.max_tokens"),
							error: T(U).error("settings.max_tokens")
						}, {
							default: k(() => [v(n, {
								modelValue: T(Y).settings.max_tokens,
								"onUpdate:modelValue": t[8] ||= (e) => T(Y).settings.max_tokens = e,
								type: "number",
								min: "1",
								class: "w-full",
								"data-testid": "cortex-agent-max-tokens"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"]),
						v(r, {
							label: T(V)("cortex.agent.top_p"),
							error: T(U).error("settings.top_p")
						}, {
							default: k(() => [v(n, {
								modelValue: T(Y).settings.top_p,
								"onUpdate:modelValue": t[9] ||= (e) => T(Y).settings.top_p = e,
								type: "number",
								step: "0.05",
								min: "0",
								max: "1",
								class: "w-full",
								"data-testid": "cortex-agent-top-p"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"])
					])]),
					T(X).length ? (b(), p(r, {
						key: 1,
						label: T(V)("cortex.agent.tools"),
						error: T(U).error("tools")
					}, {
						default: k(() => [v(a, {
							modelValue: T(Y).tools,
							"onUpdate:modelValue": t[10] ||= (e) => T(Y).tools = e,
							tools: T(X),
							"id-prefix": "cortex-agent-tool-"
						}, null, 8, ["modelValue", "tools"])]),
						_: 1
					}, 8, ["label", "error"])) : m("", !0),
					T(Z).length ? (b(), p(r, {
						key: 2,
						label: T(V)("cortex.agent.sub_agents"),
						error: T(U).error("sub_agents")
					}, {
						default: k(() => [g("div", M, [(b(!0), h(d, null, S(T(Z), (e) => (b(), h("label", {
							key: e.slug,
							class: "flex items-center gap-2 text-sm"
						}, [A(g("input", {
							"onUpdate:modelValue": t[11] ||= (e) => T(Y).sub_agents = e,
							type: "checkbox",
							class: "accent-(--ui-primary)",
							value: e.slug,
							"data-testid": `cortex-sub-agent-${e.slug}`
						}, null, 8, N), [[E, T(Y).sub_agents]]), _(" " + w(e.name), 1)]))), 128))])]),
						_: 1
					}, 8, ["label", "error"])) : m("", !0),
					T(q).length ? (b(), p(r, {
						key: 3,
						label: T(V)("cortex.agent.concrete_sub_agents"),
						error: T(U).error("concrete_sub_agents")
					}, {
						default: k(() => [g("div", P, [(b(!0), h(d, null, S(T(q), (e) => (b(), h("label", {
							key: e.name,
							class: "flex items-center gap-2 text-sm"
						}, [A(g("input", {
							"onUpdate:modelValue": t[12] ||= (e) => T(Y).concrete_sub_agents = e,
							type: "checkbox",
							class: "accent-(--ui-primary)",
							value: e.name,
							"data-testid": `cortex-concrete-sub-agent-${e.name}`
						}, null, 8, F), [[E, T(Y).concrete_sub_agents]]), _(" " + w(e.name), 1)]))), 128))])]),
						_: 1
					}, 8, ["label", "error"])) : m("", !0),
					g("div", I, [v(x, {
						type: "submit",
						icon: "i-lucide-check",
						label: T(V)("cortex.agent.save"),
						loading: T(U).busy.value,
						"data-testid": "cortex-save-agent"
					}, null, 8, ["label", "loading"]), v(x, {
						to: "/cortex/virtual-agents",
						color: "neutral",
						variant: "ghost",
						label: T(V)("cortex.agent.cancel")
					}, null, 8, ["label"])])
				], 32)]),
				_: 1
			});
		};
	}
});
export { L as t };
