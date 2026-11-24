import { UBadge as e, UButton as t, UInput as n } from "@refactor-circus/atrium/ui";
import { Fragment as r, computed as i, createBlock as a, createCommentVNode as o, createElementBlock as s, createElementVNode as c, createTextVNode as l, createVNode as u, defineComponent as d, isRef as f, mergeModels as p, openBlock as m, ref as h, renderList as g, toDisplayString as _, unref as v, useModel as y, vModelCheckbox as b, withDirectives as x } from "vue";
import { useI18n as S } from "vue-i18n";
// src/components/CortexToolPicker.vue?vue&type=script&setup=true&lang.ts
var C = {
	class: "flex flex-col gap-3",
	"data-testid": "cortex-tool-picker"
}, w = { class: "flex flex-wrap items-center gap-3" }, T = { class: "flex cursor-pointer items-center gap-2 text-sm" }, E = {
	class: "ml-auto text-xs text-muted",
	"data-testid": "cortex-selected-count"
}, D = {
	key: 0,
	class: "flex flex-wrap gap-2",
	"data-testid": "cortex-picker-tags"
}, O = { class: "flex max-h-80 flex-col gap-2 overflow-y-auto" }, k = ["value", "data-testid"], A = /* @__PURE__ */ d({
	__name: "CortexToolPicker",
	props: /*@__PURE__*/ p({
		tools: {},
		idPrefix: {}
	}, {
		modelValue: { required: !0 },
		modelModifiers: {}
	}),
	emits: ["update:modelValue"],
	setup(d) {
		let p = d, A = y(d, "modelValue"), { t: j } = S(), M = h(null), N = h(""), P = h(!1), F = i(() => [...new Set(p.tools.flatMap((e) => e.tags))].sort());
		function I(e) {
			return (M.value === null || e.tags.includes(M.value)) && (N.value === "" || e.name.toLowerCase().includes(N.value.toLowerCase())) && (!P.value || A.value.includes(e.name));
		}
		let L = i(() => p.tools.filter(I));
		return (i, p) => {
			let h = n, y = t, S = e;
			return m(), s("div", C, [
				c("div", w, [
					u(h, {
						modelValue: v(N),
						"onUpdate:modelValue": p[0] ||= (e) => f(N) ? N.value = e : null,
						icon: "i-lucide-search",
						placeholder: v(j)("cortex.tools.search"),
						"data-testid": "cortex-tool-search"
					}, null, 8, ["modelValue", "placeholder"]),
					c("label", T, [x(c("input", {
						"onUpdate:modelValue": p[1] ||= (e) => f(P) ? P.value = e : null,
						type: "checkbox",
						class: "accent-(--ui-primary)",
						"data-testid": "cortex-selected-only"
					}, null, 512), [[b, v(P)]]), l(" " + _(v(j)("cortex.tools.selected_only")), 1)]),
					c("span", E, _(v(j)("cortex.tools.selected", { count: A.value.length })), 1)
				]),
				v(F).length ? (m(), s("div", D, [u(y, {
					size: "xs",
					variant: v(M) === null ? "solid" : "outline",
					color: "neutral",
					label: v(j)("cortex.tools.all_tags"),
					onClick: p[2] ||= () => {
						M.value = null;
					}
				}, null, 8, ["variant", "label"]), (m(!0), s(r, null, g(v(F), (e) => (m(), a(y, {
					key: e,
					size: "xs",
					variant: v(M) === e ? "solid" : "outline",
					color: "neutral",
					label: e,
					"data-testid": `cortex-picker-tag-${e}`,
					onClick: () => {
						M.value = v(M) === e ? null : e;
					}
				}, null, 8, [
					"variant",
					"label",
					"data-testid",
					"onClick"
				]))), 128))])) : o("", !0),
				c("div", O, [(m(!0), s(r, null, g(v(L), (e) => (m(), s("label", {
					key: e.name,
					class: "flex flex-wrap items-center gap-2 text-sm"
				}, [
					x(c("input", {
						"onUpdate:modelValue": p[3] ||= (e) => A.value = e,
						type: "checkbox",
						class: "accent-(--ui-primary)",
						value: e.name,
						"data-testid": `${d.idPrefix ?? "cortex-tool-"}${e.name}`
					}, null, 8, k), [[b, A.value]]),
					c("span", null, _(e.label), 1),
					(m(!0), s(r, null, g(e.tags, (e) => (m(), a(S, {
						key: e,
						color: "neutral",
						variant: "subtle",
						size: "sm",
						label: e
					}, null, 8, ["label"]))), 128))
				]))), 128))])
			]);
		};
	}
});
export { A as t };
