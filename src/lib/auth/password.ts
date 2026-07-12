/**
 * パスワード検証。Node ランタイムの route handler でのみ import する
 * (scrypt は Edge runtime では使えないため、middleware からは呼ばない)。
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LEN = 64;

/** ハッシュ生成 (Vercel 環境変数へ設定する値を作るための一回限りのユーティリティ) */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

/** `salt:hash` 形式の格納値とプレーンテキストを比較する (タイミング攻撃耐性あり) */
export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, SCRYPT_KEY_LEN);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/**
 * 同一サーバーインスタンス内のみで有効な簡易レート制限。
 * サーバーレス環境では複数インスタンス間で共有されないため、これは多層防御の一つに過ぎない
 * (本質的な防御は scrypt の計算コスト + 高エントロピーなパスワードそのもの)。
 * 分散環境で確実に効かせたい場合は Vercel KV / Upstash 等の外部ストアが必要。
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
