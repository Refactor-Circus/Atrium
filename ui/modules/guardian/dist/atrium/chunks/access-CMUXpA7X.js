import { o as e } from "./guardian-D9MeowUD.js";
import { shallowRef as t } from "vue";
// src/components/access/access.ts
var n = ["global", "any"];
function r(e) {
	let t = e?.scope_types;
	return Array.isArray(t) ? t.filter((e) => typeof e?.key == "string" && typeof e?.type == "string" && e.type !== "") : [];
}
function i(e) {
	return `/guardian/roles/${encodeURIComponent(e)}`;
}
function a(e) {
	return `/guardian/users/${encodeURIComponent(String(e))}`;
}
function o(e, t) {
	return e ? t.find((t) => t.type === e)?.key ?? e : null;
}
function s(e) {
	return Object.values(e.errors.value).flat();
}
function c(e) {
	let t = (e ?? "").trim();
	return t === "" ? null : t;
}
function l(e) {
	return {
		current: e?.meta?.current_page ?? 1,
		last: e?.meta?.last_page ?? 1
	};
}
function u(n) {
	let r = t([]);
	return n && n.GET("/permissions", { params: { query: { per_page: 200 } } }).then((t) => r.value = e(t).data).catch(() => r.value = []), r;
}
function d(n) {
	let r = t([]);
	return n && n.GET("/roles", { params: { query: { per_page: 100 } } }).then((t) => r.value = e(t).data).catch(() => r.value = []), r;
}
export { i as a, u as c, l as i, d as l, c as n, o, s as r, r as s, n as t, a as u };
