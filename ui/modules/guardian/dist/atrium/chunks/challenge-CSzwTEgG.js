import { t as e } from "./client-qaf8OSpi.js";
import { a as t, c as n, o as r, u as i } from "./guardian-Dugz84u2.js";
import { t as a } from "./GuardianActionError-DiiAaIHC.js";
import { n as o, r as s } from "./webauthn-DJJMk2td.js";
import { Fragment as c, computed as l, createBlock as u, createCommentVNode as d, createElementBlock as f, createElementVNode as p, createTextVNode as m, createVNode as h, defineComponent as g, isRef as _, openBlock as v, ref as y, renderList as b, shallowRef as x, toDisplayString as S, unref as C, watch as w, withCtx as T, withModifiers as E } from "vue";
import { AtriumErrorCard as ee, atriumStatus as te, useAtriumShellStore as ne, useHead as re } from "@refactor-circus/atrium";
import { useRoute as ie, useRouter as ae } from "vue-router";
import { UAlert as D, UButton as O, UCard as k, UFormField as A, UInput as j, USkeleton as M } from "@refactor-circus/atrium/ui";
import { useI18n as N } from "vue-i18n";
// src/pages/two-factor/challenge.vue?vue&type=script&setup=true&lang.ts
var P = { class: "text-lg font-semibold" }, F = { class: "text-sm text-muted" }, I = {
	key: 3,
	class: "space-y-4"
}, L = {
	key: 1,
	class: "flex flex-wrap gap-1",
	role: "tablist",
	"data-testid": "guardian-challenge-methods"
}, R = {
	key: 0,
	class: "flex items-center gap-2"
}, z = {
	key: 0,
	class: "text-sm text-muted",
	"data-testid": "guardian-challenge-sent"
}, B = /* @__PURE__ */ g({
	__name: "challenge",
	setup(g) {
		let { t: B } = N(), V = ie(), H = ae(), oe = ne(), U = e(), W = i();
		re({ title: () => B("guardian.two_factor.challenge.title") });
		let G = y("loading"), K = x(null), q = y(null), J = y(""), Y = y(!1), X = l(() => {
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
		w(X, (e) => {
			q.value !== null && e.includes(q.value) || (q.value = e[0] ?? null);
		}), w(q, () => {
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
				G.value = te(e) === 429 ? "throttled" : "failed";
			}
		}
		async function le() {
			await oe.load(!0), await H.replace(t(V.query.redirect));
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
		let $ = l(() => W.error("code") ?? W.error("assertion") ?? W.error("method") ?? (W.status.value === 422 ? W.message.value : null));
		return ce(), (e, t) => {
			let n = M, r = D, i = ee, o = O, s = j, l = A, g = k;
			return v(), u(g, { "data-testid": "guardian-challenge" }, {
				header: T(() => [p("h1", P, S(C(B)("guardian.two_factor.challenge.title")), 1), p("p", F, S(C(B)("guardian.two_factor.challenge.intro")), 1)]),
				default: T(() => [C(G) === "loading" ? (v(), u(n, {
					key: 0,
					class: "h-32",
					"data-testid": "guardian-challenge-loading"
				})) : C(G) === "throttled" ? (v(), u(r, {
					key: 1,
					color: "warning",
					variant: "subtle",
					icon: "i-lucide-timer",
					title: C(B)("guardian.two_factor.throttled"),
					description: C(W).retryAfter.value ? C(B)("guardian.two_factor.retry_after", { seconds: C(W).retryAfter.value }) : C(B)("guardian.two_factor.challenge.try_later"),
					"data-testid": "guardian-challenge-throttled"
				}, null, 8, ["title", "description"])) : C(G) === "failed" ? (v(), u(i, {
					key: 2,
					message: C(B)("guardian.two_factor.challenge.load_failed")
				}, null, 8, ["message"])) : (v(), f("div", I, [
					C(X).length === 0 ? (v(), u(r, {
						key: 0,
						color: "neutral",
						variant: "subtle",
						title: C(B)("guardian.two_factor.challenge.no_methods"),
						"data-testid": "guardian-challenge-none"
					}, null, 8, ["title"])) : (v(), f("div", L, [(v(!0), f(c, null, b(C(X), (e) => (v(), u(o, {
						key: e,
						size: "sm",
						color: C(q) === e ? "primary" : "neutral",
						variant: C(q) === e ? "solid" : "ghost",
						"aria-pressed": C(q) === e,
						"data-testid": `guardian-challenge-method-${e}`,
						onClick: (t) => se(e)
					}, {
						default: T(() => [m(S(C(B)(`guardian.two_factor.challenge.methods.${e}`)), 1)]),
						_: 2
					}, 1032, [
						"color",
						"variant",
						"aria-pressed",
						"data-testid",
						"onClick"
					]))), 128))])),
					C($) ? (v(), u(r, {
						key: 2,
						color: "error",
						variant: "subtle",
						title: C($),
						"data-testid": "guardian-challenge-error"
					}, null, 8, ["title"])) : C(W).status.value !== 422 && C(W).status.value !== 429 ? (v(), u(a, {
						key: 3,
						action: C(W)
					}, null, 8, ["action"])) : d("", !0),
					C(q) === "passkey" ? (v(), u(o, {
						key: 4,
						icon: "i-lucide-key-round",
						loading: C(W).busy.value,
						"data-testid": "guardian-challenge-passkey",
						onClick: de
					}, {
						default: T(() => [m(S(C(B)("guardian.two_factor.challenge.use_passkey")), 1)]),
						_: 1
					}, 8, ["loading"])) : C(q) ? (v(), f("form", {
						key: 5,
						class: "space-y-3",
						"data-testid": "guardian-challenge-form",
						onSubmit: E(Q, ["prevent"])
					}, [
						C(q) === "email" || C(q) === "sms" ? (v(), f("div", R, [h(o, {
							type: "button",
							color: "neutral",
							variant: "soft",
							loading: C(W).busy.value,
							"data-testid": "guardian-challenge-send",
							onClick: ue
						}, {
							default: T(() => [m(S(C(Y) ? C(B)("guardian.two_factor.one_time.resend") : C(B)("guardian.two_factor.one_time.send")), 1)]),
							_: 1
						}, 8, ["loading"]), C(Y) ? (v(), f("span", z, S(C(B)("guardian.two_factor.one_time.sent")), 1)) : d("", !0)])) : d("", !0),
						h(l, {
							label: C(B)(C(q) === "recovery" ? "guardian.two_factor.fields.recovery_code" : "guardian.two_factor.fields.code"),
							required: ""
						}, {
							default: T(() => [h(s, {
								modelValue: C(J),
								"onUpdate:modelValue": t[0] ||= (e) => _(J) ? J.value = e : null,
								autocomplete: "one-time-code",
								inputmode: C(q) === "recovery" ? "text" : "numeric",
								autofocus: "",
								"data-testid": "guardian-challenge-code"
							}, null, 8, ["modelValue", "inputmode"])]),
							_: 1
						}, 8, ["label"]),
						h(o, {
							type: "submit",
							loading: C(W).busy.value,
							"data-testid": "guardian-challenge-submit"
						}, {
							default: T(() => [m(S(C(B)("guardian.two_factor.challenge.submit")), 1)]),
							_: 1
						}, 8, ["loading"])
					], 32)) : d("", !0)
				]))]),
				_: 1
			});
		};
	}
});
export { B as default };
