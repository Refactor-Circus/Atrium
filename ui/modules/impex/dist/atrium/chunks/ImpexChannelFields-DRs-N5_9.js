import { i as e, r as t, t as n } from "./shared-N5-QMPBo.js";
import { UFormField as r, UInput as i, USelect as a, UTextarea as o } from "@refactor-circus/atrium/ui";
import { Fragment as s, computed as c, createElementBlock as l, createVNode as u, defineComponent as d, openBlock as f, unref as p, withCtx as m } from "vue";
import { useI18n as h } from "vue-i18n";
// src/components/ImpexChannelFields.vue
var g = /* @__PURE__ */ d({
	__name: "ImpexChannelFields",
	props: { form: {} },
	setup(d) {
		let g = d, { t: _ } = h(), v = g.form, y = e.map((e) => ({
			label: e,
			value: e
		})), b = c(() => t.map((e) => ({
			label: _(`impex.statuses.${e}`),
			value: e
		}))), x = c(() => n.map((e) => ({
			label: _(`impex.body_policies.${e}`),
			value: e
		})));
		return (e, t) => {
			let n = a, c = r, d = i, h = o;
			return f(), l(s, null, [
				u(c, {
					label: p(_)("impex.channels.transport"),
					class: "w-44"
				}, {
					default: m(() => [u(n, {
						modelValue: p(v).transport,
						"onUpdate:modelValue": t[0] ||= (e) => p(v).transport = e,
						items: p(y),
						name: "transport"
					}, null, 8, ["modelValue", "items"])]),
					_: 1
				}, 8, ["label"]),
				u(c, {
					label: p(_)("impex.channels.status"),
					class: "w-44"
				}, {
					default: m(() => [u(n, {
						modelValue: p(v).status,
						"onUpdate:modelValue": t[1] ||= (e) => p(v).status = e,
						items: p(b),
						name: "status"
					}, null, 8, ["modelValue", "items"])]),
					_: 1
				}, 8, ["label"]),
				u(c, {
					label: p(_)("impex.channel.body_policy"),
					class: "w-56"
				}, {
					default: m(() => [u(n, {
						modelValue: p(v).body_policy,
						"onUpdate:modelValue": t[2] ||= (e) => p(v).body_policy = e,
						items: p(x),
						name: "body_policy"
					}, null, 8, ["modelValue", "items"])]),
					_: 1
				}, 8, ["label"]),
				u(c, {
					label: p(_)("impex.channel.signing_secret"),
					hint: p(_)("impex.channel.signing_secret_hint"),
					class: "w-72"
				}, {
					default: m(() => [u(d, {
						modelValue: p(v).signing_secret,
						"onUpdate:modelValue": t[3] ||= (e) => p(v).signing_secret = e,
						name: "signing_secret",
						type: "password",
						autocomplete: "new-password"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label", "hint"]),
				u(c, {
					label: p(_)("impex.channel.options"),
					hint: p(_)("impex.channel.options_hint"),
					class: "w-full"
				}, {
					default: m(() => [u(h, {
						modelValue: p(v).options_json,
						"onUpdate:modelValue": t[4] ||= (e) => p(v).options_json = e,
						name: "options_json",
						rows: 6,
						class: "w-full font-mono"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label", "hint"])
			], 64);
		};
	}
});
export { g as t };
