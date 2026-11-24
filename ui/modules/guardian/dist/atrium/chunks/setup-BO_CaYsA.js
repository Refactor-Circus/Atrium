import { t as e } from "./client-qaf8OSpi.js";
import { a as t, i as n, o as r, s as i } from "./guardian-Dugz84u2.js";
import { n as a, t as o } from "./GuardianTwoFactorMethods-D4zoorEf.js";
import { computed as s, createBlock as c, createCommentVNode as l, createElementBlock as u, createElementVNode as d, createVNode as f, defineComponent as p, onBeforeUnmount as m, openBlock as h, ref as g, shallowRef as _, toDisplayString as v, unref as y, withCtx as b } from "vue";
import { AtriumErrorCard as x, AtriumNoAccess as S, atriumStatus as C, useAtriumShellStore as w, useHead as T } from "@refactor-circus/atrium";
import { useRoute as E, useRouter as D } from "vue-router";
import { UAlert as O, UCard as k, USkeleton as A } from "@refactor-circus/atrium/ui";
import { useI18n as j } from "vue-i18n";
// src/pages/two-factor/setup.vue?vue&type=script&setup=true&lang.ts
var M = { class: "text-lg font-semibold" }, N = { class: "text-sm text-muted" }, P = {
	key: 4,
	class: "space-y-4"
}, F = {
	class: "text-sm",
	"data-testid": "guardian-setup-allowed"
}, I = /* @__PURE__ */ p({
	__name: "setup",
	setup(p) {
		let { t: I } = j(), L = E(), R = D(), z = w(), B = e();
		T({ title: () => I("guardian.two_factor.setup.title") });
		let V = g("loading"), H = _(null), U = g(null), W = s(() => i(H.value));
		async function G() {
			try {
				H.value = r(await B.GET("/two-factor")).data, V.value = "ready";
			} catch (e) {
				V.value = C(e) === 403 ? "forbidden" : "failed";
			}
		}
		async function K() {
			U.value = null, await z.load(!0), await R.replace(t(L.query.redirect));
		}
		async function q(e) {
			e && e.length > 0 ? U.value = e : await K();
		}
		return m(() => {
			U.value = null;
		}), G(), (e, t) => {
			let r = A, i = S, s = x, p = O, m = k;
			return h(), c(m, { "data-testid": "guardian-setup" }, {
				header: b(() => [d("h1", M, v(y(I)("guardian.two_factor.setup.title")), 1), d("p", N, v(y(I)("guardian.two_factor.setup.intro")), 1)]),
				default: b(() => [y(V) === "loading" ? (h(), c(r, {
					key: 0,
					class: "h-32",
					"data-testid": "guardian-setup-loading"
				})) : y(V) === "forbidden" ? (h(), c(i, { key: 1 })) : y(V) === "failed" || !y(H) ? (h(), c(s, {
					key: 2,
					message: y(I)("guardian.two_factor.setup.load_failed")
				}, null, 8, ["message"])) : y(U) ? (h(), c(a, {
					key: 3,
					codes: y(U),
					onDone: K
				}, null, 8, ["codes"])) : (h(), u("div", P, [
					d("p", F, v(y(I)("guardian.two_factor.setup.allowed", { methods: y(W).map((e) => y(I)(`guardian.two_factor.types.${e}`)).join(", ") })), 1),
					y(H).enrolment_deadline ? (h(), c(p, {
						key: 0,
						color: "warning",
						variant: "subtle",
						title: y(I)("guardian.two_factor.setup.deadline", { deadline: y(n)(y(H).enrolment_deadline) ?? y(H).enrolment_deadline }),
						"data-testid": "guardian-setup-deadline"
					}, null, 8, ["title"])) : l("", !0),
					f(o, {
						client: y(B),
						status: y(H),
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
