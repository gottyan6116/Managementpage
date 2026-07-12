"use client";

import { useRef, useState } from "react";
import {
  Download,
  FileWarning,
  Loader2,
  Presentation,
  Trash2,
  Upload,
} from "lucide-react";
import { useDecks, useDeleteDeck, useUploadDeck, type DeckFile } from "@/lib/queries/decks-hooks";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export function DecksView() {
  const { data, isLoading } = useDecks();
  const upload = useUploadDeck();
  const remove = useDeleteDeck();
  const pushToast = useToastStore((s) => s.push);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadError(null);
    upload.mutate(file, {
      onSuccess: () => pushToast({ message: `「${file.name}」をアップロードしました`, durationMs: 4000 }),
      onError: (err) => setUploadError(err instanceof Error ? err.message : "アップロードに失敗しました。"),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete(file: DeckFile) {
    if (!window.confirm(`「${file.name}」を削除します。よろしいですか？`)) return;
    remove.mutate(file.path, {
      onSuccess: () => pushToast({ message: `「${file.name}」を削除しました`, durationMs: 4000 }),
      onError: (err) =>
        pushToast({
          message: err instanceof Error ? err.message : "削除に失敗しました。",
          durationMs: 5000,
        }),
    });
  }

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-surface border border-line animate-pulse" />;
  }

  if (data?.notConfigured) {
    return (
      <div className="data-card rounded-2xl p-8 text-center">
        <FileWarning className="mx-auto size-8 text-ink-muted" />
        <p className="mt-3 text-sm font-semibold text-ink">Supabase Storage が未設定です</p>
        <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
          環境変数 <code className="rounded bg-surface-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          を設定し、private バケット「presentations」を作成してください。
        </p>
      </div>
    );
  }

  const files = data?.files ?? [];

  return (
    <div className="space-y-5">
      {/* アップロードエリア */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "data-card flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-brand-400 bg-brand-50/40" : "border-line",
        )}
      >
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Upload className="size-5" />
        </span>
        <p className="text-sm font-semibold text-ink">
          PPTファイルをドラッグ＆ドロップ、または
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ml-1 text-brand-600 underline hover:text-brand-700"
          >
            ファイルを選択
          </button>
        </p>
        <p className="text-xs text-ink-soft">.pptx / .ppt（最大200MB）</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {upload.isPending && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
            <Loader2 className="size-3.5 animate-spin" />
            アップロード中…
          </p>
        )}
        {uploadError && <p className="text-xs font-medium text-red-600">{uploadError}</p>}
      </div>

      {/* ファイル一覧 */}
      {files.length === 0 ? (
        <div className="data-card rounded-2xl p-10 text-center">
          <Presentation className="mx-auto size-8 text-ink-muted" />
          <p className="mt-3 text-sm text-ink-soft">まだ資料がアップロードされていません。</p>
        </div>
      ) : (
        <div className="data-card overflow-hidden rounded-2xl">
          <ul className="divide-y divide-line">
            {files.map((f) => (
              <li key={f.path} className="flex items-center gap-3 px-5 py-3.5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4e6] text-[#d97706]">
                  <Presentation className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                  <p className="text-xs text-ink-soft">
                    {formatBytes(f.sizeBytes)}
                    {f.uploadedAt && ` ・ ${formatDate(f.uploadedAt)}`}
                  </p>
                </div>
                <a
                  href={`/api/decks/download?path=${encodeURIComponent(f.path)}`}
                  aria-label={`「${f.name}」をダウンロード`}
                  title="ダウンロード"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted hover:text-brand-600 transition-colors"
                >
                  <Download className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  aria-label={`「${f.name}」を削除`}
                  title="削除"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
