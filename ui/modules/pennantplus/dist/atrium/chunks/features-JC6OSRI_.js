import { AtriumIntegrationError as e, AtriumIntegrationScreen as t, AtriumNoAccess as n, atriumStatus as r, useAtriumIntegration as i, useHead as a } from "@refactor-circus/atrium";
import { UAlert as o, UBadge as s, UButton as ee, UCard as c, UDashboardNavbar as l, UDashboardPanel as u, UFormField as te, UInput as ne, USkeleton as d } from "@refactor-circus/atrium/ui";
import { Fragment as f, computed as p, createBlock as m, createCommentVNode as h, createElementBlock as g, createElementVNode as _, createVNode as v, defineComponent as y, isRef as b, openBlock as x, reactive as S, ref as C, renderList as w, shallowRef as T, toDisplayString as E, unref as D, vModelSelect as re, watch as O, withCtx as k, withDirectives as A, withModifiers as ie } from "vue";
import { useDebounceFn as j } from "@vueuse/core";
import { useI18n as M } from "vue-i18n";
// src/components/pennantplus.ts
var N = "global";
function ae() {
	return i("pennantplus").client;
}
function P(t) {
	if (!t.response.ok) throw new e(t.response.status, t.error);
	return t.data;
}
function F(e) {
	return e;
}
function I() {
	let t = C({}), n = C(null), i = C(!1), a = C(!1);
	async function o(o) {
		a.value = !0, t.value = {}, n.value = null;
		try {
			return await o(), !0;
		} catch (a) {
			let o = r(a), s = a instanceof e ? a.body : null;
			return o === 403 ? i.value = !0 : o === 422 && s?.errors ? t.value = s.errors : n.value = typeof s?.message == "string" ? s.message : a instanceof Error ? a.message : String(a), !1;
		} finally {
			a.value = !1;
		}
	}
	function s(e) {
		return t.value[e]?.[0];
	}
	return {
		errors: t,
		message: n,
		forbidden: i,
		busy: a,
		run: o,
		error: s
	};
}
function L(e) {
	let t = JSON.stringify(e) ?? "null";
	return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}
