import { i as e } from "./cortex-Bp7gHDgF.js";
import { t } from "./CortexActionError-BnFnixGr.js";
import { atriumStatus as n } from "@refactor-circus/atrium";
import { UBadge as r, UButton as i, UCard as a, UFormField as o, UTextarea as ee } from "@refactor-circus/atrium/ui";
import { Fragment as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createTextVNode as f, createVNode as p, defineComponent as m, isRef as h, openBlock as g, ref as _, renderList as v, shallowRef as y, toDisplayString as b, unref as x, vModelCheckbox as S, watch as C, withCtx as w, withDirectives as te, withModifiers as T } from "vue";
import { useI18n as E } from "vue-i18n";
// src/components/CortexVersions.vue?vue&type=script&setup=true&lang.ts
var D = {
	class: "flex flex-col gap-5",
	"data-testid": "cortex-versions"
}, ne = { class: "flex flex-wrap items-center gap-2" }, re = { class: "font-medium" }, O = {
	key: 0,
	class: "mt-1 text-sm text-muted"
}, k = {
	class: "overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs",
	"data-testid": "cortex-live"
}, A = { class: "font-medium" }, j = {
	key: 0,
	class: "text-sm text-muted"
}, M = {
	key: 1,
	class: "divide-y divide-default"
}, N = ["data-testid"], P = { class: "flex flex-wrap items-center gap-2" }, F = { class: "font-medium" }, I = {
	key: 1,
	class: "text-xs text-muted"
}, L = { class: "ml-auto flex items-center gap-2" }, R = {
	key: 0,
	class: "mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs"
}, z = { class: "font-medium" }, B = { class: "flex cursor-pointer items-center gap-2 text-sm" }, V = { key: 1 }, H = /* @__PURE__ */ m({
	__name: "CortexVersions",
	props: {
		api: {},
		live: {},
		liveTitle: {},
		published: {},
		override: { type: Boolean }
	},
	emits: ["changed"],
	setup(m, { emit: H }) {
		let U = m, W = H, { t: G } = E(), K = e(), q = y([]), J = _(!1), Y = _(null), X = _(U.live ?? ""), Z = _(!0);
		C(() => U.live, (e) => {
			X.value = e ?? "";
		});
		async function Q() {
			try {
				q.value = [...await U.api.list()].sort((e, t) => t.version - e.version), J.value = !1;
			} catch (e) {
				J.value = n(e) === 403, q.value = [];
			}
		}
		async function $(e) {
			e && (W("changed"), await Q());
		}
		async function ie() {
			await $(await K.run(() => U.api.store({
				content: X.value,
				publish: Z.value
			})));
		}
		async function ae(e) {
			await $(await K.run(() => U.api.publish(e)));
		}
		async function oe() {
			let e = U.api.destroy;
			e && window.confirm(G("cortex.versions.confirm_remove")) && await $(await K.run(() => e()));
		}
		return Q(), (e, n) => {
			let _ = r, y = a, C = i, E = ee, H = o;
			return g(), u("div", D, [
				p(t, {
					forbidden: x(K).forbidden.value,
					message: x(K).message.value
				}, null, 8, ["forbidden", "message"]),
				p(y, null, {
					header: w(() => [d("div", ne, [d("h3", re, b(m.liveTitle), 1), m.override ? (g(), u(s, { key: 0 }, [m.published === null ? (g(), c(_, {
						key: 1,
						color: "neutral",
						variant: "subtle",
						label: x(G)("cortex.versions.from_code"),
						"data-status": "from_code"
					}, null, 8, ["label"])) : (g(), c(_, {
						key: 0,
						color: "success",
						variant: "subtle",
						label: x(G)("cortex.versions.overridden", { version: m.published }),
						"data-status": "overridden"
					}, null, 8, ["label"]))], 64)) : l("", !0)]), m.override ? (g(), u("p", O, b(m.published === null ? x(G)("cortex.versions.no_override_hint") : x(G)("cortex.versions.override_hint")), 1)) : l("", !0)]),
					default: w(() => [d("pre", k, b(m.live ?? ""), 1)]),
					_: 1
				}),
				x(J) ? l("", !0) : (g(), c(y, {
					key: 0,
					"data-testid": "cortex-versions-card"
				}, {
					header: w(() => [d("h3", A, b(x(G)("cortex.versions.title")), 1)]),
					default: w(() => [x(q).length === 0 ? (g(), u("p", j, b(x(G)("cortex.versions.none")), 1)) : (g(), u("ul", M, [(g(!0), u(s, null, v(x(q), (e) => (g(), u("li", {
						key: e.version,
						class: "py-2",
						"data-testid": `cortex-version-${e.version}`
					}, [d("div", P, [
						d("span", F, "v" + b(e.version), 1),
						e.version === m.published ? (g(), c(_, {
							key: 0,
							color: "success",
							variant: "subtle",
							label: x(G)("cortex.versions.published"),
							"data-status": "published"
						}, null, 8, ["label"])) : l("", !0),
						e.created_at ? (g(), u("span", I, b(e.created_at), 1)) : l("", !0),
						d("div", L, [p(C, {
							size: "xs",
							color: "neutral",
							variant: "ghost",
							icon: x(Y) === e.version ? "i-lucide-eye-off" : "i-lucide-eye",
							label: x(Y) === e.version ? x(G)("cortex.versions.hide") : x(G)("cortex.versions.view"),
							"data-testid": `cortex-view-${e.version}`,
							onClick: () => {
								Y.value = x(Y) === e.version ? null : e.version;
							}
						}, null, 8, [
							"icon",
							"label",
							"data-testid",
							"onClick"
						]), e.version === m.published ? l("", !0) : (g(), c(C, {
							key: 0,
							size: "xs",
							variant: "outline",
							icon: "i-lucide-badge-check",
							label: x(G)("cortex.versions.publish"),
							loading: x(K).busy.value,
							"data-testid": `cortex-publish-${e.version}`,
							onClick: (t) => ae(e.version)
						}, null, 8, [
							"label",
							"loading",
							"data-testid",
							"onClick"
						]))])
					]), x(Y) === e.version ? (g(), u("pre", R, b(e.content), 1)) : l("", !0)], 8, N))), 128))]))]),
					_: 1
				})),
				p(y, { "data-testid": "cortex-new-version" }, {
					header: w(() => [d("h3", z, b(x(G)("cortex.versions.new")), 1)]),
					default: w(() => [d("form", {
						class: "flex flex-col gap-4",
						onSubmit: T(ie, ["prevent"])
					}, [
						p(H, {
							label: x(G)("cortex.versions.content"),
							error: x(K).error("content"),
							required: ""
						}, {
							default: w(() => [p(E, {
								modelValue: x(X),
								"onUpdate:modelValue": n[0] ||= (e) => h(X) ? X.value = e : null,
								rows: 8,
								class: "w-full font-mono",
								"data-testid": "cortex-version-content"
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "error"]),
						d("label", B, [te(d("input", {
							"onUpdate:modelValue": n[1] ||= (e) => h(Z) ? Z.value = e : null,
							type: "checkbox",
							class: "accent-(--ui-primary)",
							"data-testid": "cortex-version-publish"
						}, null, 512), [[S, x(Z)]]), f(" " + b(x(G)("cortex.versions.publish_now")), 1)]),
						d("div", null, [p(C, {
							type: "submit",
							icon: "i-lucide-file-plus",
							label: x(G)("cortex.versions.add"),
							loading: x(K).busy.value,
							"data-testid": "cortex-add-version"
						}, null, 8, ["label", "loading"])])
					], 32)]),
					_: 1
				}),
				m.override && m.api.destroy && m.published !== null ? (g(), u("div", V, [p(C, {
					color: "error",
					variant: "outline",
					icon: "i-lucide-trash",
					label: x(G)("cortex.versions.remove"),
					"data-testid": "cortex-remove-override",
					onClick: oe
				}, null, 8, ["label"])])) : l("", !0)
			]);
		};
	}
});
export { H as t };
