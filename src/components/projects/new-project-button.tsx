"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useCreateProject } from "@/lib/queries/hooks";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createProject = useCreateProject();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createProject.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName("");
          setOpen(false);
        },
      },
    );
  }

  if (open) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setOpen(false);
              setName("");
            }
          }}
          placeholder="案件名を入力"
          className="h-9 w-48 rounded-lg border border-brand-300 bg-surface px-3 text-sm text-ink outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || createProject.isPending}
          aria-label="案件を作成"
          className="inline-flex items-center justify-center size-9 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setName("");
          }}
          aria-label="キャンセル"
          className="inline-flex items-center justify-center size-9 rounded-lg text-ink-muted hover:bg-surface-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors"
    >
      <Plus className="size-4" />
      新規案件
    </button>
  );
}
