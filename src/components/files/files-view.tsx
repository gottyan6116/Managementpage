"use client";

import { useMemo, useState } from "react";
import {
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  MoreVertical,
  Presentation,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { useFiles, useProjects } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string): { Icon: LucideIcon; color: string } {
  if (mime.startsWith("image/")) return { Icon: FileImage, color: "#8B5CF6" };
  if (mime.includes("pdf")) return { Icon: FileText, color: "#DC2626" };
  if (mime.includes("spreadsheet")) return { Icon: FileSpreadsheet, color: "#16A34A" };
  if (mime.includes("presentation")) return { Icon: Presentation, color: "#EA580C" };
  if (mime.includes("word")) return { Icon: FileText, color: "#2563EB" };
  return { Icon: FileIcon, color: "#64748B" };
}

export function FilesView() {
  const { data: files } = useFiles();
  const { data: projects } = useProjects("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  return (
    <div className="space-y-5">
      {/* アップロード枠 + 表示切替 */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface hover:border-brand-300 hover:bg-brand-50/40 transition-colors py-6 text-ink-soft"
        >
          <UploadCloud className="size-6 text-brand-500" />
          <span className="text-sm font-medium">
            ファイルをドラッグ&ドロップ、またはクリックして選択
          </span>
        </button>
        <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1 self-end sm:self-auto">
          <button
            type="button"
            aria-label="グリッド表示"
            onClick={() => setView("grid")}
            className={cn(
              "inline-flex items-center justify-center size-8 rounded-lg transition-colors",
              view === "grid" ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label="リスト表示"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center justify-center size-8 rounded-lg transition-colors",
              view === "list" ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {files?.map((f) => {
            const { Icon, color } = iconFor(f.mimeType);
            const project = f.projectId ? projectMap.get(f.projectId) : undefined;
            return (
              <div
                key={f.id}
                className="group rounded-2xl bg-surface border border-line shadow-card p-4 hover:shadow-pop transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="inline-flex items-center justify-center size-11 rounded-xl"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <button
                    aria-label="メニュー"
                    className="inline-flex items-center justify-center size-7 rounded-lg text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-muted transition"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium text-ink truncate" title={f.name}>
                  {f.name}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 truncate">{project?.name ?? "未分類"}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
                  <span>{formatBytes(f.sizeBytes)}</span>
                  <span>{formatDue(f.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-line">
                <th className="py-2.5 pl-5 font-medium">名前</th>
                <th className="py-2.5 font-medium">プロジェクト</th>
                <th className="py-2.5 font-medium">サイズ</th>
                <th className="py-2.5 font-medium">更新日</th>
                <th className="py-2.5 pr-5" />
              </tr>
            </thead>
            <tbody>
              {files?.map((f) => {
                const { Icon, color } = iconFor(f.mimeType);
                const project = f.projectId ? projectMap.get(f.projectId) : undefined;
                return (
                  <tr key={f.id} className="border-b border-line/60 hover:bg-surface-muted/60 transition-colors">
                    <td className="py-3 pl-5">
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          className="inline-flex items-center justify-center size-8 rounded-lg"
                          style={{ backgroundColor: `${color}1A`, color }}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="font-medium text-ink">{f.name}</span>
                      </span>
                    </td>
                    <td className="py-3 text-ink-soft">{project?.name ?? "未分類"}</td>
                    <td className="py-3 text-ink-soft tabular-nums">{formatBytes(f.sizeBytes)}</td>
                    <td className="py-3 text-ink-soft tabular-nums">{formatDue(f.createdAt)}</td>
                    <td className="py-3 pr-5">
                      <button
                        aria-label="ダウンロード"
                        className="inline-flex items-center justify-center size-7 rounded-lg text-ink-muted hover:bg-surface-muted transition-colors"
                      >
                        <Download className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
