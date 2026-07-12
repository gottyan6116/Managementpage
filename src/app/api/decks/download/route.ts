import { NextRequest, NextResponse } from "next/server";
import {
  DECKS_BUCKET,
  DECKS_PREFIX,
  getSupabaseAdmin,
  StorageNotConfiguredError,
} from "@/lib/storage/supabase-admin";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60;

/** 短命の署名付きダウンロード URL を発行してリダイレクトする */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith(DECKS_PREFIX)) {
    return NextResponse.json({ error: "不正なパスです。" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const fileName = path.slice(DECKS_PREFIX.length).replace(/^\d+-/, "");
    const { data, error } = await supabase.storage
      .from(DECKS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, { download: fileName });
    if (error) throw error;

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json({ error: "ダウンロード URL の発行に失敗しました。" }, { status: 500 });
  }
}
