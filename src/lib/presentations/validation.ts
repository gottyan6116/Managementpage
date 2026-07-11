const MAX_PRESENTATION_BYTES = 100 * 1024 * 1024;
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const PPT_MIME = "application/vnd.ms-powerpoint";
export type PresentationValidation = { ok: true; extension: "ppt" | "pptx" } | { ok: false; error: string };
export async function validatePresentationUpload(file: File): Promise<PresentationValidation> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "ppt" && extension !== "pptx") return { ok: false, error: "PowerPointファイルのみアップロードできます。" };
  if (file.size === 0 || file.size > MAX_PRESENTATION_BYTES) return { ok: false, error: "ファイルサイズは100MB以下にしてください。" };
  if ((extension === "pptx" && file.type !== PPTX_MIME) || (extension === "ppt" && file.type !== PPT_MIME)) return { ok: false, error: "ファイル形式を確認できません。" };
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPptx = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  const isPpt = header[0] === 0xd0 && header[1] === 0xcf && header[2] === 0x11 && header[3] === 0xe0;
  if ((extension === "pptx" && !isPptx) || (extension === "ppt" && !isPpt)) return { ok: false, error: "PowerPointファイルとして検証できません。" };
  return { ok: true, extension };
}
