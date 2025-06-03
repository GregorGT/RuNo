// utils/obfuscate.ts
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { ENCRYPTION_KEY, MINGLE_KEY } from "./consts";
import { AES, enc } from 'crypto-js';

export const mingle = (buffer: Uint8Array): Uint8Array => {
  const key = new TextEncoder().encode(MINGLE_KEY);
  return buffer.map((b, i) => b ^ key[i % key.length]);
};

export const unmingle = (buffer: Uint8Array): Uint8Array => mingle(buffer);

export const zipString = (str: string): Uint8Array => {
  const fileData = strToU8(str);
  const zipped = zipSync(
    {
      "data.json": fileData,
    },
    {
      level: 6,
      mem: 8,
    }
  );

  return zipped;
};

export const unzipToString = (buffer: Uint8Array): string => {
  const files = unzipSync(buffer);
  return strFromU8(files["data.json"]);
};

export const uint8ToBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
export const base64ToUint8 = (base64: string): Uint8Array => new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0)));

export const encryptData = (data: string): string => AES.encrypt(data, ENCRYPTION_KEY).toString();
export const decryptData = (ciphertext: string): string => {
  const bytes = AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(enc.Utf8);
}