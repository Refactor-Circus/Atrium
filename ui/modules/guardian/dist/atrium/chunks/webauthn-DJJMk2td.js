// src/components/two-factor/webauthn.ts
function e() {
	return typeof window < "u" && window.PublicKeyCredential !== void 0 && typeof navigator < "u" && typeof navigator.credentials?.create == "function";
}
function t(e) {
	let t = e.replace(/-/g, "+").replace(/_/g, "/"), n = t + "=".repeat((4 - t.length % 4) % 4), r = atob(n), i = new Uint8Array(r.length);
	for (let e = 0; e < r.length; e++) i[e] = r.charCodeAt(e);
	return i.buffer;
}
function n(e) {
	let t = e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength), n = "";
	for (let e of t) n += String.fromCharCode(e);
	return btoa(n).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function r(e) {
	if (Array.isArray(e)) return e.map((e) => ({
		...e,
		id: t(String(e.id))
	}));
}
function i() {
	return typeof window < "u" && window.PublicKeyCredential !== void 0 ? window.PublicKeyCredential : null;
}
function a(e) {
	let n = i()?.parseCreationOptionsFromJSON;
	if (n) return n(e);
	let a = e.user;
	return {
		...e,
		challenge: t(String(e.challenge)),
		user: {
			...a,
			id: t(String(a.id))
		},
		excludeCredentials: r(e.excludeCredentials)
	};
}
function o(e) {
	let n = i()?.parseRequestOptionsFromJSON;
	return n ? n(e) : {
		...e,
		challenge: t(String(e.challenge)),
		allowCredentials: r(e.allowCredentials)
	};
}
function s(e) {
	let t = e;
	if (typeof t.toJSON == "function") return t.toJSON();
	let r = e.response, i = { clientDataJSON: n(r.clientDataJSON) };
	return r.attestationObject && (i.attestationObject = n(r.attestationObject), i.transports = r.getTransports?.() ?? []), r.authenticatorData && (i.authenticatorData = n(r.authenticatorData)), r.signature && (i.signature = n(r.signature)), r.userHandle && (i.userHandle = n(r.userHandle)), {
		id: e.id,
		rawId: n(e.rawId),
		type: e.type,
		authenticatorAttachment: e.authenticatorAttachment ?? null,
		clientExtensionResults: e.getClientExtensionResults?.() ?? {},
		response: i
	};
}
async function c(e) {
	let t = await navigator.credentials.create({ publicKey: a(e) });
	if (!t) throw Error("No passkey was created.");
	return s(t);
}
async function l(e) {
	let t = await navigator.credentials.get({ publicKey: o(e) });
	if (!t) throw Error("No passkey was used.");
	return s(t);
}
export { l as n, e as r, c as t };
