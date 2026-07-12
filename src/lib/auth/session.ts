/**
 * セッション Cookie の署名・検証。
 * Edge (middleware) と Node (route handler) の両方で動く Web Crypto (crypto.subtle) のみを使う。
 * パスワード本体・ハッシュはここでは扱わない (login route のみ)。
 */

export const SESSION_COOKIE_NAME = "pm_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30日

interface SessionPayload {
  iat: number; // issued-at (epoch seconds)
  exp: number; // expiry (epoch seconds)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** サーバー起動時に AUTH_SESSION_SECRET を検証する (未設定なら起動時に気付けるようにする) */
function requireSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SESSION_SECRET が未設定、または短すぎます。Vercel の環境変数で強力なランダム文字列を設定してください。",
    );
  }
  return secret;
}

/** ログイン成功時に発行する署名付きセッション値 (payload.signature 形式) */
export async function createSessionToken(): Promise<string> {
  const secret = requireSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { iat: now, exp: now + SESSION_MAX_AGE_SECONDS };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = base64UrlEncode(payloadBytes);

  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(signature));

  return `${payloadB64}.${sigB64}`;
}

/** Cookie 値を検証する。改ざん・期限切れ・シークレット未設定はすべて false */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  let secret: string;
  try {
    secret = requireSessionSecret();
  } catch {
    return false;
  }

  try {
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigB64).buffer as ArrayBuffer,
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64)),
    ) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp === "number" && payload.exp > now;
  } catch {
    // 破損した Cookie は認証エラーとして扱う (例外を上位へ漏らさない)
    return false;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
