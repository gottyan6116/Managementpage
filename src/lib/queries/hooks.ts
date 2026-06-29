"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as repo from "@/lib/repositories";
import type { ActionItem, Note, Task } from "@/types/domain";

/** クエリキー (docs/05 §2)。データ取得は必ずこのフック経由。 */
export const qk = {
  members: ["members"] as const,
  projects: (tab: repo.ProjectTab) => ["projects", tab] as const,
  tasks: (params: repo.TaskListParams) => ["tasks", params] as const,
  board: ["board"] as const,
  boardColumns: ["board-columns"] as const,
  milestones: ["milestones"] as const,
  kpi: ["dashboard-kpi"] as const,
  upcoming: ["upcoming"] as const,
  gantt: (projectId?: string) => ["gantt", projectId ?? "all"] as const,
  deps: ["dependencies"] as const,
  atRisk: ["at-risk"] as const,
  statusDist: ["status-distribution"] as const,
  actions: ["actions"] as const,
  notifications: ["notifications"] as const,
  documents: ["documents"] as const,
  files: ["files"] as const,
  notes: ["notes"] as const,
};

export function useMembers() {
  return useQuery({ queryKey: qk.members, queryFn: repo.listMembers });
}

export function useProjects(tab: repo.ProjectTab = "all") {
  return useQuery({ queryKey: qk.projects(tab), queryFn: () => repo.listProjects(tab) });
}

export function useTasks(params: repo.TaskListParams = {}) {
  return useQuery({ queryKey: qk.tasks(params), queryFn: () => repo.listTasks(params) });
}

export function useDashboardKpi() {
  return useQuery({ queryKey: qk.kpi, queryFn: repo.getDashboardKpi });
}

export function useUpcoming(limit = 6) {
  return useQuery({ queryKey: qk.upcoming, queryFn: () => repo.listUpcoming(limit) });
}

export function useBoardColumns() {
  return useQuery({ queryKey: qk.boardColumns, queryFn: repo.listBoardColumns });
}

export function useMilestones() {
  return useQuery({ queryKey: qk.milestones, queryFn: repo.listMilestones });
}

export function useGanttRows(projectId?: string) {
  return useQuery({ queryKey: qk.gantt(projectId), queryFn: () => repo.listGanttRows(projectId) });
}

export function useDependencies() {
  return useQuery({ queryKey: qk.deps, queryFn: repo.listDependencies });
}

export function useAtRiskProjects() {
  return useQuery({ queryKey: qk.atRisk, queryFn: repo.listAtRiskProjects });
}

export function useStatusDistribution() {
  return useQuery({ queryKey: qk.statusDist, queryFn: repo.getProjectStatusDistribution });
}

export function useActions() {
  return useQuery({ queryKey: qk.actions, queryFn: repo.listActions });
}

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: repo.listNotifications });
}

export function useDocuments() {
  return useQuery({ queryKey: qk.documents, queryFn: repo.listDocuments });
}

export function useFiles() {
  return useQuery({ queryKey: qk.files, queryFn: repo.listFiles });
}

export function useNotes() {
  return useQuery({ queryKey: qk.notes, queryFn: repo.listNotes });
}

/** メモのピン留めトグル (楽観的更新) */
export function useToggleNotePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.toggleNotePin(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.notes });
      const prev = qc.getQueryData<Note[]>(qk.notes);
      qc.setQueryData<Note[]>(qk.notes, (old) =>
        old?.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.notes, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

/** タスク完了トグル (楽観的更新 + 失敗時ロールバック, docs/05 §3) */
export function useToggleTaskDone(params: repo.TaskListParams = {}) {
  const qc = useQueryClient();
  const key = qk.tasks(params);
  return useMutation({
    mutationFn: (id: string) => repo.toggleTaskDone(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) =>
        old?.map((t) =>
          t.id === id
            ? {
                ...t,
                status: t.status === "done" ? "todo" : "done",
                progress: t.status === "done" ? 0 : 100,
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: qk.kpi });
    },
  });
}

/** 今週のアクションのチェックトグル */
export function useToggleAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.toggleAction(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.actions });
      const prev = qc.getQueryData<ActionItem[] | undefined>(qk.actions);
      qc.setQueryData<ActionItem[]>(qk.actions, (old) =>
        old?.map((a) => (a.id === id ? { ...a, isDone: !a.isDone } : a)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.actions, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.actions }),
  });
}

/** ボードのカード移動 */
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, columnId, position }: { id: string; columnId: string; position: number }) =>
      repo.moveTask(id, columnId, position),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: qk.board });
    },
  });
}
