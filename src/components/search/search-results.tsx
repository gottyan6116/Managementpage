"use client";

import Link from "next/link";
import {
  Briefcase,
  FileText,
  Folder,
  ListTodo,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useSearch } from "@/lib/queries/hooks";
import type { SearchHit } from "@/lib/repositories";

const TYPE_META: Record<SearchHit["type"], { icon: LucideIcon; label: string; color: string }> = {
  project: { icon: Briefcase, label: "案件", color: "#2563EB" },
  task: { icon: ListTodo, label: "タスク", color: "#0F766E" },
  document: { icon: FileText, label: "ドキュメント", color: "#7C3AED" },
  file: { icon: Folder, label: "ファイル", color: "#D97706" },
};

export function SearchResults({ q }: { q: string }) {
  const { data: hits, isLoading } = useSearch(q);

  if (!q.trim()) {
    return (
      <div className="rounded-2xl bg-surface border border-line shadow-card">
        <EmptyState icon={SearchX} title="検索キーワードを入力してください" />
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-surface border border-line animate-pulse" />;
  }

  if (!hits || hits.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-line shadow-card">
        <EmptyState icon={SearchX} title={`「${q}」に一致する結果はありません`} description="別のキーワードでお試しください。" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
      <p className="px-5 py-3 text-sm text-ink-soft border-b border-line">
        「<span className="font-semibold text-ink">{q}</span>」の検索結果 {hits.length} 件
      </p>
      <ul className="divide-y divide-line/60">
        {hits.map((hit) => {
          const meta = TYPE_META[hit.type];
          const Icon = meta.icon;
          return (
            <li key={`${hit.type}-${hit.id}`}>
              <Link href={hit.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted/60 transition-colors">
                <span
                  className="inline-flex items-center justify-center size-9 rounded-lg shrink-0"
                  style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink truncate">{hit.title}</span>
                  <span className="block text-xs text-ink-muted truncate">{hit.subtitle}</span>
                </span>
                <span className="text-xs text-ink-muted shrink-0">{meta.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
