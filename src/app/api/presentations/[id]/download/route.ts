import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth/guard";
import { downloadPresentation } from "@/lib/presentations/storage";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { if (!(await hasValidSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { return NextResponse.redirect(await downloadPresentation((await params).id)); } catch { return NextResponse.json({ error: "ダウンロードを開始できません。" }, { status: 404 }); } }
