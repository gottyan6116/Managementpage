/**
 * PPT 資料保管用の Supabase Storage クライアント (サーバー専用)。
 *
 * SUPABASE_SERVICE_ROLE_KEY はここでしか読まず、Route Handler (Node runtime) から
 * のみ import する。クライアントバンドルに一切含めない。バケットは private のまま
 * (匿名/anon キーでは一切アクセスできない) にし、ダウンロード/アップロードは
 * 都度発行する署名付き URL 経由に限定する。実アクセス制御は本アプリの
 * middleware (セッション Cookie 必須) が担う。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DECKS_BUCKET = "presentations";
export const DECKS_PREFIX = "decks/";

// PowerPoint 形式のみ許可 (拡張子ではなく MIME で判定)
export const DECK_ALLOWED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
]);
export const DECK_MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase Storage が未設定です。NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。",
    );
    this.name = "StorageNotConfiguredError";
  }
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new StorageNotConfiguredError();

  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
