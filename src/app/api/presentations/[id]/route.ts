import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth/guard";
import { deletePresentation } from "@/lib/presentations/storage";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { if (!(await hasValidSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { await deletePresentation((await params).id); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 }); } }
