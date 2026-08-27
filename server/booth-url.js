import { createHash } from "node:crypto";

const BOOTH_ORIGIN = "https://thefilomenabooth.pe";
const DEFAULT_EMAIL = "noreply@filomena.studio";
const EXPIRES_SEC = 605000; // ~7 días, igual que el PHP de Gera

/**
 * JSON byte-a-byte como json_encode() de PHP (sin espacios, orden de claves fijo).
 * Si cambia el orden o un espacio, el sha1 no coincide y la cabina ignora el QR.
 */
export function boothJsonString({ autoemail = DEFAULT_EMAIL, expiry }) {
  const email = String(autoemail || DEFAULT_EMAIL);
  const exp = Number(expiry);
  if (!Number.isFinite(exp)) throw new Error("expiry required");
  return `{"c1":"profile6","autoemail":${JSON.stringify(email)},"expiry":${Math.floor(exp)}}`;
}

export function signBoothJson(jsonStr, password) {
  return createHash("sha1")
    .update(String(jsonStr) + String(password ?? ""), "utf8")
    .digest("hex");
}

export function buildBoothUrl(jsonStr, password) {
  const auth = signBoothJson(jsonStr, password);
  return `${BOOTH_ORIGIN}?auth=${auth}&j=${encodeURIComponent(jsonStr)}`;
}

export function issueBoothUrl(password, { autoemail, nowSec } = {}) {
  const expiry = Math.floor(nowSec ?? Date.now() / 1000) + EXPIRES_SEC;
  const jsonStr = boothJsonString({ autoemail, expiry });
  const url = buildBoothUrl(jsonStr, password);
  return { url, jsonStr, expiry };
}

export { BOOTH_ORIGIN, DEFAULT_EMAIL, EXPIRES_SEC };
