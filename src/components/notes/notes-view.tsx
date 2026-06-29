"use client";

import { Pin, PinOff, Plus } from "lucide-react";
import { useNotes, useToggleNotePin } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

export function NotesView() {
  const { data: notes } = useNotes();
  const togglePin = useToggleNotePin();

  const pinned = notes?.filter((n) => n.isPinned) ?? [];
  const others = notes?.filter((n) => !n.isPinned) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors">
          <Plus className="size-4" />
          新規メモ
        </button>
      </div>

      {pinned.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase mb-3">
            <Pin className="size-3.5" />
            ピン留め
          </h2>
          <NoteMasonry notes={pinned} onTogglePin={(id) => togglePin.mutate(id)} />
        </section>
      )}

      <section>
        {pinned.length > 0 && (
          <h2 className="text-xs font-semibold text-ink-muted uppercase mb-3">その他</h2>
        )}
        <NoteMasonry notes={others} onTogglePin={(id) => togglePin.mutate(id)} />
      </section>
    </div>
  );
}

function NoteMasonry({
  notes,
  onTogglePin,
}: {
  notes: { id: string; title: string | null; body: string; color: string; isPinned: boolean; updatedAt: string }[];
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]">
      {notes.map((note) => (
        <div
          key={note.id}
          className="group mb-4 break-inside-avoid rounded-2xl border border-black/5 shadow-card p-4"
          style={{ backgroundColor: note.color }}
        >
          <div className="flex items-start justify-between gap-2">
            {note.title && (
              <h3 className="text-sm font-semibold text-ink leading-snug">{note.title}</h3>
            )}
            <button
              type="button"
              onClick={() => onTogglePin(note.id)}
              aria-label={note.isPinned ? "ピンを外す" : "ピン留め"}
              className={cn(
                "ml-auto inline-flex items-center justify-center size-7 rounded-lg transition-colors shrink-0",
                note.isPinned
                  ? "text-ink-soft hover:bg-black/5"
                  : "text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-black/5",
              )}
            >
              {note.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            </button>
          </div>
          <p className="text-sm text-ink/90 whitespace-pre-wrap leading-relaxed mt-1.5">
            {note.body}
          </p>
          <p className="text-[11px] text-ink/50 mt-3">{formatDue(note.updatedAt)}</p>
        </div>
      ))}
    </div>
  );
}
