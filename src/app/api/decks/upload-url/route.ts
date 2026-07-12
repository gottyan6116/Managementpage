import { NextRequest, NextResponse } from "next/server";
import {
  DECK_ALLOWED_MIME,
  DECK_MAX_SIZE_BYTES,
  DECKS_BUCKET,
  DECKS_PREFIX,
  getSupabaseAdmin,
  StorageNotConfiguredError,
} from "@/lib/storage/supabase-admin";

export const runtime = "nodejs";

/**
 * アップロード自体は Vercel のリクエストサイズ上限を避けるため、ここでは
 * 署名付きアップロード URL だけを発行する。実バイト列はブラウザから
 * Supabase Storage へ直接 PUT する (このサーバーは経由しない)。
 */
export async function POST(req: NextRequest) {
  let body: { fileName?: string; mimeType?: string; sizeBytes?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const { fileName, mimeType, sizeBytes } = body;
  if (!fileName || typeof fileName !== "string") {
    return NextResponse.json({ error: "ファイル名が必要です。" }, { status: 400 });
  }
  if (!mimeType || !DECK_ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { error: "PowerPoint ファイル (.pptx / .ppt) のみアップロードできます。" },
      { status: 400 },
    );
  }
  if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > DECK_MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `ファイルサイズは ${DECK_MAX_SIZE_BYTES / 1024 / 1024}MB 以下にしてください。` },
      { status: 400 },
    );
  }

  // パス衝突を避けるためタイムスタンプを付与しつつ元のファイル名を保持する
  const safeName = fileName.replace(/[/\\]/g, "_");
  const path = `${DECKS_PREFIX}${Date.now()}-${safeName}`;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(DECKS_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw error;

    return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json({ error: "アップロード URL の発行に失敗しました。" }, { status: 500 });
  }
}
