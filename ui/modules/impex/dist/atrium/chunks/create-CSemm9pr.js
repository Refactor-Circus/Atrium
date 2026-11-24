import { t as e } from "./ImpexChannelFields-DRs-N5_9.js";
import { t } from "./ImpexFlash-BLiiWCOe.js";
import { b as n, c as r, l as i, m as a, n as o, u as s } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as c, integrationData as l, useAtriumIntegration as u } from "@refactor-circus/atrium";
import { UButton as d, UCard as f, UFormField as p, UInput as m, USelect as h } from "@refactor-circus/atrium/ui";
import { computed as g, createElementBlock as _, createElementVNode as v, createTextVNode as y, createVNode as b, defineComponent as x, openBlock as S, reactive as C, toDisplayString as w, unref as T, withCtx as E, withModifiers as D } from "vue";
import { useI18n as O } from "vue-i18n";
import { useRouter as k } from "vue-router";
// src/pages/channels/create.vue?vue&type=script&setup=true&lang.ts
var A = {
	class: "space-y-4",
	"data-testid": "impex-channel-create"
}, j = { class: "text-xl font-semibold" }, M = { class: "space-y-4" }, N = { class: "flex flex-wrap items-end gap-3" }, P = /* @__PURE__ */ x({
	__name: "create",
	setup(x) {
		let { t: P } = O(), F = k(), { client: I } = u("impex"), L = n(), R = C({
			name: "",
			direction: "inbound",
			...s()
		}), z = g(() => o.map((e) => ({
			label: P(`impex.directions.${e}`),
			value: e
		})));
		async function B() {
			if (!I) return;
			let e = r(R);
			if (e === null) {
				L.invalid("options", P("impex.channel.options_invalid"));
				return;
			}
			let t = a({
				name: R.name,
				direction: R.direction,
				...e
			});
			await L.run(async () => l(await I.POST("/channels", { body: t })), async (e) => {
				await F.push(i(e.data.name));
			});
		}
		return (n, r) => {
			let i = m, a = p, o = h, s = d, l = f, u = c;
			return S(), _("div", A, [v("h1", j, w(T(P)("impex.channel.create_title")), 1), b(u, { "screen-key": "impex.channel-create" }, {
				default: E(() => [v("div", M, [b(t, { action: T(L) }, null, 8, ["action"]), b(l, null, {
					default: E(() => [v("form", {
						class: "flex flex-col gap-4",
						"data-testid": "impex-channel-create-form",
						onSubmit: D(B, ["prevent"])
					}, [v("div", N, [
						b(a, {
							label: T(P)("impex.channels.name"),
							hint: T(P)("impex.channel.name_hint"),
							class: "w-64"
						}, {
							default: E(() => [b(i, {
								modelValue: T(R).name,
								"onUpdate:modelValue": r[0] ||= (e) => T(R).name = e,
								name: "name",
								required: ""
							}, null, 8, ["modelValue"])]),
							_: 1
						}, 8, ["label", "hint"]),
						b(a, {
							label: T(P)("impex.channels.direction"),
							class: "w-44"
						}, {
							default: E(() => [b(o, {
								modelValue: T(R).direction,
								"onUpdate:modelValue": r[1] ||= (e) => T(R).direction = e,
								items: T(z),
								name: "direction"
							}, null, 8, ["modelValue", "items"])]),
							_: 1
						}, 8, ["label"]),
						b(e, { form: T(R) }, null, 8, ["form"])
					]), v("div", null, [b(s, {
						type: "submit",
						icon: "i-lucide-plus",
						loading: T(L).busy.value,
						"data-testid": "impex-channel-create-submit"
					}, {
						default: E(() => [y(w(T(P)("impex.channel.create")), 1)]),
						_: 1
					}, 8, ["loading"])])], 32)]),
					_: 1
				})])]),
				_: 1
			})]);
		};
	}
});
export { P as default };
