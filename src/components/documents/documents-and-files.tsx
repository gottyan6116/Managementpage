"use client";

import { useState } from "react";
import { FileText, Folder } from "lucide-react";
import { DocumentsView } from "./documents-view";
import { FilesView } from "@/components/files/files-view";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "documents", label: "ドキュメント", icon: FileText },
  { key: "files", label: "ファイル", icon: Folder },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function DocumentsAndFiles() {
  const [tab, setTab] = useState<TabKey>("documents");

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "documents" ? <DocumentsView /> : <FilesView />}
    </div>
  );
}
