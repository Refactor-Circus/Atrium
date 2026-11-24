import { t as e } from "./ImpexChannelFields-DRs-N5_9.js";
import { t } from "./ImpexFlash-BLiiWCOe.js";
import { t as n } from "./ImpexState-Mg53d6po.js";
import { t as r } from "./ImpexStatusBadge-ePLj75gE.js";
import { S as i, b as a, c as o, m as s, u as c } from "./shared-N5-QMPBo.js";
import { AtriumIntegrationScreen as l, integrationData as u } from "@refactor-circus/atrium";
import { UButton as ee, UCard as d } from "@refactor-circus/atrium/ui";
import { Fragment as f, computed as p, createBlock as m, createCommentVNode as h, createElementBlock as g, createElementVNode as _, createTextVNode as v, createVNode as y, defineComponent as te, openBlock as b, reactive as ne, ref as re, toDisplayString as x, unref as S, watch as C, withCtx as w, withModifiers as T } from "vue";
import { useI18n as E } from "vue-i18n";
import { useRoute as D, useRouter as O } from "vue-router";
// src/pages/channels/[name].vue?vue&type=script&setup=true&lang.ts
var k = {
	class: "space-y-4",
	"data-testid": "impex-channel"
}, A = {
	key: 0,
	class: "space-y-4"
}, j = { class: "flex flex-wrap items-center justify-between gap-3" }, M = { class: "text-xl font-semibold" }, N = { class: "text-sm text-muted" }, P = {
	key: 0,
	class: "flex gap-2"
}, F = {
	class: "grid gap-3 text-sm sm:grid-cols-2",
	"data-testid": "impex-channel-details"
}, I = { class: "text-muted" }, ie = { class: "text-muted" }, L = { class: "text-muted" }, R = { key: 0 }, z = { class: "text-muted" }, B = { class: "text-muted" }, V = { class: "font-medium" }, H = { class: "flex flex-wrap items-end gap-3" }, U = { class: "font-medium" }, W = {
	class: "overflow-x-auto rounded-md bg-elevated p-2 text-xs",
	"data-testid": "impex-channel-options"
}, G = { class: "mt-2 text-sm text-muted" }, K = /* @__PURE__ */ te({
	__name: "[name]",
	setup(te) {
		let { t: K } = E(), q = D(), J = O(), Y = p(() => String(q.params.name ?? "")), X = i(async (e) => u(await e.GET("/channels/{name}", { params: { path: { name: Y.value } } })).data, Y), Z = a(), Q = ne(c()), $ = re(!1);
		C(() => X.data.value, (e) => {
			e && Object.assign(Q, c(e));
		});
		async function ae() {
			let e = X.client, t = o(Q);
			if (!e) return;
			if (t === null) {
				Z.invalid("options", K("impex.channel.options_invalid"));
				return;
			}
			let n = s(t);
			await Z.run(async () => u(await e.PATCH("/channels/{channel}", {
				params: { path: { channel: Y.value } },
				body: n
			})), async () => (await X.reload(), K("impex.channel.updated")));
		}
		async function oe() {
			let e = X.client;
			e && await Z.run(async () => u(await e.POST("/channels/{channel}/rotate-secret", { params: { path: { channel: Y.value } } })), async (e) => (await X.reload(), K("impex.channel.secret_rotated", { secret: e.secret })));
		}
		async function se() {
			let e = X.client;
			e && ($.value = !1, await Z.run(async () => u(await e.DELETE("/channels/{channel}", { params: { path: { channel: Y.value } } })), async () => {
				await J.push("/impex/channels");
			}));
		}
		return (i, a) => {
			let o = ee, s = d, c = l;
			return b(), g("div", k, [y(c, {
				"screen-key": "impex.channel",
				record: S(Y)
			}, {
				default: w(() => [y(n, {
					error: S(X).error.value,
					ready: S(X).data.value !== null
				}, {
					default: w(() => [S(X).data.value ? (b(), g("div", A, [
						_("header", j, [_("div", null, [_("h1", M, x(S(X).data.value.name), 1), _("p", N, x(S(K)(`impex.directions.${S(X).data.value.direction}`)) + " · " + x(S(X).data.value.transport), 1)]), S(X).data.value.stored ? (b(), g("div", P, [y(o, {
							variant: "outline",
							icon: "i-lucide-key-round",
							loading: S(Z).busy.value,
							"data-testid": "impex-channel-rotate",
							onClick: oe
						}, {
							default: w(() => [v(x(S(K)("impex.channel.rotate_secret")), 1)]),
							_: 1
						}, 8, ["loading"]), S($) ? (b(), g(f, { key: 1 }, [y(o, {
							color: "error",
							icon: "i-lucide-trash-2",
							loading: S(Z).busy.value,
							"data-testid": "impex-channel-delete-confirm",
							onClick: se
						}, {
							default: w(() => [v(x(S(K)("impex.channel.delete_confirm")), 1)]),
							_: 1
						}, 8, ["loading"]), y(o, {
							variant: "ghost",
							"data-testid": "impex-channel-delete-cancel",
							onClick: a[1] ||= () => {
								$.value = !1;
							}
						}, {
							default: w(() => [v(x(S(K)("impex.common.cancel")), 1)]),
							_: 1
						})], 64)) : (b(), m(o, {
							key: 0,
							variant: "outline",
							color: "error",
							icon: "i-lucide-trash-2",
							"data-testid": "impex-channel-delete",
							onClick: a[0] ||= () => {
								$.value = !0;
							}
						}, {
							default: w(() => [v(x(S(K)("impex.channel.delete")), 1)]),
							_: 1
						}))])) : h("", !0)]),
						y(t, { action: S(Z) }, null, 8, ["action"]),
						y(s, null, {
							default: w(() => [_("dl", F, [
								_("div", null, [_("dt", I, x(S(K)("impex.channels.status")), 1), _("dd", null, [y(r, { status: S(X).data.value.status }, null, 8, ["status"])])]),
								_("div", null, [_("dt", ie, x(S(K)("impex.channel.body_policy")), 1), _("dd", null, x(S(K)(`impex.body_policies.${S(X).data.value.body_policy}`)), 1)]),
								_("div", null, [_("dt", L, x(S(K)("impex.message.signature")), 1), _("dd", null, x(S(X).data.value.verifies_signatures ? S(K)("impex.message.verified") : S(K)("impex.message.unsigned")), 1)]),
								S(X).data.value.flow ? (b(), g("div", R, [_("dt", z, x(S(K)("impex.channel.flow")), 1), _("dd", null, x(S(X).data.value.flow), 1)])) : h("", !0),
								_("div", null, [_("dt", B, x(S(K)("impex.channels.source")), 1), _("dd", null, x(S(X).data.value.stored ? S(K)("impex.channels.stored") : S(K)("impex.channels.from_config")), 1)])
							])]),
							_: 1
						}),
						S(X).data.value.stored ? (b(), m(s, { key: 0 }, {
							header: w(() => [_("h2", V, x(S(K)("impex.channel.edit")), 1)]),
							default: w(() => [_("form", {
								class: "flex flex-col gap-4",
								"data-testid": "impex-channel-update",
								onSubmit: T(ae, ["prevent"])
							}, [_("div", H, [y(e, { form: S(Q) }, null, 8, ["form"])]), _("div", null, [y(o, {
								type: "submit",
								loading: S(Z).busy.value
							}, {
								default: w(() => [v(x(S(K)("impex.common.save")), 1)]),
								_: 1
							}, 8, ["loading"])])], 32)]),
							_: 1
						})) : (b(), m(s, { key: 1 }, {
							header: w(() => [_("h2", U, x(S(K)("impex.channel.options")), 1)]),
							default: w(() => [_("pre", W, x(JSON.stringify(S(X).data.value.options, null, 2)), 1), _("p", G, x(S(K)("impex.channel.configured_hint")), 1)]),
							_: 1
						}))
					])) : h("", !0)]),
					_: 1
				}, 8, ["error", "ready"])]),
				_: 1
			}, 8, ["record"])]);
		};
	}
});
export { K as default };
