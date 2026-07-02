"use client";

import { useMemo, useState } from "react";
import { Clock3, Play, Plus, Square } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useCreateTimeEntry,
  useMembers,
  useProjects,
  useTasks,
  useTimeEntries,
} from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";

function hours(minutes: number) {
  return `${Math.round((minutes / 60) * 10) / 10}h`;
}

export function TimeView({ projectId }: { projectId?: string }) {
  const { data: entries } = useTimeEntries(projectId);
  const { data: projects } = useProjects("all");
  const { data: tasks } = useTasks({ tab: "all", projectId });
  const { data: members } = useMembers();
  const createEntry = useCreateTimeEntry(projectId);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({
    projectId: projectId ?? "p1",
    taskId: "",
    date: "2025-05-16",
    minutes: 60,
    note: "",
    billable: true,
  });

  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(tasks?.map((t) => [t.id, t])), [tasks]);
  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);
  const total = (entries ?? []).reduce((sum, e) => sum + e.minutes, 0);
  const billable = (entries ?? []).filter((e) => e.billable).reduce((sum, e) => sum + e.minutes, 0);

  function submit() {
    if (!form.projectId || form.minutes <= 0) return;
    createEntry.mutate({
      projectId: form.projectId,
      taskId: form.taskId || null,
      date: form.date,
      minutes: form.minutes,
      note: form.note || "作業ログ",
      billable: form.billable,
    });
    setForm((v) => ({ ...v, note: "" }));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-ink-soft">総工数</p>
          <p className="mt-1 text-3xl font-bold text-ink tabular-nums">{hours(total)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-ink-soft">請求対象</p>
          <p className="mt-1 text-3xl font-bold text-ink tabular-nums">{hours(billable)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-ink-soft">今週の消化</p>
          <p className="mt-1 text-3xl font-bold text-ink tabular-nums">{hours(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">工数を記録</h2>
            <button
              type="button"
              onClick={() => setRunning((v) => !v)}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line px-3 text-sm font-medium text-ink-soft hover:bg-surface-muted"
            >
              {running ? <Square className="size-4" /> : <Play className="size-4" />}
              {running ? "停止" : "タイマー"}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {!projectId && (
              <label className="block">
                <span className="text-xs font-medium text-ink-soft">案件</span>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((v) => ({ ...v, projectId: e.target.value, taskId: "" }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
                >
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">タスク</span>
              <select
                value={form.taskId}
                onChange={(e) => setForm((v) => ({ ...v, taskId: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="">案件作業として記録</option>
                {tasks?.filter((t) => t.projectId === form.projectId).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-medium text-ink-soft">日付</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-ink-soft">分</span>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={form.minutes}
                  onChange={(e) => setForm((v) => ({ ...v, minutes: Number(e.target.value) }))}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">メモ</span>
              <input
                value={form.note}
                onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))}
                placeholder="例: 論点整理、レビュー、MTG"
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.billable}
                onChange={(e) => setForm((v) => ({ ...v, billable: e.target.checked }))}
                className="size-4"
              />
              請求対象にする
            </label>
            <button
              type="button"
              onClick={submit}
              className="primary-button inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-lg px-3 text-sm font-semibold text-white"
            >
              <Plus className="size-4" />
              工数を追加
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-base font-semibold text-ink">工数ログ</h2>
          </div>
          {(entries?.length ?? 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-ink-muted">
                  <tr>
                    <th className="py-2.5 pl-5 font-medium">日付</th>
                    <th className="py-2.5 font-medium">案件 / タスク</th>
                    <th className="py-2.5 font-medium">担当</th>
                    <th className="py-2.5 font-medium">工数</th>
                    <th className="py-2.5 pr-5 font-medium">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {entries?.map((e) => {
                    const project = projectMap.get(e.projectId);
                    return (
                      <tr key={e.id} className="border-t border-line">
                        <td className="py-3 pl-5 tabular-nums text-ink-soft">{formatDue(e.date)}</td>
                        <td className="py-3">
                          <p className="font-medium text-ink">{project?.name}</p>
                          <p className="text-xs text-ink-muted">{e.taskId ? taskMap.get(e.taskId)?.title : "案件作業"}</p>
                        </td>
                        <td className="py-3 text-ink-soft">{memberMap.get(e.memberId)?.name}</td>
                        <td className="py-3 font-semibold tabular-nums text-ink">{hours(e.minutes)}</td>
                        <td className="py-3 pr-5 text-ink-soft">{e.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Clock3} title="工数ログがありません" description="最初の作業時間を記録すると、案件別・週別の消化が見えるようになります。" />
          )}
        </div>
      </div>
    </div>
  );
}
