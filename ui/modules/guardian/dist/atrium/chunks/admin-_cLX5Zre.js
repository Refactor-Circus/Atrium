// src/components/admin/admin.ts
var e = [
	"login.succeeded",
	"login.failed",
	"login.locked_out",
	"login.suspicious",
	"logout",
	"password.reset",
	"password.changed",
	"password.breach_check_unavailable",
	"two_factor.enabled",
	"two_factor.disabled",
	"two_factor.challenge_passed",
	"two_factor.challenge_failed",
	"two_factor.recovery_code_used",
	"two_factor.recovery_codes_regenerated",
	"two_factor.policy_conflict",
	"passkey.sign_count_mismatch",
	"session.revoked",
	"device.new",
	"token.issued",
	"token.revoked",
	"ip.denied",
	"lockout.cleared"
], t = "login.locked_out", n = [
	"totp",
	"email",
	"sms",
	"passkey"
];
function r(e) {
	return e?.mode === "allowlist" ? "allowlist" : "denylist";
}
function i(e) {
	return `/guardian/security-events/${encodeURIComponent(e)}`;
}
function a(e) {
	return s(e, "00:00:00.000");
}
function o(e) {
	return s(e, "23:59:59.999");
}
function s(e, t) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(e)) return null;
	let n = /* @__PURE__ */ new Date(`${e}T${t}`);
	return Number.isNaN(n.getTime()) ? null : n.toISOString();
}
function c(e) {
	return typeof e == "string" ? e : e === void 0 ? "" : JSON.stringify(e);
}
export { o as a, a as c, c as i, n, i as o, e as r, r as s, t };
