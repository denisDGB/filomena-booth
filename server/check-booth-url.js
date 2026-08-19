/**
 * ponytail: el sha1 debe coincidir con PHP json_encode + sha1($jsonStr . $password).
 */
import { boothJsonString, signBoothJson, buildBoothUrl } from "./booth-url.js";

const expiry = 1710000000;
const jsonStr = boothJsonString({
  autoemail: "noreply@filomena.studio",
  expiry,
});
const expectedJson =
  '{"c1":"activarPhotobooth","autoemail":"noreply@filomena.studio","expiry":1710000000}';
console.assert(jsonStr === expectedJson, jsonStr);

const auth = signBoothJson(jsonStr, "secret");
console.assert(/^[a-f0-9]{40}$/.test(auth), auth);

const url = buildBoothUrl(jsonStr, "secret");
console.assert(url.startsWith("https://thefilomenabooth.pe?auth="), url);
console.assert(url.includes("&j="), url);
console.assert(url.includes(encodeURIComponent(jsonStr)), url);

const again = boothJsonString({ autoemail: "noreply@filomena.studio", expiry });
console.assert(again === jsonStr, "stable json");
console.assert(signBoothJson(jsonStr, "secret") === auth, "stable sha1");

console.log("check-booth-url: ok");
console.log("  json:", jsonStr);
console.log("  sha1(secret):", auth);
