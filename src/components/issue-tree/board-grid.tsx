"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useCreateIssueBoard, useIssueBoardSummaries, useProjects } from "@/lib/queries/hooks";
import { IssueBoardCard } from "./board-card";
import { IssueBoardDetail } from "./board-detail";

const CATEGORIES = ["Webマーケ", "業務改善", "新規事業", "システム導入", "その他"];

export function IssueBoardGrid() {
  const { data: boards, isLoading } = useIssueBoardSummaries();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const openBoard = useMemo(
    () => boards?.find((b) => b.id === openId) ?? null,
    [boards, openId],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-52 rounded-2xl bg-surface border border-line animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {boards?.map((board) => (
          <IssueBoardCard key={board.id} board={board} onOpen={() => setOpenId(board.id)} />
        ))}

        {/* 新規ボード */}
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="min-h-52 rounded-2xl border-2 border-dashed border-line bg-surface/50 flex flex-col items-center justify-center gap-2 text-ink-soft hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 transition-colors"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-muted">
            <Plus className="size-5" />
          </span>
          <span className="text-sm font-semibold">新規ボードを作成</span>
        </button>
      </div>

      {/* 拡張モーダル */}
      <AnimatePresence>
        {openBoard && (
          <IssueBoardDetail key={openBoard.id} board={openBoard} onClose={() => setOpenId(null)} />
        )}
      </AnimatePresence>

      {/* 新規ボード作成ダイアログ */}
      <AnimatePresence>
        {creating && (
          <NewBoardDialog
            onClose={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              setOpenId(id);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function NewBoardDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (boardId: string) => void;
}) {
  const create = useCreateIssueBoard();
  const { data: projects } = useProjects("all");
  const [clientName, setClientName] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [objective, setObjective] = useState("");
  const [kpi, setKpi] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  const valid = clientName.trim().length > 0 && name.trim().length > 0;

  function submit() {
    if (!valid || create.isPending) return;
    create.mutate(
      { clientName, name, category, objective, kpi, projectId: projectId || null },
      { onSuccess: (board) => onCreated(board.id) },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[rgba(15,23,42,0.45)]"
      />
      <motion.div
        role="dialog"
        aria-label="新規ボードを作成"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full max-w-md rounded-2xl bg-surface border border-line shadow-pop p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink">新規ボードを作成</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <Input label="クライアント名 *" value={clientName} onChange={setClientName} placeholder="株式会社〇〇" />
          <Input label="案件名 *" value={name} onChange={setName} placeholder="LP CVR改善" />
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">案件種別</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="目的" value={objective} onChange={setObjective} placeholder="CVRを2.1%→4.0%へ" />
          <Input label="主要KPI" value={kpi} onChange={setKpi} placeholder="CVR / CPA / フォーム完了率" />
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              連携する案件 (タスク作成先)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink"
            >
              <option value="">未連携</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!valid || create.isPending}
          className="primary-button mt-5 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="size-4" />
          作成してツリーを開く
        </button>
      </motion.div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-300 placeholder:text-ink-muted"
      />
    </div>
  );
}
