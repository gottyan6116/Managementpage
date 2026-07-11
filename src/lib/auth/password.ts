import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function createPasswordHash(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

export function verifyConfiguredPassword(password: string, hashes: readonly string[]): boolean {
  return hashes.some((hash) => {
    const [, saltValue, keyValue, ...extra] = hash.split(":");
    if (!saltValue || !keyValue || extra.length > 0 || !hash.startsWith("scrypt:")) return false;
    try {
      const expected = Buffer.from(keyValue, "base64url");
      const actual = scryptSync(password, Buffer.from(saltValue, "base64url"), expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch { return false; }
  });
}
