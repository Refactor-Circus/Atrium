import { AtriumIntegrationError as e } from "@refactor-circus/atrium";
// src/components/entries.ts
var t = [
	"source",
	"action",
	"subject_type",
	"subject_id",
	"actor_type",
	"actor_id",
	"since",
	"until"
];
function n(e) {
	let n = {};
	for (let r of [...t, "cursor"]) {
		let t = e[r];
		typeof t == "string" && t !== "" && (n[r] = t);
	}
	return n;
}
function r(e) {
	return e == null ? "NULL" : typeof e == "string" ? `'${e.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'` : typeof e == "number" || typeof e == "boolean" ? String(e) : JSON.stringify(e);
}
function i(e) {
	return Object.entries(e ?? {}).map(([e, t]) => {
		let [n, i] = Array.isArray(t) ? t : [null, t];
		return {
			field: e,
			before: r(n),
			after: r(i)
		};
	});
}
function a(t) {
	if (!(t instanceof e) || t.status !== 422) return {};
	let n = t.body?.errors;
	return typeof n == "object" && n ? n : {};
}
export { a as i, i as n, n as r, t };