// src/components/PennantPlusSetValue.vue?vue&type=script&setup=true&lang.ts
var R = { class: "font-medium" }, z = ["value"], B = { key: 0 }, V = {
	key: 0,
	class: "flex items-center justify-between gap-2 rounded-md border border-default px-3 py-1.5 text-sm"
}, oe = { "data-testid": "pennantplus-scope-picked" }, se = {
	key: 1,
	class: "relative"
}, ce = {
	key: 0,
	class: "absolute top-full z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-md border border-default bg-default p-1 text-sm shadow-lg"
}, H = ["onClick"], U = { class: "text-muted" }, W = {
	key: 0,
	class: "px-3 py-1.5 text-muted"
}, G = { class: "flex items-end sm:pt-6" }, le = {
	key: 0,
	class: "mt-3 text-sm text-error",
	role: "alert"
}, K = /* @__PURE__ */ y({
	__name: "PennantPlusSetValue",
	props: {
		scopeTypes: {},
		featureList: {}
	},
	emits: ["saved", "forbidden"],
	setup(e, { emit: t }) {
		let n = e, i = t, { t: a } = M(), o = ae(), s = I(), l = C(""), u = C(N), d = C(""), y = C(""), S = T([]), L = C(!1), K = T(null), q = C("true"), J = C(null), ue = p(() => n.scopeTypes.filter((e) => e.type === "global" || e.type === "other" || e.searchable)), Y = p(() => u.value !== "global" && u.value !== "other"), de = p(() => s.error("scope_type") ?? s.error("scope") ?? (u.value === "global" ? s.error("scope_id") : void 0));
		O(() => s.forbidden.value, (e) => {
			e && i("forbidden");
		});
		function X() {
			d.value = "", y.value = "", S.value = [], L.value = !1, K.value = null;
		}
		async function fe() {
			let e = y.value.trim();
			if (!o || e === "" || !Y.value) {
				S.value = [], L.value = !1;
				return;
			}
			let t = u.value;
			try {
				let n = P(await o.GET("/scopes/{type}/models", { params: {
					path: { type: t },
					query: {
						type: t,
						q: e
					}
				} }));
				S.value = n.data;
			} catch (e) {
				S.value = [], r(e) === 403 && i("forbidden");
			}
			L.value = !0;
		}
		let pe = j(fe, 250);
		function me(e) {
			K.value = e, S.value = [], L.value = !1;
		}
		async function he() {
			J.value = null;
			let e;
			try {
				e = JSON.parse(q.value);
			} catch {
				J.value = a("pennantplus.features.invalid_json");
				return;
			}
			let t = u.value === "other" ? d.value : Y.value ? K.value?.id : void 0;
			await s.run(async () => P(await o.PUT("/values", { body: {
				feature: l.value,
				scope_type: F(u.value),
				...t === void 0 ? {} : { scope_id: t },
				value: F(e)
			} }))) && (l.value = "", u.value = N, q.value = "true", X(), i("saved"));
		}
		return (t, n) => {
			let r = ne, i = te, o = ee, p = c;
			return x(), m(p, null, {
				header: k(() => [_("h3", R, E(D(a)("pennantplus.features.set_value")), 1)]),
				default: k(() => [_("form", {
					class: "grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-5",
					"data-testid": "pennantplus-set-value",
					onSubmit: ie(he, ["prevent"])
				}, [
					v(i, {
						label: D(a)("pennantplus.features.feature"),
						error: D(s).error("feature"),
						required: ""
					}, {
						default: k(() => [v(r, {
							modelValue: D(l),
							"onUpdate:modelValue": n[0] ||= (e) => b(l) ? l.value = e : null,
							list: e.featureList,
							autocomplete: "off",
							class: "w-full",
							"data-testid": "pennantplus-feature"
						}, null, 8, ["modelValue", "list"])]),
						_: 1
					}, 8, ["label", "error"]),
					v(i, {
						label: D(a)("pennantplus.features.scope"),
						error: D(de)
					}, {
						default: k(() => [A(_("select", {
							"onUpdate:modelValue": n[1] ||= (e) => b(u) ? u.value = e : null,
							class: "w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "pennantplus-scope-type",
							onChange: X
						}, [(x(!0), g(f, null, w(D(ue), (e) => (x(), g("option", {
							key: e.type,
							value: e.type
						}, E(e.label), 9, z))), 128))], 544), [[re, D(u)]])]),
						_: 1
					}, 8, ["label", "error"]),
					D(u) === D("global") ? (x(), g("div", B)) : D(u) === D("other") ? (x(), m(i, {
						key: 1,
						label: D(a)("pennantplus.features.scope_string"),
						error: D(s).error("scope_id")
					}, {
						default: k(() => [v(r, {
							modelValue: D(d),
							"onUpdate:modelValue": n[2] ||= (e) => b(d) ? d.value = e : null,
							class: "w-full",
							"data-testid": "pennantplus-scope-string"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label", "error"])) : (x(), m(i, {
						key: 2,
						label: D(a)("pennantplus.features.find_model"),
						error: D(s).error("scope_id")
					}, {
						default: k(() => [D(K) ? (x(), g("div", V, [_("span", oe, E(D(K).title) + " (#" + E(D(K).id) + ")", 1), v(o, {
							size: "xs",
							color: "neutral",
							variant: "ghost",
							label: D(a)("pennantplus.features.clear"),
							onClick: X
						}, null, 8, ["label"])])) : (x(), g("div", se, [v(r, {
							modelValue: D(y),
							"onUpdate:modelValue": [n[3] ||= (e) => b(y) ? y.value = e : null, D(pe)],
							autocomplete: "off",
							icon: "i-lucide-search",
							placeholder: D(a)("pennantplus.features.find_model_placeholder"),
							class: "w-full",
							"data-testid": "pennantplus-scope-search"
						}, null, 8, [
							"modelValue",
							"placeholder",
							"onUpdate:modelValue"
						]), D(L) ? (x(), g("ul", ce, [(x(!0), g(f, null, w(D(S), (e) => (x(), g("li", { key: e.id }, [_("button", {
							type: "button",
							class: "flex w-full cursor-pointer justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-elevated",
							"data-testid": "pennantplus-scope-result",
							onClick: (t) => me(e)
						}, [_("span", null, E(e.title), 1), _("span", U, "#" + E(e.id), 1)], 8, H)]))), 128)), D(S).length === 0 ? (x(), g("li", W, E(D(a)("pennantplus.features.no_models")), 1)) : h("", !0)])) : h("", !0)]))]),
						_: 1
					}, 8, ["label", "error"])),
					v(i, {
						label: D(a)("pennantplus.features.value"),
						hint: D(a)("pennantplus.features.value_hint"),
						error: D(J) ?? D(s).error("value"),
						required: ""
					}, {
						default: k(() => [v(r, {
							modelValue: D(q),
							"onUpdate:modelValue": n[4] ||= (e) => b(q) ? q.value = e : null,
							class: "w-full font-mono",
							"data-testid": "pennantplus-value-input"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, [
						"label",
						"hint",
						"error"
					]),
					_("div", G, [v(o, {
						type: "submit",
						icon: "i-lucide-check",
						label: D(a)("pennantplus.features.save"),
						loading: D(s).busy.value,
						"data-testid": "pennantplus-save"
					}, null, 8, ["label", "loading"])])
				], 32), D(s).message.value ? (x(), g("p", le, E(D(s).message.value), 1)) : h("", !0)]),
				_: 1
			});
		};
	}
}), q = {
	class: "flex flex-col gap-5",
	"data-testid": "pennantplus-features"
}, J = {
	key: 2,
	class: "flex items-center justify-between gap-3 rounded-md border border-default p-4 text-sm",
	role: "alert",
	"data-testid": "pennantplus-load-error"
}, ue = ["value"], Y = { value: "" }, de = ["value"], X = { class: "flex gap-2" }, fe = {
	key: 2,
	class: "atrium-empty",
	"data-testid": "pennantplus-no-values"
}, pe = {
	key: 3,
	class: "overflow-x-auto rounded-md border border-default"
}, me = {
	class: "w-full text-left text-sm",
	"data-testid": "pennantplus-values"
}, he = { class: "bg-elevated text-muted" }, ge = { class: "px-3 py-2 font-medium" }, _e = { class: "px-3 py-2 font-medium" }, ve = { class: "px-3 py-2 font-medium" }, ye = { class: "px-3 py-2 font-medium" }, be = { class: "px-3 py-2" }, xe = { class: "sr-only" }, Se = { class: "divide-y divide-default" }, Ce = { class: "px-3 py-2 font-medium" }, we = { class: "px-3 py-2" }, Te = ["title"], Ee = {
	key: 0,
	class: "block text-xs text-muted"
}, De = { class: "px-3 py-2" }, Oe = { class: "flex items-center gap-2" }, ke = {
	key: 0,
	class: "text-xs"
}, Ae = { class: "px-3 py-2 text-muted" }, je = { class: "px-3 py-2" }, Me = { class: "flex justify-end gap-2" }, Ne = {
	key: 4,
	class: "flex items-center justify-between gap-3 text-sm"
}, Pe = {
	class: "text-muted",
	"data-testid": "pennantplus-page"
}, Fe = { key: 5 }, Z = "pennantplus-feature-options", Q = /* @__PURE__ */ y({
	__name: "PennantPlusFeatureFlags",
	setup(e) {
		let { t, locale: i } = M(), a = ae(), c = I(), l = T([]), u = T([]), y = T([]), b = C(1), O = C(1), j = C(!1), N = C(!1), R = C(!1), z = C(null), B = S({
			feature: "",
			scope: "",
			scope_id: ""
		}), V = C({
			feature: "",
			scope: "",
			scope_id: ""
		}), oe = p(() => R.value || c.forbidden.value), se = p(() => new Intl.DateTimeFormat(i.value, {
			dateStyle: "medium",
			timeStyle: "short"
		}));
		function ce() {
			let { feature: e, scope: t, scope_id: n } = V.value;
			return {
				...e === "" ? {} : { feature: e },
				...t === "" ? {} : { scope: t },
				...n === "" ? {} : { scope_id: n },
				...b.value > 1 ? { page: b.value } : {}
			};
		}
		async function H(e) {
			let [t, n] = await Promise.all([e.GET("/features").then((e) => P(e)), e.GET("/scopes").then((e) => P(e))]);
			l.value = t.data, u.value = n.data;
		}
		async function U(e) {
			let t = P(await e.GET("/values", { params: { query: ce() } }));
			y.value = t.data, b.value = t.meta?.current_page ?? b.value, O.value = t.meta?.last_page ?? 1;
		}
		async function W(e = !1) {
			if (!a) j.value = !0;
			else try {
				await Promise.all([e ? null : H(a), U(a)]), N.value = !1;
			} catch (e) {
				R.value = r(e) === 403, N.value = !R.value;
			} finally {
				j.value = !0;
			}
		}
		async function G() {
			V.value = { ...B }, b.value = 1, await W(!0);
		}
		async function le() {
			Object.assign(B, {
				feature: "",
				scope: "",
				scope_id: ""
			}), await G();
		}
		async function Q(e) {
			b.value = e, await W(!0);
		}
		async function $(e, t, n = !0) {
			return z.value = null, !a || !await c.run(() => e(a)) ? !1 : (z.value = t, await W(n), !0);
		}
		async function Ie(e) {
			await $(async (t) => P(await t.PUT("/values", { body: {
				feature: e.feature,
				scope: e.scope,
				value: F(!e.active)
			} })), t("pennantplus.features.value_saved"));
		}
		async function Le(e) {
			window.confirm(t("pennantplus.features.forget_confirm")) && await $(async (t) => P(await t.DELETE("/values", { params: { query: {
				feature: e.feature,
				scope: e.scope
			} } })), t("pennantplus.features.value_forgotten"));
		}
		async function Re() {
			let e = V.value.feature;
			e !== "" && window.confirm(t("pennantplus.features.purge_confirm")) && await c.run(async () => P(await a.DELETE("/features/{feature}", { params: {
				path: { feature: e },
				query: { feature: e }
			} }))) && (B.feature = "", V.value = {
				...V.value,
				feature: ""
			}, b.value = 1, z.value = t("pennantplus.features.feature_purged"), await W());
		}
		async function ze() {
			z.value = t("pennantplus.features.value_saved"), await W();
		}
		function Be(e) {
			return e === null ? "" : se.value.format(new Date(e));
		}
		return W(), (e, r) => {
			let i = n, a = d, p = ee, S = o, C = ne, T = te, M = s;
			return x(), g("div", q, [D(oe) ? (x(), m(i, { key: 0 })) : D(j) ? D(N) ? (x(), g("div", J, [_("span", null, E(D(t)("pennantplus.features.load_failed")), 1), v(p, {
				size: "sm",
				variant: "outline",
				icon: "i-lucide-refresh-cw",
				label: D(t)("pennantplus.features.retry"),
				onClick: r[0] ||= (e) => W()
			}, null, 8, ["label"])])) : (x(), g(f, { key: 3 }, [
				_("datalist", {
					id: Z,
					"data-testid": Z
				}, [(x(!0), g(f, null, w(D(l), (e) => (x(), g("option", {
					key: e.name,
					value: e.name
				}, null, 8, ue))), 128))]),
				D(z) ? (x(), m(S, {
					key: 0,
					color: "success",
					variant: "subtle",
					icon: "i-lucide-check",
					title: D(z),
					"data-testid": "pennantplus-status"
				}, null, 8, ["title"])) : h("", !0),
				D(c).message.value ? (x(), m(S, {
					key: 1,
					color: "error",
					variant: "subtle",
					icon: "i-lucide-circle-alert",
					title: D(c).message.value
				}, null, 8, ["title"])) : h("", !0),
				v(K, {
					"scope-types": D(u),
					"feature-list": Z,
					onSaved: ze,
					onForbidden: r[1] ||= (e) => D(c).forbidden.value = !0
				}, null, 8, ["scope-types"]),
				_("form", {
					class: "grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4",
					"data-testid": "pennantplus-filters",
					onSubmit: ie(G, ["prevent"])
				}, [
					v(T, { label: D(t)("pennantplus.features.feature") }, {
						default: k(() => [v(C, {
							modelValue: D(B).feature,
							"onUpdate:modelValue": r[2] ||= (e) => D(B).feature = e,
							list: Z,
							placeholder: D(t)("pennantplus.features.all_features"),
							autocomplete: "off",
							class: "w-full",
							"data-testid": "pennantplus-filter-feature"
						}, null, 8, ["modelValue", "placeholder"])]),
						_: 1
					}, 8, ["label"]),
					v(T, { label: D(t)("pennantplus.features.scope") }, {
						default: k(() => [A(_("select", {
							"onUpdate:modelValue": r[3] ||= (e) => D(B).scope = e,
							class: "w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm",
							"data-testid": "pennantplus-filter-scope"
						}, [_("option", Y, E(D(t)("pennantplus.features.all_scopes")), 1), (x(!0), g(f, null, w(D(u), (e) => (x(), g("option", {
							key: e.type,
							value: e.type
						}, E(e.label), 9, de))), 128))], 512), [[re, D(B).scope]])]),
						_: 1
					}, 8, ["label"]),
					v(T, { label: D(t)("pennantplus.features.scope_id") }, {
						default: k(() => [v(C, {
							modelValue: D(B).scope_id,
							"onUpdate:modelValue": r[4] ||= (e) => D(B).scope_id = e,
							class: "w-full",
							"data-testid": "pennantplus-filter-scope-id"
						}, null, 8, ["modelValue"])]),
						_: 1
					}, 8, ["label"]),
					_("div", X, [v(p, {
						type: "submit",
						variant: "outline",
						icon: "i-lucide-funnel",
						label: D(t)("pennantplus.features.filter"),
						"data-testid": "pennantplus-filter"
					}, null, 8, ["label"]), v(p, {
						color: "neutral",
						variant: "ghost",
						icon: "i-lucide-x",
						label: D(t)("pennantplus.features.reset"),
						"data-testid": "pennantplus-reset",
						onClick: le
					}, null, 8, ["label"])])
				], 32),
				D(y).length === 0 ? (x(), g("p", fe, E(D(t)("pennantplus.features.no_values")), 1)) : (x(), g("div", pe, [_("table", me, [_("thead", he, [_("tr", null, [
					_("th", ge, E(D(t)("pennantplus.features.feature")), 1),
					_("th", _e, E(D(t)("pennantplus.features.scope")), 1),
					_("th", ve, E(D(t)("pennantplus.features.value")), 1),
					_("th", ye, E(D(t)("pennantplus.features.updated")), 1),
					_("th", be, [_("span", xe, E(D(t)("pennantplus.features.actions")), 1)])
				])]), _("tbody", Se, [(x(!0), g(f, null, w(D(y), (e) => (x(), g("tr", {
					key: `${e.feature}|${e.scope}`,
					"data-testid": "pennantplus-value"
				}, [
					_("td", Ce, E(e.feature), 1),
					_("td", we, [_("span", { title: e.scope }, E(e.scope_label), 9, Te), e.title ? (x(), g("span", Ee, E(e.title), 1)) : h("", !0)]),
					_("td", De, [_("div", Oe, [v(M, {
						color: e.active ? "success" : "neutral",
						variant: "subtle",
						label: e.active ? D(t)("pennantplus.features.active") : D(t)("pennantplus.features.inactive"),
						"data-status": e.active ? "active" : "inactive",
						"data-testid": "pennantplus-value-status"
					}, null, 8, [
						"color",
						"label",
						"data-status"
					]), typeof e.value == "boolean" ? h("", !0) : (x(), g("code", ke, E(D(L)(e.value)), 1))])]),
					_("td", Ae, E(Be(e.updated_at)), 1),
					_("td", je, [_("div", Me, [v(p, {
						size: "xs",
						variant: "outline",
						icon: e.active ? "i-lucide-ban" : "i-lucide-circle-check",
						label: e.active ? D(t)("pennantplus.features.deactivate") : D(t)("pennantplus.features.activate"),
						loading: D(c).busy.value,
						"data-testid": "pennantplus-toggle",
						onClick: (t) => Ie(e)
					}, null, 8, [
						"icon",
						"label",
						"loading",
						"onClick"
					]), v(p, {
						size: "xs",
						color: "neutral",
						variant: "ghost",
						icon: "i-lucide-x",
						label: D(t)("pennantplus.features.forget"),
						"data-testid": "pennantplus-forget",
						onClick: (t) => Le(e)
					}, null, 8, ["label", "onClick"])])])
				]))), 128))])])])),
				D(O) > 1 ? (x(), g("div", Ne, [
					v(p, {
						size: "sm",
						color: "neutral",
						variant: "outline",
						icon: "i-lucide-chevron-left",
						label: D(t)("pennantplus.features.previous"),
						disabled: D(b) <= 1,
						"data-testid": "pennantplus-prev",
						onClick: r[5] ||= (e) => Q(D(b) - 1)
					}, null, 8, ["label", "disabled"]),
					_("span", Pe, E(D(t)("pennantplus.features.page", {
						page: D(b),
						pages: D(O)
					})), 1),
					v(p, {
						size: "sm",
						color: "neutral",
						variant: "outline",
						"trailing-icon": "i-lucide-chevron-right",
						label: D(t)("pennantplus.features.next"),
						disabled: D(b) >= D(O),
						"data-testid": "pennantplus-next",
						onClick: r[6] ||= (e) => Q(D(b) + 1)
					}, null, 8, ["label", "disabled"])
				])) : h("", !0),
				D(V).feature === "" ? h("", !0) : (x(), g("div", Fe, [v(p, {
					color: "error",
					variant: "outline",
					size: "sm",
					icon: "i-lucide-trash",
					label: D(t)("pennantplus.features.purge", { feature: D(V).feature }),
					loading: D(c).busy.value,
					"data-testid": "pennantplus-purge",
					onClick: Re
				}, null, 8, ["label", "loading"])]))
			], 64)) : (x(), m(a, {
				key: 1,
				class: "h-32"
			}))]);
		};
	}
}), $ = { class: "mb-4 text-sm text-muted" }, Ie = /* @__PURE__ */ y({
	__name: "features",
	setup(e) {
		let { t: n } = M();
		return a({ title: () => n("pennantplus.features.title") }), (e, r) => {
			let i = l, a = t, o = u;
			return x(), m(o, null, {
				header: k(() => [v(i, { title: D(n)("pennantplus.features.title") }, null, 8, ["title"])]),
				body: k(() => [_("p", $, E(D(n)("pennantplus.features.description")), 1), v(a, { "screen-key": "pennantplus.features" }, {
					default: k(() => [v(Q)]),
					_: 1
				})]),
				_: 1
			});
		};
	}
});
export { Ie as default };
