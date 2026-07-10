"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, GitBranch, Plus, Rocket, X } from "lucide-react";
import {
  useCreateIssueTreeProject,
  useIssueTreeProjectSummaries,
  type IssueTreeProjectSummary,
} from "@/lib/queries/issue-tree-hooks";
import { useProjects } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";

const CATEGORIES = ["Webマーケ", "業務改善", "新規事業", "システム導入", "その他"];

/** 一覧: プロジェクトカードのグリッド。カードは Link で /issue-tree/[projectId] へ遷移する。 */
export function IssueTreeProjectGrid() {
  const { data: projects, isLoading } = useIssueTreeProjectSummaries();
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="min-h-52 rounded-2xl border-2 border-dashed border-line bg-surface/50 flex flex-col items-center justify-center gap-2 text-ink-soft hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 transition-colors"
        >
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-muted">
            <Plus className="size-5" />
          </span>
          <span className="text-sm font-semibold">新規プロジェクトを作成</span>
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <NewProjectDialog
            onClose={() => setCreating(false)}
            onCreated={(id) => {
              setCreating(false);
              router.push(`/issue-tree/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProjectCard({ project }: { project: IssueTreeProjectSummary }) {
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={`/issue-tree/${project.id}`}
        className="glass-card flex h-full flex-col gap-3 rounded-2xl p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">{project.clientName}</p>
            <h3 className="mt-0.5 text-base font-bold leading-snug text-ink">{project.name}</h3>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {project.category}
          </span>
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="line-clamp-2 leading-relaxed text-ink-soft">{project.objective}</p>
          {project.kpis.length > 0 && (
            <p className="text-xs text-ink-soft">
              <span className="font-semibold text-ink">主要KPI:</span>{" "}
              {project.kpis.map((k) => k.label).join(" / ")}
            </p>
          )}
          {project.nextAction && (
            <p className="truncate text-xs text-ink-soft">
              <span className="font-semibold text-ink">次:</span> {project.nextAction}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-3">
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3.5 text-ink-muted" />
              論点 <span className="font-bold text-ink tabular-nums">{project.nodeCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <FlaskConical className="size-3.5 text-[#2563EB]" />
              検証中 <span className="font-bold text-ink tabular-nums">{project.testingCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Rocket className="size-3.5 text-[#7C3AED]" />
              施策化 <span className="font-bold text-ink tabular-nums">{project.actionizedCount}</span>
            </span>
          </div>
          <span className="whitespace-nowrap text-[11px] text-ink-soft">
            更新 {formatDue(project.updatedAt)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function NewProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (projectId: string) => void;
}) {
  const create = useCreateIssueTreeProject();
  const { data: linkableProjects } = useProjects("all");
  const [clientName, setClientName] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [objective, setObjective] = useState("");
  const [linkedProjectId, setLinkedProjectId] = useState("");

  const valid = clientName.trim().length > 0 && name.trim().length > 0;

  function submit() {
    if (!valid || create.isPending) return;
    create.mutate(
      {
        clientName,
        name,
        category,
        objective,
        linkedProjectId: linkedProjectId || null,
      },
      { onSuccess: (project) => onCreated(project.id) },
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
        aria-label="新規プロジェクトを作成"
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-pop"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">新規プロジェクトを作成</h3>
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
          <Field label="クライアント名 *" value={clientName} onChange={setClientName} placeholder="株式会社〇〇" />
          <Field label="案件名 *" value={name} onChange={setName} placeholder="LP CVR改善" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">案件種別</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm text-ink"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Field label="目的" value={objective} onChange={setObjective} placeholder="CVRを2.1%→4.0%へ" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
              連携する案件 (タスク作成先)
            </label>
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-sm text-ink"
            >
              <option value="">未連携</option>
              {linkableProjects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!valid || create.isPending}
          className="primary-button mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
          作成してワークスペースを開く
        </button>
      </motion.div>
    </div>
  );
}

function Field({
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
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand-300"
      />
    </div>
  );
}
