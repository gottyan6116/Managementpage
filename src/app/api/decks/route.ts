import { NextRequest, NextResponse } from "next/server";
import {
  DECKS_BUCKET,
  DECKS_PREFIX,
  getSupabaseAdmin,
  StorageNotConfiguredError,
} from "@/lib/storage/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(DECKS_BUCKET)
      .list(DECKS_PREFIX.replace(/\/$/, ""), {
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) throw error;

    const files = (data ?? [])
      .filter((f) => f.id) // フォルダのプレースホルダを除外
      .map((f) => ({
        name: f.name,
        path: `${DECKS_PREFIX}${f.name}`,
        sizeBytes: f.metadata?.size ?? 0,
        uploadedAt: f.created_at ?? f.updated_at ?? null,
      }));
    return NextResponse.json({ files });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json({ error: "一覧の取得に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path || !path.startsWith(DECKS_PREFIX)) {
      return NextResponse.json({ error: "不正なパスです。" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(DECKS_BUCKET).remove([path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
}
