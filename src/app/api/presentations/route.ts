import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth/guard";
import { listPresentations, uploadPresentation } from "@/lib/presentations/storage";
import { validatePresentationUpload } from "@/lib/presentations/validation";
export async function GET() { if (!(await hasValidSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { return NextResponse.json(await listPresentations()); } catch { return NextResponse.json({ error: "資料を取得できません。" }, { status: 500 }); } }
export async function POST(request: Request) { if (!(await hasValidSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "ファイルを選択してください。" }, { status: 400 }); const validation = await validatePresentationUpload(file); if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 }); try { return NextResponse.json(await uploadPresentation(file, validation.extension), { status: 201 }); } catch { return NextResponse.json({ error: "アップロードに失敗しました。" }, { status: 500 }); } }
