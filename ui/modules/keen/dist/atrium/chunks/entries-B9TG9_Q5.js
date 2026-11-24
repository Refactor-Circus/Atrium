import { t as e } from "./KeenEntriesBrowser-CmsbGdNP.js";
import { i as t } from "./entries-ofT4k6gi.js";
import { AtriumIntegrationScreen as n, AtriumNoAccess as r, atriumStatus as i, integrationData as a, useAtriumIntegration as o, useHead as s } from "@refactor-circus/atrium";
import { computed as c, createBlock as l, createCommentVNode as u, createElementVNode as d, createTextVNode as f, createVNode as p, defineComponent as m, onMounted as h, openBlock as g, reactive as _, ref as v, shallowRef as y, toDisplayString as b, unref as x, useTemplateRef as S, withCtx as C, withModifiers as w } from "vue";
import { UAlert as T, UButton as E, UCard as D, UDashboardNavbar as O, UDashboardPanel as k, UFormField as A, UInput as j } from "@refactor-circus/atrium/ui";
import { useI18n as M } from "vue-i18n";
// src/components/KeenRecordForm.vue?vue&type=script&setup=true&lang.ts
var N = { class: "font-medium" }, P = /* @__PURE__ */ m({
	__name: "KeenRecordForm",
	emits: ["recorded"],
	setup(e, { emit: n }) {
		let s = n, { t: m } = M(), { client: h } = o("keen"), S = _({
			action: "",
			subject_label: "",
			note: ""
		}), O = y(null), k = v(!1), P = v(!1), F = c(() => t(O.value)), I = c(() => i(O.value) === 403), L = c(() => O.value !== null && !I.value && Object.keys(F.value).length === 0);
		async function R() {
			if (h) {
				k.value = !0, P.value = !1, O.value = null;
				try {
					a(await h.POST("/entries", { body: {
						action: S.action,
						...S.subject_label === "" ? {} : { subject_label: S.subject_label },
						...S.note === "" ? {} : { context: { note: S.note } }
					} })), Object.assign(S, {
						action: "",
						subject_label: "",
						note: ""
					}), P.value = !0, s("recorded");
				} catch (e) {
					O.value = e;
				} finally {
					k.value = !1;
				}
			}
		}
		return (e, t) => {
			let n = r, i = T, a = j, o = A, s = E, c = D;
			return g(), l(c, { "data-testid": "keen-record" }, {
				header: C(() => [d("h2", N, b(x(m)("keen.record.title")), 1)]),
				default: C(() => [x(I) ? (g(), l(n, {
					key: 0,
					compact: "",
					description: x(m)("keen.record.forbidden"),
					class: "mb-3"
				}, null, 8, ["description"])) : x(L) ? (g(), l(i, {
					key: 1,
					color: "error",
					title: x(m)("keen.record.failed"),
					class: "mb-3",
					"data-testid": "keen-record-failed"
				}, null, 8, ["title"])) : x(P) ? (g(), l(i, {
					key: 2,
					color: "success",
					variant: "subtle",
					title: x(m)("keen.record.recorded"),
					class: "mb-3",
					"data-testid": "keen-record-done"
				}, null, 8, ["title"])) : u("", !0), d("form", {
					class: "flex flex-wrap items-start gap-3",
					"data-testid": "keen-record-form",
					onSubmit: w(R, ["prevent"])
				}, [
					p(o, {
						label: x(m)("keen.record.action"),
						name: "action",
						hint: x(m)("keen.record.action_hint"),
						error: x(F).action?.[0],
						required: "",
						class: "w-56"
					}, {
						default: C(() => [p(a, {
							modelValue: x(S).action,
							"onUpdate:modelValue": t[0] ||= (e) => x(S).action = e,
							required: "",
							class: "w-full",
							"data-testid": "keen-record-action"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, [
						"label",
						"hint",
						"error"
					]),
					p(o, {
						label: x(m)("keen.record.subject"),
						name: "subject_label",
						error: x(F).subject_label?.[0],
						class: "w-56"
					}, {
						default: C(() => [p(a, {
							modelValue: x(S).subject_label,
							"onUpdate:modelValue": t[1] ||= (e) => x(S).subject_label = e,
							class: "w-full",
							"data-testid": "keen-record-subject"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"]),
					p(o, {
						label: x(m)("keen.record.note"),
						name: "note",
						error: x(F)["context.note"]?.[0] ?? x(F).context?.[0],
						class: "w-80"
					}, {
						default: C(() => [p(a, {
							modelValue: x(S).note,
							"onUpdate:modelValue": t[2] ||= (e) => x(S).note = e,
							class: "w-full",
							"data-testid": "keen-record-note"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"]),
					p(s, {
						type: "submit",
						icon: "i-lucide-square-pen",
						loading: x(k),
						class: "self-end",
						"data-testid": "keen-record-submit"
					}, {
						default: C(() => [f(b(x(m)("keen.record.submit")), 1)]),
						_: 1
					}, 8, ["loading"])
				], 32)]),
				_: 1
			});
		};
	}
}), F = {
	class: "space-y-4",
	"data-testid": "keen-entries-page"
}, I = /* @__PURE__ */ m({
	__name: "index",
	setup(t) {
		let { t: r } = M(), { client: i } = o("keen"), c = S("browser"), u = y([]);
		return s({ title: () => r("keen.audit_log") }), h(async () => {
			try {
				let e = i ? a(await i.GET("/packages")).data : [];
				u.value = e.map((e) => ({
					value: e.key,
					label: e.label
				}));
			} catch {}
		}), (t, i) => {
			let a = O, o = n, s = k;
			return g(), l(s, null, {
				header: C(() => [p(a, { title: x(r)("keen.audit_log") }, null, 8, ["title"])]),
				body: C(() => [p(o, { "screen-key": "keen.entries" }, {
					default: C(() => [d("div", F, [p(e, {
						ref_key: "browser",
						ref: c,
						sources: x(u)
					}, null, 8, ["sources"]), p(P, { onRecorded: i[0] ||= (e) => x(c)?.reload() })])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { I as default };
