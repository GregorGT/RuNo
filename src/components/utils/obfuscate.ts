// utils/obfuscate.ts
const MINGLE_KEY = "RuNo2025!";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

export function mingle(buffer: Uint8Array): Uint8Array {
  const key = new TextEncoder().encode(MINGLE_KEY);
  return buffer.map((b, i) => b ^ key[i % key.length]);
}

export function unmingle(buffer: Uint8Array): Uint8Array {
  // XOR is its own inverse
  return mingle(buffer);
}

export function zipString(str: string): Uint8Array {
  const fileData = strToU8(str);
  const zipped = zipSync({
    "data.json": fileData
  }, {
    level: 6,
    mem: 8
  });

  return zipped
}

export function unzipToString(buffer: Uint8Array): string {
  const files = unzipSync(buffer);
  return strFromU8(files["data.json"]);
}

export function uint8ToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
export function base64ToUint8(base64: string): Uint8Array {
  return new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
}