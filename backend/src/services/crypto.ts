import { createCipheriv, createHash, createHmac, randomBytes } from "node:crypto";

import { env } from "../config/env.js";

const encryptionKey = createHash("sha256").update(env.DATA_ENCRYPTION_KEY).digest();

function encryptSensitiveValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function hashSensitiveValue(value: string) {
  return createHmac("sha256", encryptionKey).update(value).digest("hex");
}

export { encryptSensitiveValue, hashSensitiveValue };
