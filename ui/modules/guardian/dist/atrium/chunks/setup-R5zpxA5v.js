import { t as e } from "./client-mF818ZGi.js";
import { a as t, i as n, o as r, s as i } from "./guardian-D9MeowUD.js";
import { n as a, t as o } from "./GuardianTwoFactorMethods-D8eBBpuX.js";
import { AtriumErrorCard as s, AtriumNoAccess as c, atriumStatus as l, useAtriumShellStore as u, useHead as d } from "@refactor-circus/atrium";
import { computed as f, createBlock as p, createCommentVNode as m, createElementBlock as h, createElementVNode as g, createVNode as _, defineComponent as v, onBeforeUnmount as y, openBlock as b, ref as x, shallowRef as S, toDisplayString as C, unref as w, withCtx as T } from "vue";
import { UAlert as E, UCard as D, USkeleton as O } from "@refactor-circus/atrium/ui";
import { useI18n as k } from "vue-i18n";
import { useRoute as A, useRouter as j } from "vue-router";
// src/pages/two-factor/setup.vue?vue&type=script&setup=true&lang.ts
var M = { class: "text-lg font-semibold" }, N = { class: "text-sm text-muted" }, P = {
	key: 4,
	class: "space-y-4"
}, F = {
	class: "text-sm",
	"data-testid": "guardian-setup-allowed"
}, I = /* @__PURE__ */ v({
	__name: "setup",
	setup(v) {
		let { t: I } = k(), L = A(), R = j(), z = u(), B = e();
		d({ title: () => I("guardian.two_factor.setup.title") });
		let V = x("loading"), H = S(null), U = x(null), W = f(() => i(H.value));
		async function G() {
			try {
				H.value = r(await B.GET("/two-factor")).data, V.value = "ready";
			} catch (e) {
				V.value = l(e) === 403 ? "forbidden" : "failed";
			}
		}
		async function K() {
			U.value = null, await z.load(!0), await R.replace(t(L.query.redirect));
		}
		async function q(e) {
			e && e.length > 0 ? U.value = e : await K();
		}
		return y(() => {
			U.value = null;
		}), G(), (e, t) => {
			let r = O, i = c, l = s, u = E, d = D;
			return b(), p(d, { "data-testid": "guardian-setup" }, {
				header: T(() => [g("h1", M, C(w(I)("guardian.two_factor.setup.title")), 1), g("p", N, C(w(I)("guardian.two_factor.setup.intro")), 1)]),
				default: T(() => [w(V) === "loading" ? (b(), p(r, {
					key: 0,
					class: "h-32",
					"data-testid": "guardian-setup-loading"
				})) : w(V) === "forbidden" ? (b(), p(i, { key: 1 })) : w(V) === "failed" || !w(H) ? (b(), p(l, {
					key: 2,
					message: w(I)("guardian.two_factor.setup.load_failed")
				}, null, 8, ["message"])) : w(U) ? (b(), p(a, {
					key: 3,
					codes: w(U),
					onDone: K
				}, null, 8, ["codes"])) : (b(), h("div", P, [
					g("p", F, C(w(I)("guardian.two_factor.setup.allowed", { methods: w(W).map((e) => w(I)(`guardian.two_factor.types.${e}`)).join(", ") })), 1),
					w(H).enrolment_deadline ? (b(), p(u, {
						key: 0,
						color: "warning",
						variant: "subtle",
						title: w(I)("guardian.two_factor.setup.deadline", { deadline: w(n)(w(H).enrolment_deadline) ?? w(H).enrolment_deadline }),
						"data-testid": "guardian-setup-deadline"
					}, null, 8, ["title"])) : m("", !0),
					_(o, {
						client: w(B),
						status: w(H),
						setup: "",
						onConfirmed: q
					}, null, 8, ["client", "status"])
				]))]),
				_: 1
			});
		};
	}
});
export { I as default };
