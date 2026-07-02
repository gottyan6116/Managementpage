"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  useCreateNote,
  useNoteSections,
  useNotes,
  useUpdateNote,
} from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

export function NotesView() {
  const { data: sections } = useNoteSections();
  const { data: notes } = useNotes();
  const createNote = useCreateNote();

  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [noteId, setNoteId] = useState<string | undefined>(undefined);

  const activeSectionId = sectionId ?? sections?.[0]?.id;
  const activeSection = sections?.find((s) => s.id === activeSectionId);
  const pages = (notes ?? []).filter((n) => n.sectionId === activeSectionId);
  const activeNote = pages.find((n) => n.id === noteId) ?? pages[0];

  function addPage() {
    if (!activeSectionId) return;
    createNote.mutate(activeSectionId, {
      onSuccess: (note) => setNoteId(note.id),
    });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[560px] rounded-2xl border border-line bg-surface shadow-card overflow-x-auto">
      {/* ===== 列1: セクション ===== */}
      <div className="w-40 sm:w-52 shrink-0 border-r border-line bg-surface-muted/30 flex flex-col">
        <button className="flex items-center gap-1.5 px-4 h-12 border-b border-line text-sm font-semibold text-ink hover:bg-surface-muted/60 transition-colors">
          <span className="inline-flex items-center justify-center size-5 rounded bg-[#7719AA] text-white text-[10px] font-bold">
            N
          </span>
          マイノート
          <ChevronDown className="size-4 text-ink-muted ml-auto" />
        </button>
        <div className="flex-1 overflow-y-auto py-2">
          {sections?.map((s) => {
            const active = s.id === activeSectionId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSectionId(s.id);
                  setNoteId(undefined);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 text-left text-sm transition-colors border-l-[3px]",
                  active
                    ? "bg-surface font-semibold text-ink"
                    : "border-l-transparent text-ink-soft hover:bg-surface-muted/60",
                )}
                style={active ? { borderLeftColor: s.color } : undefined}
              >
                <span className="size-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
              </button>
            );
          })}
        </div>
        <button className="flex items-center gap-1.5 px-4 h-10 border-t border-line text-xs font-medium text-ink-soft hover:bg-surface-muted/60 transition-colors">
          <Plus className="size-3.5" />
          セクションの追加
        </button>
      </div>

      {/* ===== 列2: ページ ===== */}
      <div className="w-52 sm:w-64 shrink-0 border-r border-line flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b border-line">
          <span className="text-sm font-semibold text-ink truncate">{activeSection?.name}</span>
        </div>
        <button
          type="button"
          onClick={addPage}
          className="flex items-center gap-1.5 px-4 h-10 border-b border-line text-xs font-semibold transition-colors hover:bg-surface-muted/60"
          style={{ color: activeSection?.color ?? "#7719AA" }}
        >
          <Plus className="size-3.5" />
          ページの追加
        </button>
        <div className="flex-1 overflow-y-auto">
          {pages.map((n) => {
            const active = n.id === activeNote?.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setNoteId(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-line/60 transition-colors",
                  active ? "bg-brand-50/60" : "hover:bg-surface-muted/50",
                )}
              >
                <p className="text-sm font-medium text-ink truncate">
                  {n.title || "無題のページ"}
                </p>
                <p className="text-xs text-ink-muted truncate mt-0.5">
                  {n.body.split("\n")[0] || "テキストなし"}
                </p>
                <p className="text-[11px] text-ink-muted mt-1">{formatDue(n.updatedAt)}</p>
              </button>
            );
          })}
          {pages.length === 0 && (
            <p className="text-center text-xs text-ink-muted py-8">ページがありません</p>
          )}
        </div>
      </div>

      {/* ===== 列3: エディタ ===== */}
      <div className="flex-1 min-w-[300px] sm:min-w-[380px] flex flex-col">
        <div className="h-1" style={{ backgroundColor: activeSection?.color ?? "#7719AA" }} />
        {activeNote ? (
          <NoteEditor key={activeNote.id} note={activeNote} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">
            ページを選択するか、追加してください
          </div>
        )}
      </div>
    </div>
  );
}

function NoteEditor({
  note,
}: {
  note: { id: string; title: string | null; body: string; updatedAt: string };
}) {
  const updateNote = useUpdateNote();
  const [title, setTitle] = useState(note.title ?? "");
  const [body, setBody] = useState(note.body);

  function commitTitle() {
    if ((note.title ?? "") !== title) updateNote.mutate({ id: note.id, patch: { title } });
  }
  function commitBody() {
    if (note.body !== body) updateNote.mutate({ id: note.id, patch: { body } });
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-10 py-8">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        placeholder="無題のページ"
        className="w-full text-3xl font-bold text-ink placeholder:text-ink-muted/60 outline-none bg-transparent"
      />
      <p className="text-xs text-ink-muted mt-2">{formatDue(note.updatedAt)}</p>
      <div className="h-px bg-line my-4" />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={commitBody}
        placeholder="ここに入力して、メモを取りましょう…"
        className="flex-1 w-full resize-none outline-none bg-transparent text-[15px] leading-8 text-ink-soft placeholder:text-ink-muted/60"
      />
    </div>
  );
}
