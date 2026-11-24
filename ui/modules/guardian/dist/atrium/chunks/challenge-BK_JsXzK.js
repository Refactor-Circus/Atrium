import { t as e } from "./client-mF818ZGi.js";
import { a as t, c as n, o as r, u as i } from "./guardian-D9MeowUD.js";
import { t as a } from "./GuardianActionError-DKEMy_E4.js";
import { n as o, r as s } from "./webauthn-DJJMk2td.js";
import { AtriumErrorCard as c, atriumStatus as l, useAtriumShellStore as u, useHead as ee } from "@refactor-circus/atrium";
import { Fragment as d, computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createTextVNode as _, createVNode as v, defineComponent as te, isRef as ne, openBlock as y, ref as b, renderList as x, shallowRef as S, toDisplayString as C, unref as w, watch as T, withCtx as E, withModifiers as re } from "vue";
import { UAlert as ie, UButton as ae, UCard as oe, UFormField as D, UInput as O, USkeleton as k } from "@refactor-circus/atrium/ui";
import { useI18n as A } from "vue-i18n";
import { useRoute as j, useRouter as M } from "vue-router";
// src/pages/two-factor/challenge.vue?vue&type=script&setup=true&lang.ts
var N = { class: "text-lg font-semibold" }, P = { class: "text-sm text-muted" }, F = {
	key: 3,
	class: "space-y-4"
}, I = {
	key: 1,
	class: "flex flex-wrap gap-1",
	role: "tablist",
	"data-testid": "guardian-challenge-methods"
}, L = {
	key: 0,
	class: "flex items-center gap-2"
}, R = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "guardian-challenge-sent"
}, z = /* @__PURE__ */ te({
	__name: "challenge",
	setup(te) {
		let { t: z } = A(), B = j(), V = M(), H = u(), U = e(), W = i();
		ee({ title: () => z("guardian.two_factor.challenge.title") });
		let G = b("loading"), K = S(null), q = b(null), J = b(""), Y = b(!1), X = f(() => {
			let e = K.value;
			if (!e) return [];
			let t = new Set(e.methods.filter((e) => e.confirmed_at !== null).map((e) => e.type)), n = [];
			for (let e of [
				"totp",
				"email",
				"sms"
			]) t.has(e) && n.push(e);
			return e.passkeys.length > 0 && e.passkeys_available && s() && n.push("passkey"), e.recovery_codes_remaining > 0 && n.push("recovery"), n;
		});
		T(X, (e) => {
			q.value !== null && e.includes(q.value) || (q.value = e[0] ?? null);
		}), T(q, () => {
			J.value = "", Y.value = !1, W.reset();
		});
		function se(e) {
			q.value = e;
		}
		async function ce() {
			G.value = "loading";
			try {
				K.value = r(await U.GET("/two-factor")).data, G.value = "ready";
			} catch (e) {
				G.value = l(e) === 429 ? "throttled" : "failed";
			}
		}
		async function le() {
			await H.load(!0), await V.replace(t(B.query.redirect));
		}
		function Z(e) {
			if (e) return le();
			W.status.value === 429 && (G.value = "throttled");
		}
		async function ue() {
			let e = q.value;
			(e === "email" || e === "sms") && (Y.value = await W.run(async () => {
				r(await U.POST("/two-factor/challenge/send", { body: { method: e } }));
			}), await Z(!1));
		}
		async function Q() {
			let e = q.value;
			if (!e || e === "passkey") return;
			let t = {
				method: e,
				code: J.value.trim()
			};
			J.value = "", await Z(await W.run(async () => {
				r(await U.POST("/two-factor/challenge", { body: t }));
			}));
		}
		async function de() {
			await Z(await W.run(async () => {
				let e = r(await U.POST("/two-factor/challenge/passkey-options")).data, t = await o(e);
				r(await U.POST("/two-factor/challenge", { body: n({
					method: "passkey",
					assertion: t
				}) }));
			}));
		}
		let $ = f(() => W.error("code") ?? W.error("assertion") ?? W.error("method") ?? (W.status.value === 422 ? W.message.value : null));
		return ce(), (e, t) => {
			let n = k, r = ie, i = c, o = ae, s = O, l = D, u = oe;
			return y(), p(u, { "data-testid": "guardian-challenge" }, {
				header: E(() => [g("h1", N, C(w(z)("guardian.two_factor.challenge.title")), 1), g("p", P, C(w(z)("guardian.two_factor.challenge.intro")), 1)]),
				default: E(() => [w(G) === "loading" ? (y(), p(n, {
					key: 0,
					class: "h-32",
					"data-testid": "guardian-challenge-loading"
				})) : w(G) === "throttled" ? (y(), p(r, {
					key: 1,
					color: "warning",
					variant: "subtle",
					icon: "i-lucide-timer",
					title: w(z)("guardian.two_factor.throttled"),
					description: w(W).retryAfter.value ? w(z)("guardian.two_factor.retry_after", { seconds: w(W).retryAfter.value }) : w(z)("guardian.two_factor.challenge.try_later"),
					"data-testid": "guardian-challenge-throttled"
				}, null, 8, ["title", "description"])) : w(G) === "failed" ? (y(), p(i, {
					key: 2,
					message: w(z)("guardian.two_factor.challenge.load_failed")
				}, null, 8, ["message"])) : (y(), h("div", F, [
					w(X).length === 0 ? (y(), p(r, {
						key: 0,
						color: "neutral",
						variant: "subtle",
						title: w(z)("guardian.two_factor.challenge.no_methods"),
						"data-testid": "guardian-challenge-none"
					}, null, 8, ["title"])) : (y(), h("div", I, [(y(!0), h(d, null, x(w(X), (e) => (y(), p(o, {
						key: e,
						size: "sm",
						color: w(q) === e ? "primary" : "neutral",
						variant: w(q) === e ? "solid" : "ghost",
						"aria-pressed": w(q) === e,
						"data-testid": `guardian-challenge-method-${e}`,
						onClick: (t) => se(e)
					}, {
						default: E(() => [_(C(w(z)(`guardian.two_factor.challenge.methods.${e}`)), 1)]),
						_: 2
					}, 1032, [
						"color",
						"variant",
						"aria-pressed",
						"data-testid",
						"onClick"
					]))), 128))])),
					w($) ? (y(), p(r, {
						key: 2,
						color: "error",
						variant: "subtle",
						title: w($),
						"data-testid": "guardian-challenge-error"
					}, null, 8, ["title"])) : w(W).status.value !== 422 && w(W).status.value !== 429 ? (y(), p(a, {
						key: 3,
						action: w(W)
					}, null, 8, ["action"])) : m("", !0),
					w(q) === "passkey" ? (y(), p(o, {
						key: 4,
						icon: "i-lucide-key-round",
						loading: w(W).busy.value,
						"data-testid": "guardian-challenge-passkey",
						onClick: de
					}, {
						default: E(() => [_(C(w(z)("guardian.two_factor.challenge.use_passkey")), 1)]),
						_: 1
					}, 8, ["loading"])) : w(q) ? (y(), h("form", {
						key: 5,
						class: "space-y-3",
						"data-testid": "guardian-challenge-form",
						onSubmit: re(Q, ["prevent"])
					}, [
						w(q) === "email" || w(q) === "sms" ? (y(), h("div", L, [v(o, {
							type: "button",
							color: "neutral",
							variant: "soft",
							loading: w(W).busy.value,
							"data-testid": "guardian-challenge-send",
							onClick: ue
						}, {
							default: E(() => [_(C(w(Y) ? w(z)("guardian.two_factor.one_time.resend") : w(z)("guardian.two_factor.one_time.send")), 1)]),
							_: 1
						}, 8, ["loading"]), w(Y) ? (y(), h("span", R, C(w(z)("guardian.two_factor.one_time.sent")), 1)) : m("", !0)])) : m("", !0),
						v(l, {
							label: w(z)(w(q) === "recovery" ? "guardian.two_factor.fields.recovery_code" : "guardian.two_factor.fields.code"),
							required: ""
						}, {
							default: E(() => [v(s, {
								modelValue: w(J),
								"onUpdate:modelValue": t[0] ||= (e) => ne(J) ? J.value = e : null,
								autocomplete: "one-time-code",
								inputmode: w(q) === "recovery" ? "text" : "numeric",
								autofocus: "",
								"data-testid": "guardian-challenge-code"
							}, null, 8, ["modelValue", "inputmode"])]),
							_: 1
						}, 8, ["label"]),
						v(o, {
							type: "submit",
							loading: w(W).busy.value,
							"data-testid": "guardian-challenge-submit"
						}, {
							default: E(() => [_(C(w(z)("guardian.two_factor.challenge.submit")), 1)]),
							_: 1
						}, 8, ["loading"])
					], 32)) : m("", !0)
				]))]),
				_: 1
			});
		};
	}
});
export { z as default };
