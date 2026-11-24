import { t as e } from "./GuardianActionError-DiiAaIHC.js";
import { c as t, i as n, o as r, r as i, s as a, u as o } from "./guardian-Dugz84u2.js";
import { r as s, t as c } from "./webauthn-DJJMk2td.js";
import { Fragment as l, computed as u, createBlock as d, createCommentVNode as f, createElementBlock as p, createElementVNode as m, createTextVNode as h, createVNode as g, defineComponent as _, isRef as v, onBeforeUnmount as y, openBlock as b, ref as x, renderList as S, shallowRef as C, toDisplayString as w, unref as T, vModelSelect as E, watch as D, withCtx as O, withDirectives as k, withModifiers as A } from "vue";
import { atriumStatus as j } from "@refactor-circus/atrium";
import { UAlert as M, UButton as N, UCard as P, UFormField as F, UInput as I } from "@refactor-circus/atrium/ui";
import { useI18n as L } from "vue-i18n";
// src/components/two-factor/GuardianFactorRemoval.vue?vue&type=script&setup=true&lang.ts
var R = ["data-testid"], z = /* @__PURE__ */ _({
	__name: "GuardianFactorRemoval",
	props: {
		client: {},
		kind: {},
		id: {},
		name: {}
	},
	emits: ["removed"],
	setup(n, { emit: i }) {
		let a = n, s = i, { t: c } = L(), l = o(), f = x(!1), m = x(""), _ = u(() => l.code.value === "two_factor_required");
		function y(e) {
			f.value = e;
		}
		async function S() {
			let e = t({ code: m.value.trim() }), n = await l.run(async () => {
				r(a.kind === "method" ? await a.client.DELETE("/two-factor/methods/{method}", {
					params: { path: { method: a.id } },
					body: e
				}) : await a.client.DELETE("/two-factor/passkeys/{passkey}", {
					params: { path: { passkey: a.id } },
					body: e
				}));
			});
			m.value = "", n && (f.value = !1, s("removed"));
		}
		return (t, r) => {
			let i = N, a = I, o = F, s = M;
			return b(), p("div", { "data-testid": `guardian-remove-${n.id}` }, [T(f) ? (b(), p("form", {
				key: 1,
				class: "flex flex-wrap items-end gap-2",
				"data-testid": "guardian-remove-form",
				onSubmit: A(S, ["prevent"])
			}, [
				g(o, {
					label: T(c)("guardian.two_factor.remove.proof", { name: n.name }),
					hint: T(c)("guardian.two_factor.remove.proof_hint"),
					error: T(l).error("code"),
					required: ""
				}, {
					default: O(() => [g(a, {
						modelValue: T(m),
						"onUpdate:modelValue": r[1] ||= (e) => v(m) ? m.value = e : null,
						autocomplete: "one-time-code",
						"data-testid": "guardian-remove-code"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, [
					"label",
					"hint",
					"error"
				]),
				g(i, {
					type: "submit",
					color: "error",
					loading: T(l).busy.value,
					"data-testid": "guardian-remove-submit"
				}, {
					default: O(() => [h(w(T(c)("guardian.two_factor.remove.confirm")), 1)]),
					_: 1
				}, 8, ["loading"]),
				g(i, {
					color: "neutral",
					variant: "ghost",
					onClick: r[2] ||= (e) => y(!1)
				}, {
					default: O(() => [h(w(T(c)("guardian.two_factor.cancel")), 1)]),
					_: 1
				})
			], 32)) : (b(), d(i, {
				key: 0,
				size: "xs",
				color: "error",
				variant: "ghost",
				icon: "i-lucide-trash-2",
				"data-testid": "guardian-remove-open",
				onClick: r[0] ||= (e) => y(!0)
			}, {
				default: O(() => [h(w(T(c)("guardian.two_factor.remove.button")), 1)]),
				_: 1
			})), T(_) ? (b(), d(s, {
				key: 2,
				color: "warning",
				variant: "subtle",
				title: T(c)("guardian.two_factor.remove.required"),
				description: T(l).message.value ?? void 0,
				"data-testid": "guardian-remove-required"
			}, null, 8, ["title", "description"])) : (b(), d(e, {
				key: 3,
				action: T(l)
			}, null, 8, ["action"]))], 8, R);
		};
	}
}), B = {
	class: "space-y-3",
	"data-testid": "guardian-one-time"
}, ee = { class: "font-medium" }, V = ["value"], H = /* @__PURE__ */ _({
	__name: "GuardianOneTimeCodes",
	props: {
		client: {},
		types: {}
	},
	emits: ["confirmed"],
	setup(t, { emit: n }) {
		let i = t, a = n, { t: s } = L(), c = o(), _ = o(), y = x([]), C = x(null), j = x(""), P = x(!1), R = x(""), z = x(null), H = u(() => i.types.filter((e) => !y.value.includes(e)));
		D(H, (e) => {
			C.value !== null && e.includes(C.value) || (C.value = e[0] ?? null);
		}, { immediate: !0 });
		async function te() {
			let e = C.value;
			e && (z.value = null, await c.run(async () => {
				r(await i.client.POST("/two-factor/one-time-codes", { body: {
					type: e,
					destination: j.value.trim()
				} }));
			}) ? P.value = !0 : c.code.value === "method_unavailable" && (y.value = [...y.value, e], z.value = s("guardian.two_factor.one_time.unavailable", { type: s(`guardian.two_factor.types.${e}`) }), P.value = !1));
		}
		async function ne() {
			let e = C.value;
			if (!e) return;
			let t = null, n = await _.run(async () => {
				t = r(await i.client.POST("/two-factor/one-time-codes/confirm", { body: {
					type: e,
					code: R.value.trim()
				} })).data.recovery_codes ?? null;
			});
			R.value = "", n && (P.value = !1, j.value = "", a("confirmed", t));
		}
		return (t, n) => {
			let r = M, i = F, a = I, o = N;
			return b(), p("div", B, [
				m("h3", ee, w(T(s)("guardian.two_factor.one_time.title")), 1),
				T(z) ? (b(), d(r, {
					key: 0,
					color: "neutral",
					variant: "subtle",
					title: T(z),
					"data-testid": "guardian-one-time-unavailable"
				}, null, 8, ["title"])) : f("", !0),
				T(H).length > 0 ? (b(), p(l, { key: 1 }, [
					m("form", {
						class: "flex flex-wrap items-end gap-2",
						"data-testid": "guardian-one-time-send",
						onSubmit: A(te, ["prevent"])
					}, [
						g(i, { label: T(s)("guardian.two_factor.fields.type") }, {
							default: O(() => [k(m("select", {
								"onUpdate:modelValue": n[0] ||= (e) => v(C) ? C.value = e : null,
								class: "rounded border border-default bg-default px-2 py-1.5 text-sm",
								"data-testid": "guardian-one-time-type"
							}, [(b(!0), p(l, null, S(T(H), (e) => (b(), p("option", {
								key: e,
								value: e
							}, w(T(s)(`guardian.two_factor.types.${e}`)), 9, V))), 128))], 512), [[E, T(C)]])]),
							_: 1
						}, 8, ["label"]),
						g(i, {
							label: T(s)(T(C) === "sms" ? "guardian.two_factor.fields.phone" : "guardian.two_factor.fields.email"),
							error: T(c).error("destination"),
							required: ""
						}, {
							default: O(() => [g(a, {
								modelValue: T(j),
								"onUpdate:modelValue": n[1] ||= (e) => v(j) ? j.value = e : null,
								type: T(C) === "sms" ? "tel" : "email",
								"data-testid": "guardian-one-time-destination"
							}, null, 8, ["modelValue", "type"])]),
							_: 1
						}, 8, ["label", "error"]),
						g(o, {
							type: "submit",
							loading: T(c).busy.value,
							"data-testid": "guardian-one-time-submit-send"
						}, {
							default: O(() => [h(w(T(P) ? T(s)("guardian.two_factor.one_time.resend") : T(s)("guardian.two_factor.one_time.send")), 1)]),
							_: 1
						}, 8, ["loading"])
					], 32),
					T(c).code.value === "method_unavailable" ? f("", !0) : (b(), d(e, {
						key: 0,
						action: T(c)
					}, null, 8, ["action"])),
					T(P) ? (b(), p("form", {
						key: 1,
						class: "flex flex-wrap items-end gap-2",
						"data-testid": "guardian-one-time-confirm",
						onSubmit: A(ne, ["prevent"])
					}, [g(i, {
						label: T(s)("guardian.two_factor.fields.code"),
						hint: T(s)("guardian.two_factor.one_time.sent"),
						error: T(_).error("code"),
						required: ""
					}, {
						default: O(() => [g(a, {
							modelValue: T(R),
							"onUpdate:modelValue": n[2] ||= (e) => v(R) ? R.value = e : null,
							autocomplete: "one-time-code",
							inputmode: "numeric",
							"data-testid": "guardian-one-time-code"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, [
						"label",
						"hint",
						"error"
					]), g(o, {
						type: "submit",
						loading: T(_).busy.value,
						"data-testid": "guardian-one-time-submit"
					}, {
						default: O(() => [h(w(T(s)("guardian.two_factor.confirm")), 1)]),
						_: 1
					}, 8, ["loading"])], 32)) : f("", !0),
					g(e, { action: T(_) }, null, 8, ["action"])
				], 64)) : f("", !0)
			]);
		};
	}
}), te = {
	class: "space-y-3",
	"data-testid": "guardian-passkeys"
}, ne = { class: "font-medium" }, re = {
	key: 0,
	class: "divide-y divide-default text-sm"
}, ie = ["data-testid"], ae = { class: "text-muted" }, oe = {
	key: 0,
	class: "py-2 text-muted"
}, se = /* @__PURE__ */ _({
	__name: "GuardianPasskeys",
	props: {
		client: {},
		available: { type: Boolean },
		manage: {
			type: Boolean,
			default: !0
		}
	},
	emits: ["confirmed", "changed"],
	setup(i, { emit: a }) {
		let _ = i, y = a, { t: E } = L(), D = o(), k = C([]), P = x(!1), R = x(""), B = s(), ee = u(() => !_.available || P.value || !B);
		async function V() {
			if (_.manage && _.available && B) try {
				k.value = r(await _.client.GET("/two-factor/passkeys")).data;
			} catch (e) {
				P.value = j(e) === 501, k.value = [];
			}
		}
		async function H() {
			let e = null, n = await D.run(async () => {
				let n = r(await _.client.POST("/two-factor/passkeys/options")).data, i = await c(n);
				e = r(await _.client.POST("/two-factor/passkeys", { body: t({
					credential: i,
					label: R.value.trim() || null
				}) })).data.recovery_codes ?? null;
			});
			D.status.value === 501 && (P.value = !0), n && (R.value = "", await V(), y("confirmed", e));
		}
		async function se() {
			await V(), y("changed");
		}
		return V(), (t, r) => {
			let a = M, o = I, s = F, c = N;
			return b(), p("div", te, [m("h3", ne, w(T(E)("guardian.two_factor.passkeys.title")), 1), T(ee) ? (b(), d(a, {
				key: 0,
				color: "neutral",
				variant: "subtle",
				title: T(E)("guardian.two_factor.passkeys.unavailable"),
				"data-testid": "guardian-passkeys-unavailable"
			}, null, 8, ["title"])) : (b(), p(l, { key: 1 }, [
				i.manage ? (b(), p("ul", re, [(b(!0), p(l, null, S(T(k), (e) => (b(), p("li", {
					key: e.id,
					class: "flex flex-wrap items-center justify-between gap-2 py-2",
					"data-testid": `guardian-passkey-${e.id}`
				}, [m("span", null, [h(w(e.label ?? T(E)("guardian.two_factor.passkeys.unnamed")) + " ", 1), m("span", ae, w(T(n)(e.last_used_at) ?? T(E)("guardian.two_factor.never_used")), 1)]), g(z, {
					client: i.client,
					kind: "passkey",
					id: e.id,
					name: e.label ?? T(E)("guardian.two_factor.passkeys.unnamed"),
					onRemoved: se
				}, null, 8, [
					"client",
					"id",
					"name"
				])], 8, ie))), 128)), T(k).length === 0 ? (b(), p("li", oe, w(T(E)("guardian.two_factor.passkeys.none")), 1)) : f("", !0)])) : f("", !0),
				g(e, { action: T(D) }, null, 8, ["action"]),
				m("form", {
					class: "flex flex-wrap items-end gap-2",
					"data-testid": "guardian-passkey-register",
					onSubmit: A(H, ["prevent"])
				}, [g(s, {
					label: T(E)("guardian.two_factor.fields.label"),
					error: T(D).error("label")
				}, {
					default: O(() => [g(o, {
						modelValue: T(R),
						"onUpdate:modelValue": r[0] ||= (e) => v(R) ? R.value = e : null,
						"data-testid": "guardian-passkey-label"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label", "error"]), g(c, {
					type: "submit",
					icon: "i-lucide-key-round",
					loading: T(D).busy.value,
					"data-testid": "guardian-passkey-submit"
				}, {
					default: O(() => [h(w(T(E)("guardian.two_factor.passkeys.add")), 1)]),
					_: 1
				}, 8, ["loading"])], 32)
			], 64))]);
		};
	}
}), ce = { class: "font-medium" }, le = { class: "mb-3 text-sm text-muted" }, ue = { class: "mb-3 grid grid-cols-2 gap-1 font-mono text-sm" }, de = { class: "flex flex-wrap gap-2" }, fe = /* @__PURE__ */ _({
	__name: "GuardianRecoveryCodes",
	props: { codes: {} },
	emits: ["done"],
	setup(e, { emit: t }) {
		let n = e, r = t, { t: i } = L(), a = x(!1), o = u(() => `${n.codes.join("\n")}\n`);
		async function s() {
			await navigator.clipboard?.writeText(o.value), a.value = !0;
		}
		function c() {
			let e = URL.createObjectURL(new Blob([o.value], { type: "text/plain" })), t = document.createElement("a");
			t.href = e, t.download = "recovery-codes.txt", t.click(), URL.revokeObjectURL(e);
		}
		return (t, n) => {
			let o = N, u = P;
			return b(), d(u, { "data-testid": "guardian-recovery-codes" }, {
				header: O(() => [m("h3", ce, w(T(i)("guardian.two_factor.recovery.title")), 1)]),
				default: O(() => [
					m("p", le, w(T(i)("guardian.two_factor.recovery.once")), 1),
					m("ul", ue, [(b(!0), p(l, null, S(e.codes, (e) => (b(), p("li", {
						key: e,
						"data-testid": "guardian-recovery-code"
					}, w(e), 1))), 128))]),
					m("div", de, [
						g(o, {
							icon: "i-lucide-copy",
							color: "neutral",
							variant: "soft",
							"data-testid": "guardian-recovery-copy",
							onClick: s
						}, {
							default: O(() => [h(w(T(a) ? T(i)("guardian.two_factor.recovery.copied") : T(i)("guardian.two_factor.recovery.copy")), 1)]),
							_: 1
						}),
						g(o, {
							icon: "i-lucide-download",
							color: "neutral",
							variant: "soft",
							"data-testid": "guardian-recovery-download",
							onClick: c
						}, {
							default: O(() => [h(w(T(i)("guardian.two_factor.recovery.download")), 1)]),
							_: 1
						}),
						g(o, {
							"data-testid": "guardian-recovery-done",
							onClick: n[0] ||= (e) => r("done")
						}, {
							default: O(() => [h(w(T(i)("guardian.two_factor.recovery.done")), 1)]),
							_: 1
						})
					])
				]),
				_: 1
			});
		};
	}
}), U = /* @__PURE__ */ ((e) => (e[e.Border = -1] = "Border", e[e.Data = 0] = "Data", e[e.Function = 1] = "Function", e[e.Position = 2] = "Position", e[e.Timing = 3] = "Timing", e[e.Alignment = 4] = "Alignment", e))(U || {}), pe = [0, 1], me = [1, 0], he = [2, 3], ge = [3, 2], _e = {
	L: pe,
	M: me,
	Q: he,
	H: ge
}, ve = /^\d*$/, ye = /^[A-Z0-9 $%*+./:-]*$/, W = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:", G = 1, K = 40, be = 3, xe = 3, q = 40, Se = 10, Ce = [
	[
		-1,
		7,
		10,
		15,
		20,
		26,
		18,
		20,
		24,
		30,
		18,
		20,
		24,
		26,
		30,
		22,
		24,
		28,
		30,
		28,
		28,
		28,
		28,
		30,
		30,
		26,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		10,
		16,
		26,
		18,
		24,
		16,
		18,
		22,
		22,
		26,
		30,
		22,
		22,
		24,
		24,
		28,
		28,
		26,
		26,
		26,
		26,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28,
		28
	],
	[
		-1,
		13,
		22,
		18,
		26,
		18,
		24,
		18,
		22,
		20,
		24,
		28,
		26,
		24,
		20,
		30,
		24,
		28,
		28,
		26,
		30,
		28,
		30,
		30,
		30,
		30,
		28,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	],
	[
		-1,
		17,
		28,
		22,
		16,
		22,
		28,
		26,
		26,
		24,
		28,
		24,
		28,
		22,
		24,
		24,
		30,
		28,
		28,
		26,
		28,
		30,
		24,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30,
		30
	]
], we = [
	[
		-1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		4,
		4,
		4,
		4,
		4,
		6,
		6,
		6,
		6,
		7,
		8,
		8,
		9,
		9,
		10,
		12,
		12,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		19,
		20,
		21,
		22,
		24,
		25
	],
	[
		-1,
		1,
		1,
		1,
		2,
		2,
		4,
		4,
		4,
		5,
		5,
		5,
		8,
		9,
		9,
		10,
		10,
		11,
		13,
		14,
		16,
		17,
		17,
		18,
		20,
		21,
		23,
		25,
		26,
		28,
		29,
		31,
		33,
		35,
		37,
		38,
		40,
		43,
		45,
		47,
		49
	],
	[
		-1,
		1,
		1,
		2,
		2,
		4,
		4,
		6,
		6,
		8,
		8,
		8,
		10,
		12,
		16,
		12,
		17,
		16,
		18,
		21,
		20,
		23,
		23,
		25,
		27,
		29,
		34,
		34,
		35,
		38,
		40,
		43,
		45,
		48,
		51,
		53,
		56,
		59,
		62,
		65,
		68
	],
	[
		-1,
		1,
		1,
		2,
		4,
		4,
		4,
		5,
		6,
		8,
		8,
		11,
		11,
		16,
		16,
		18,
		16,
		19,
		21,
		25,
		25,
		25,
		34,
		30,
		32,
		35,
		37,
		40,
		42,
		45,
		48,
		51,
		54,
		57,
		60,
		63,
		66,
		70,
		74,
		77,
		81
	]
], Te = class {
	constructor(e, t, n, r) {
		if (this.version = e, this.ecc = t, e < G || e > K) throw RangeError("Version value out of range");
		if (r < -1 || r > 7) throw RangeError("Mask value out of range");
		this.size = e * 4 + 17;
		let i = Array.from({ length: this.size }).fill(!1);
		for (let e = 0; e < this.size; e++) this.modules.push(i.slice()), this.types.push(i.map(() => 0));
		this.drawFunctionPatterns();
		let a = this.addEccAndInterleave(n);
		if (this.drawCodewords(a), r === -1) {
			let e = 1e9;
			for (let t = 0; t < 8; t++) {
				this.applyMask(t), this.drawFormatBits(t);
				let n = this.getPenaltyScore();
				n < e && (r = t, e = n), this.applyMask(t);
			}
		}
		this.mask = r, this.applyMask(r), this.drawFormatBits(r);
	}
	size;
	mask;
	modules = [];
	types = [];
	getModule(e, t) {
		return e >= 0 && e < this.size && t >= 0 && t < this.size && this.modules[t][e];
	}
	drawFunctionPatterns() {
		for (let e = 0; e < this.size; e++) this.setFunctionModule(6, e, e % 2 == 0, U.Timing), this.setFunctionModule(e, 6, e % 2 == 0, U.Timing);
		this.drawFinderPattern(3, 3), this.drawFinderPattern(this.size - 4, 3), this.drawFinderPattern(3, this.size - 4);
		let e = this.getAlignmentPatternPositions(), t = e.length;
		for (let n = 0; n < t; n++) for (let r = 0; r < t; r++) n === 0 && r === 0 || n === 0 && r === t - 1 || n === t - 1 && r === 0 || this.drawAlignmentPattern(e[n], e[r]);
		this.drawFormatBits(0), this.drawVersion();
	}
	drawFormatBits(e) {
		let t = this.ecc[1] << 3 | e, n = t;
		for (let e = 0; e < 10; e++) n = n << 1 ^ (n >>> 9) * 1335;
		let r = (t << 10 | n) ^ 21522;
		for (let e = 0; e <= 5; e++) this.setFunctionModule(8, e, Y(r, e));
		this.setFunctionModule(8, 7, Y(r, 6)), this.setFunctionModule(8, 8, Y(r, 7)), this.setFunctionModule(7, 8, Y(r, 8));
		for (let e = 9; e < 15; e++) this.setFunctionModule(14 - e, 8, Y(r, e));
		for (let e = 0; e < 8; e++) this.setFunctionModule(this.size - 1 - e, 8, Y(r, e));
		for (let e = 8; e < 15; e++) this.setFunctionModule(8, this.size - 15 + e, Y(r, e));
		this.setFunctionModule(8, this.size - 8, !0);
	}
	drawVersion() {
		if (this.version < 7) return;
		let e = this.version;
		for (let t = 0; t < 12; t++) e = e << 1 ^ (e >>> 11) * 7973;
		let t = this.version << 12 | e;
		for (let e = 0; e < 18; e++) {
			let n = Y(t, e), r = this.size - 11 + e % 3, i = Math.floor(e / 3);
			this.setFunctionModule(r, i, n), this.setFunctionModule(i, r, n);
		}
	}
	drawFinderPattern(e, t) {
		for (let n = -4; n <= 4; n++) for (let r = -4; r <= 4; r++) {
			let i = Math.max(Math.abs(r), Math.abs(n)), a = e + r, o = t + n;
			a >= 0 && a < this.size && o >= 0 && o < this.size && this.setFunctionModule(a, o, i !== 2 && i !== 4, U.Position);
		}
	}
	drawAlignmentPattern(e, t) {
		for (let n = -2; n <= 2; n++) for (let r = -2; r <= 2; r++) this.setFunctionModule(e + r, t + n, Math.max(Math.abs(r), Math.abs(n)) !== 1, U.Alignment);
	}
	setFunctionModule(e, t, n, r = U.Function) {
		this.modules[t][e] = n, this.types[t][e] = r;
	}
	addEccAndInterleave(e) {
		let t = this.version, n = this.ecc;
		if (e.length !== Q(t, n)) throw RangeError("Invalid argument");
		let r = we[n[0]][t], i = Ce[n[0]][t], a = Math.floor(Z(t) / 8), o = r - a % r, s = Math.floor(a / r), c = [], l = Re(i);
		for (let t = 0, n = 0; t < r; t++) {
			let r = e.slice(n, n + s - i + (t < o ? 0 : 1));
			n += r.length;
			let a = ze(r, l);
			t < o && r.push(0), c.push(r.concat(a));
		}
		let u = [];
		for (let e = 0; e < c[0].length; e++) c.forEach((t, n) => {
			(e !== s - i || n >= o) && u.push(t[e]);
		});
		return u;
	}
	drawCodewords(e) {
		if (e.length !== Math.floor(Z(this.version) / 8)) throw RangeError("Invalid argument");
		let t = 0;
		for (let n = this.size - 1; n >= 1; n -= 2) {
			n === 6 && (n = 5);
			for (let r = 0; r < this.size; r++) for (let i = 0; i < 2; i++) {
				let a = n - i, o = n + 1 & 2 ? r : this.size - 1 - r;
				!this.types[o][a] && t < e.length * 8 && (this.modules[o][a] = Y(e[t >>> 3], 7 - (t & 7)), t++);
			}
		}
	}
	applyMask(e) {
		if (e < 0 || e > 7) throw RangeError("Mask value out of range");
		for (let t = 0; t < this.size; t++) for (let n = 0; n < this.size; n++) {
			let r;
			switch (e) {
				case 0:
					r = (n + t) % 2 == 0;
					break;
				case 1:
					r = t % 2 == 0;
					break;
				case 2:
					r = n % 3 == 0;
					break;
				case 3:
					r = (n + t) % 3 == 0;
					break;
				case 4:
					r = (Math.floor(n / 3) + Math.floor(t / 2)) % 2 == 0;
					break;
				case 5:
					r = n * t % 2 + n * t % 3 == 0;
					break;
				case 6:
					r = (n * t % 2 + n * t % 3) % 2 == 0;
					break;
				case 7:
					r = ((n + t) % 2 + n * t % 3) % 2 == 0;
					break;
				default: throw Error("Unreachable");
			}
			!this.types[t][n] && r && (this.modules[t][n] = !this.modules[t][n]);
		}
	}
	getPenaltyScore() {
		let e = 0;
		for (let t = 0; t < this.size; t++) {
			let n = !1, r = 0, i = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let a = 0; a < this.size; a++) this.modules[t][a] === n ? (r++, r === 5 ? e += be : r > 5 && e++) : (this.finderPenaltyAddHistory(r, i), n || (e += this.finderPenaltyCountPatterns(i) * q), n = this.modules[t][a], r = 1);
			e += this.finderPenaltyTerminateAndCount(n, r, i) * q;
		}
		for (let t = 0; t < this.size; t++) {
			let n = !1, r = 0, i = [
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (let a = 0; a < this.size; a++) this.modules[a][t] === n ? (r++, r === 5 ? e += be : r > 5 && e++) : (this.finderPenaltyAddHistory(r, i), n || (e += this.finderPenaltyCountPatterns(i) * q), n = this.modules[a][t], r = 1);
			e += this.finderPenaltyTerminateAndCount(n, r, i) * q;
		}
		for (let t = 0; t < this.size - 1; t++) for (let n = 0; n < this.size - 1; n++) {
			let r = this.modules[t][n];
			r === this.modules[t][n + 1] && r === this.modules[t + 1][n] && r === this.modules[t + 1][n + 1] && (e += xe);
		}
		let t = 0;
		for (let e of this.modules) t = e.reduce((e, t) => e + +!!t, t);
		let n = this.size * this.size, r = Math.ceil(Math.abs(t * 20 - n * 10) / n) - 1;
		return e += r * Se, e;
	}
	getAlignmentPatternPositions() {
		if (this.version === 1) return [];
		{
			let e = Math.floor(this.version / 7) + 2, t = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (e * 2 - 2)) * 2, n = [6];
			for (let r = this.size - 7; n.length < e; r -= t) n.splice(1, 0, r);
			return n;
		}
	}
	finderPenaltyCountPatterns(e) {
		let t = e[1], n = t > 0 && e[2] === t && e[3] === t * 3 && e[4] === t && e[5] === t;
		return (n && e[0] >= t * 4 && e[6] >= t ? 1 : 0) + (n && e[6] >= t * 4 && e[0] >= t ? 1 : 0);
	}
	finderPenaltyTerminateAndCount(e, t, n) {
		return e && (this.finderPenaltyAddHistory(t, n), t = 0), t += this.size, this.finderPenaltyAddHistory(t, n), this.finderPenaltyCountPatterns(n);
	}
	finderPenaltyAddHistory(e, t) {
		t[0] === 0 && (e += this.size), t.pop(), t.unshift(e);
	}
};
function J(e, t, n) {
	if (t < 0 || t > 31 || e >>> t) throw RangeError("Value out of range");
	for (let r = t - 1; r >= 0; r--) n.push(e >>> r & 1);
}
function Y(e, t) {
	return !!(e >>> t & 1);
}
var X = class {
	constructor(e, t, n) {
		if (this.mode = e, this.numChars = t, this.bitData = n, t < 0) throw RangeError("Invalid argument");
		this.bitData = n.slice();
	}
	getData() {
		return this.bitData.slice();
	}
}, Ee = [
	1,
	10,
	12,
	14
], De = [
	2,
	9,
	11,
	13
], Oe = [
	4,
	8,
	16,
	16
];
function ke(e, t) {
	return e[Math.floor((t + 7) / 17) + 1];
}
function Ae(e) {
	let t = [];
	for (let n of e) J(n, 8, t);
	return new X(Oe, e.length, t);
}
function je(e) {
	if (!Pe(e)) throw RangeError("String contains non-numeric characters");
	let t = [];
	for (let n = 0; n < e.length;) {
		let r = Math.min(e.length - n, 3);
		J(Number.parseInt(e.substring(n, n + r), 10), r * 3 + 1, t), n += r;
	}
	return new X(Ee, e.length, t);
}
function Me(e) {
	if (!Fe(e)) throw RangeError("String contains unencodable characters in alphanumeric mode");
	let t = [], n = 0;
	for (; n + 2 <= e.length; n += 2) {
		let r = W.indexOf(e.charAt(n)) * 45;
		r += W.indexOf(e.charAt(n + 1)), J(r, 11, t);
	}
	return n < e.length && J(W.indexOf(e.charAt(n)), 6, t), new X(De, e.length, t);
}
function Ne(e) {
	return e === "" ? [] : Pe(e) ? [je(e)] : Fe(e) ? [Me(e)] : [Ae(Le(e))];
}
function Pe(e) {
	return ve.test(e);
}
function Fe(e) {
	return ye.test(e);
}
function Ie(e, t) {
	let n = 0;
	for (let r of e) {
		let e = ke(r.mode, t);
		if (r.numChars >= 1 << e) return Infinity;
		n += 4 + e + r.bitData.length;
	}
	return n;
}
function Le(e) {
	e = encodeURI(e);
	let t = [];
	for (let n = 0; n < e.length; n++) e.charAt(n) === "%" ? (t.push(Number.parseInt(e.substring(n + 1, n + 3), 16)), n += 2) : t.push(e.charCodeAt(n));
	return t;
}
function Z(e) {
	if (e < G || e > K) throw RangeError("Version number out of range");
	let t = (16 * e + 128) * e + 64;
	if (e >= 2) {
		let n = Math.floor(e / 7) + 2;
		t -= (25 * n - 10) * n - 55, e >= 7 && (t -= 36);
	}
	return t;
}
function Q(e, t) {
	return Math.floor(Z(e) / 8) - Ce[t[0]][e] * we[t[0]][e];
}
function Re(e) {
	if (e < 1 || e > 255) throw RangeError("Degree out of range");
	let t = [];
	for (let n = 0; n < e - 1; n++) t.push(0);
	t.push(1);
	let n = 1;
	for (let r = 0; r < e; r++) {
		for (let e = 0; e < t.length; e++) t[e] = $(t[e], n), e + 1 < t.length && (t[e] ^= t[e + 1]);
		n = $(n, 2);
	}
	return t;
}
function ze(e, t) {
	let n = t.map((e) => 0);
	for (let r of e) {
		let e = r ^ n.shift();
		n.push(0), t.forEach((t, r) => n[r] ^= $(t, e));
	}
	return n;
}
function $(e, t) {
	if (e >>> 8 || t >>> 8) throw RangeError("Byte out of range");
	let n = 0;
	for (let r = 7; r >= 0; r--) n = n << 1 ^ (n >>> 7) * 285, n ^= (t >>> r & 1) * e;
	return n;
}
function Be(e, t, n = 1, r = 40, i = -1, a = !0) {
	if (!(G <= n && n <= r && r <= K) || i < -1 || i > 7) throw RangeError("Invalid value");
	let o, s;
	for (o = n;; o++) {
		let n = Q(o, t) * 8, i = Ie(e, o);
		if (i <= n) {
			s = i;
			break;
		}
		if (o >= r) throw RangeError("Data too long");
	}
	for (let e of [
		me,
		he,
		ge
	]) a && s <= Q(o, e) * 8 && (t = e);
	let c = [];
	for (let t of e) {
		J(t.mode[0], 4, c), J(t.numChars, ke(t.mode, o), c);
		for (let e of t.getData()) c.push(e);
	}
	let l = Q(o, t) * 8;
	J(0, Math.min(4, l - c.length), c), J(0, (8 - c.length % 8) % 8, c);
	for (let e = 236; c.length < l; e ^= 253) J(e, 8, c);
	let u = Array.from({ length: Math.ceil(c.length / 8) }, () => 0);
	return c.forEach((e, t) => u[t >>> 3] |= e << 7 - (t & 7)), new Te(o, t, u, i);
}
function Ve(e, t) {
	let { ecc: n = "L", boostEcc: r = !1, minVersion: i = 1, maxVersion: a = 40, maskPattern: o = -1, border: s = 1 } = t || {}, c = typeof e == "string" ? Ne(e) : Array.isArray(e) ? [Ae(e)] : void 0;
	if (!c) throw Error(`uqr only supports encoding string and binary data, but got: ${typeof e}`);
	let l = Be(c, _e[n], i, a, o, r), u = He({
		version: l.version,
		maskPattern: l.mask,
		size: l.size,
		data: l.modules,
		types: l.types
	}, s);
	return t?.invert && (u.data = u.data.map((e) => e.map((e) => !e))), t?.onEncoded?.(u), u;
}
function He(e, t = 1) {
	if (!t) return e;
	let { size: n } = e, r = n + t * 2;
	e.size = r, e.data.forEach((e) => {
		for (let n = 0; n < t; n++) e.unshift(!1), e.push(!1);
	});
	for (let n = 0; n < t; n++) e.data.unshift(Array.from({ length: r }, (e) => !1)), e.data.push(Array.from({ length: r }, (e) => !1));
	let i = U.Border;
	e.types.forEach((e) => {
		for (let n = 0; n < t; n++) e.unshift(i), e.push(i);
	});
	for (let n = 0; n < t; n++) e.types.unshift(Array.from({ length: r }, (e) => i)), e.types.push(Array.from({ length: r }, (e) => i));
	return e;
}
function Ue(e) {
	return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function We(e, t = {}) {
	let n = Ve(e, t), { pixelSize: r = 10, whiteColor: i = "white", blackColor: a = "black" } = t, o = n.size * r, s = n.size * r, c = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${o}">`, l = [];
	for (let e = 0; e < n.size; e++) for (let t = 0; t < n.size; t++) {
		let i = t * r, a = e * r;
		n.data[e][t] && l.push(`M${i},${a}h${r}v${r}h-${r}z`);
	}
	return c += `<rect fill="${Ue(i)}" width="${s}" height="${o}"/>`, c += `<path fill="${Ue(a)}" d="${l.join("")}"/>`, c += "</svg>", c;
}
// src/components/two-factor/GuardianQrCode.vue?vue&type=script&setup=true&lang.ts
var Ge = ["aria-label", "innerHTML"], Ke = /* @__PURE__ */ _({
	__name: "GuardianQrCode",
	props: {
		value: {},
		label: {}
	},
	setup(e) {
		let t = e, n = u(() => We(t.value, { border: 2 }));
		return (t, r) => (b(), p("div", {
			class: "size-48 rounded bg-white p-1",
			role: "img",
			"aria-label": e.label,
			"data-testid": "guardian-qr",
			innerHTML: T(n)
		}, null, 8, Ge));
	}
}), qe = {
	class: "space-y-3",
	"data-testid": "guardian-totp"
}, Je = { class: "font-medium" }, Ye = {
	key: 1,
	class: "space-y-3"
}, Xe = { class: "text-sm text-muted" }, Ze = { class: "text-sm" }, Qe = {
	class: "break-all font-mono",
	"data-testid": "guardian-totp-secret"
}, $e = /* @__PURE__ */ _({
	__name: "GuardianTotpEnrol",
	props: { client: {} },
	emits: ["confirmed"],
	setup(t, { emit: n }) {
		let i = t, a = n, { t: s } = L(), c = o(), l = o(), u = x(""), d = x(""), f = x(null), _ = x(null);
		function S() {
			f.value = null, _.value = null, d.value = "";
		}
		async function C() {
			await c.run(async () => {
				let e = r(await i.client.POST("/two-factor/totp", { body: { label: u.value.trim() || null } })).data;
				f.value = e.secret, _.value = e.otpauth_uri;
			});
		}
		async function E() {
			let e = null, t = await l.run(async () => {
				e = r(await i.client.POST("/two-factor/totp/confirm", { body: { code: d.value.trim() } })).data.recovery_codes ?? null;
			});
			d.value = "", t && (S(), a("confirmed", e));
		}
		return y(S), (t, n) => {
			let r = I, i = F, a = N;
			return b(), p("div", qe, [
				m("h3", Je, w(T(s)("guardian.two_factor.totp.title")), 1),
				g(e, { action: T(c) }, null, 8, ["action"]),
				T(_) ? (b(), p("div", Ye, [
					m("p", Xe, w(T(s)("guardian.two_factor.totp.scan")), 1),
					g(Ke, {
						value: T(_),
						label: T(s)("guardian.two_factor.totp.qr_label")
					}, null, 8, ["value", "label"]),
					m("p", Ze, [h(w(T(s)("guardian.two_factor.totp.manual")) + " ", 1), m("code", Qe, w(T(f)), 1)]),
					g(e, { action: T(l) }, null, 8, ["action"]),
					m("form", {
						class: "flex flex-wrap items-end gap-2",
						"data-testid": "guardian-totp-confirm",
						onSubmit: A(E, ["prevent"])
					}, [g(i, {
						label: T(s)("guardian.two_factor.fields.code"),
						error: T(l).error("code"),
						required: ""
					}, {
						default: O(() => [g(r, {
							modelValue: T(d),
							"onUpdate:modelValue": n[1] ||= (e) => v(d) ? d.value = e : null,
							autocomplete: "one-time-code",
							inputmode: "numeric",
							"data-testid": "guardian-totp-code"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"]), g(a, {
						type: "submit",
						loading: T(l).busy.value,
						"data-testid": "guardian-totp-submit"
					}, {
						default: O(() => [h(w(T(s)("guardian.two_factor.confirm")), 1)]),
						_: 1
					}, 8, ["loading"])], 32)
				])) : (b(), p("form", {
					key: 0,
					class: "flex flex-wrap items-end gap-2",
					"data-testid": "guardian-totp-start",
					onSubmit: A(C, ["prevent"])
				}, [g(i, {
					label: T(s)("guardian.two_factor.fields.label"),
					error: T(c).error("label")
				}, {
					default: O(() => [g(r, {
						modelValue: T(u),
						"onUpdate:modelValue": n[0] ||= (e) => v(u) ? u.value = e : null,
						"data-testid": "guardian-totp-label"
					}, null, 8, ["modelValue"])]),
					_: 1
				}, 8, ["label", "error"]), g(a, {
					type: "submit",
					loading: T(c).busy.value,
					"data-testid": "guardian-totp-begin"
				}, {
					default: O(() => [h(w(T(s)("guardian.two_factor.totp.begin")), 1)]),
					_: 1
				}, 8, ["loading"])], 32))
			]);
		};
	}
}), et = {
	class: "space-y-4",
	"data-testid": "guardian-two-factor-methods"
}, tt = {
	key: 1,
	class: "space-y-2"
}, nt = { class: "font-medium" }, rt = { class: "divide-y divide-default text-sm" }, it = ["data-testid"], at = { class: "text-muted" }, ot = {
	key: 0,
	class: "py-2 text-muted"
}, st = {
	key: 5,
	class: "space-y-2",
	"data-testid": "guardian-recovery"
}, ct = { class: "font-medium" }, lt = {
	class: "text-sm",
	"data-testid": "guardian-recovery-remaining"
}, ut = /* @__PURE__ */ _({
	__name: "GuardianTwoFactorMethods",
	props: {
		client: {},
		status: {},
		setup: {
			type: Boolean,
			default: !1
		}
	},
	emits: ["changed", "confirmed"],
	setup(t, { emit: s }) {
		let c = t, _ = s, { t: v } = L(), C = o(), E = x(null), D = u(() => a(c.status)), k = u(() => D.value.filter((e) => e === "email" || e === "sms")), A = u(() => i(c.status));
		function j(e) {
			c.setup ? _("confirmed", e) : (E.value = e && e.length > 0 ? e : null, _("changed"));
		}
		async function M() {
			window.confirm(v("guardian.two_factor.recovery.confirm_regenerate")) && (await C.run(async () => {
				E.value = r(await c.client.POST("/two-factor/recovery-codes")).data.recovery_codes;
			}), _("changed"));
		}
		return y(() => {
			E.value = null;
		}), (r, i) => {
			let a = N;
			return b(), p("div", et, [
				T(E) ? (b(), d(fe, {
					key: 0,
					codes: T(E),
					onDone: i[0] ||= (e) => E.value = null
				}, null, 8, ["codes"])) : f("", !0),
				t.setup ? f("", !0) : (b(), p("section", tt, [m("h3", nt, w(T(v)("guardian.two_factor.methods.title")), 1), m("ul", rt, [(b(!0), p(l, null, S(T(A), (e) => (b(), p("li", {
					key: e.id,
					class: "flex flex-wrap items-center justify-between gap-2 py-2",
					"data-testid": `guardian-method-${e.id}`
				}, [m("span", null, [
					m("strong", null, w(T(v)(`guardian.two_factor.types.${e.type}`)), 1),
					h(" " + w(e.label ?? e.destination ?? "") + " ", 1),
					m("span", at, w(T(n)(e.last_used_at) ?? T(v)("guardian.two_factor.never_used")), 1)
				]), g(z, {
					client: t.client,
					kind: "method",
					id: e.id,
					name: T(v)(`guardian.two_factor.types.${e.type}`),
					onRemoved: i[1] ||= (e) => _("changed")
				}, null, 8, [
					"client",
					"id",
					"name"
				])], 8, it))), 128)), T(A).length === 0 ? (b(), p("li", ot, w(T(v)("guardian.two_factor.methods.none")), 1)) : f("", !0)])])),
				T(D).includes("totp") ? (b(), d($e, {
					key: 2,
					client: t.client,
					onConfirmed: j
				}, null, 8, ["client"])) : f("", !0),
				T(k).length > 0 ? (b(), d(H, {
					key: 3,
					client: t.client,
					types: T(k),
					onConfirmed: j
				}, null, 8, ["client", "types"])) : f("", !0),
				T(D).includes("passkey") ? (b(), d(se, {
					key: 4,
					client: t.client,
					available: t.status.passkeys_available,
					manage: !t.setup,
					onConfirmed: j,
					onChanged: i[2] ||= (e) => _("changed")
				}, null, 8, [
					"client",
					"available",
					"manage"
				])) : f("", !0),
				!t.setup && t.status.enabled ? (b(), p("section", st, [
					m("h3", ct, w(T(v)("guardian.two_factor.recovery.title")), 1),
					m("p", lt, w(T(v)("guardian.two_factor.recovery.remaining", { count: t.status.recovery_codes_remaining })), 1),
					g(e, { action: T(C) }, null, 8, ["action"]),
					g(a, {
						color: "neutral",
						variant: "soft",
						icon: "i-lucide-refresh-cw",
						loading: T(C).busy.value,
						"data-testid": "guardian-recovery-regenerate",
						onClick: M
					}, {
						default: O(() => [h(w(T(v)("guardian.two_factor.recovery.regenerate")), 1)]),
						_: 1
					}, 8, ["loading"])
				])) : f("", !0)
			]);
		};
	}
});
export { fe as n, ut as t };
