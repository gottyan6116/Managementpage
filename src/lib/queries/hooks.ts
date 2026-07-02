"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as repo from "@/lib/repositories";
import type {
  ActionItem,
  BillingRecord,
  FileItem,
  GanttRow,
  Note,
  Priority,
  ProjectActivity,
  Task,
  TimeEntry,
} from "@/types/domain";

/** クエリキー (docs/05 §2)。データ取得は必ずこのフック経由。 */
export const qk = {
  members: ["members"] as const,
  projects: (tab: repo.ProjectTab) => ["projects", tab] as const,
  project: (id: string) => ["project", id] as const,
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
  clients: ["clients"] as const,
  client: (id: string) => ["client", id] as const,
  clientProjects: (id: string) => ["client-projects", id] as const,
  documents: ["documents"] as const,
  document: (id: string) => ["document", id] as const,
  search: (q: string) => ["search", q] as const,
  files: ["files"] as const,
  notes: ["notes"] as const,
  noteSections: ["note-sections"] as const,
  timeEntries: (projectId?: string) => ["time-entries", projectId ?? "all"] as const,
  billing: (projectId?: string) => ["billing", projectId ?? "all"] as const,
  activities: (projectId: string) => ["project-activities", projectId] as const,
};

export function useMembers() {
  return useQuery({ queryKey: qk.members, queryFn: repo.listMembers });
}

export function useProjects(tab: repo.ProjectTab = "all") {
  return useQuery({ queryKey: qk.projects(tab), queryFn: () => repo.listProjects(tab) });
}

export function useProject(id: string) {
  return useQuery({ queryKey: qk.project(id), queryFn: () => repo.getProject(id) });
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

export function useClients() {
  return useQuery({ queryKey: qk.clients, queryFn: repo.listClients });
}

export function useClient(id: string) {
  return useQuery({ queryKey: qk.client(id), queryFn: () => repo.getClient(id) });
}

export function useClientProjects(id: string) {
  return useQuery({ queryKey: qk.clientProjects(id), queryFn: () => repo.listClientProjects(id) });
}

export function useDocuments() {
  return useQuery({ queryKey: qk.documents, queryFn: repo.listDocuments });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: qk.document(id), queryFn: () => repo.getDocument(id) });
}

export function useUpdateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { title?: string; body?: string; projectId?: string | null }) =>
      repo.updateDocument(id, patch),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.document(id) });
      qc.invalidateQueries({ queryKey: qk.documents });
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (init?: {
      title?: string;
      body?: string;
      projectId?: string | null;
      template?: "standard" | "meeting";
    }) =>
      repo.createDocument(init),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: qk.search(query),
    queryFn: () => repo.searchAll(query),
    enabled: query.trim().length > 0,
  });
}

export function useFiles() {
  return useQuery({ queryKey: qk.files, queryFn: repo.listFiles });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteFile(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: qk.files });
      const prev = qc.getQueryData<FileItem[] | undefined>(qk.files);
      qc.setQueryData<FileItem[]>(qk.files, (old) =>
        old?.filter((file) => file.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.files, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.files }),
  });
}


export function useNotes() {
  return useQuery({ queryKey: qk.notes, queryFn: repo.listNotes });
}

export function useNoteSections() {
  return useQuery({ queryKey: qk.noteSections, queryFn: repo.listNoteSections });
}

/** メモ本文/タイトルの編集 (楽観的更新) */
export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { title?: string | null; body?: string };
    }) => repo.updateNote(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.notes });
      const prev = qc.getQueryData<Note[]>(qk.notes);
      qc.setQueryData<Note[]>(qk.notes, (old) =>
        old?.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.notes, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => repo.createNote(sectionId),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

/** ガント行のリネーム (タスク/プロジェクト) */
export function useRenameGanttRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, title }: { id: string; type: "task" | "project"; title: string }) =>
      type === "task" ? repo.updateTaskTitle(id, title) : repo.updateProjectName(id, title),
    onMutate: async ({ id, title }) => {
      await qc.cancelQueries({ queryKey: ["gantt"] });
      qc.setQueriesData<GanttRow[]>({ queryKey: ["gantt"] }, (old) =>
        old?.map((r) => (r.id === id ? { ...r, label: title } : r)),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

/** ガント行の削除 (タスク/プロジェクト) */
export function useDeleteGanttRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: "task" | "project" }) =>
      type === "task" ? repo.deleteTask(id) : repo.deleteProject(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
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

export function useCreateTask(params: repo.TaskListParams = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (init: {
      projectId: string | null;
      title: string;
      dueDate?: string | null;
      columnId?: string;
      priority?: Priority;
      assigneeId?: string | null;
    }) =>
      repo.createTask(init),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: qk.tasks(params) });
      qc.invalidateQueries({ queryKey: qk.board });
      qc.invalidateQueries({ queryKey: qk.kpi });
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["project-activities"] });
    },
  });
}

export function useUpdateTaskDetails(params: repo.TaskListParams = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: repo.TaskDetailsPatch;
    }) => repo.updateTaskDetails(id, patch),
    onMutate: async ({ id, patch }) => {
      const taskKey = qk.tasks(params);
      await Promise.all([
        qc.cancelQueries({ queryKey: ["tasks"] }),
        qc.cancelQueries({ queryKey: taskKey }),
        qc.cancelQueries({ queryKey: qk.board }),
        qc.cancelQueries({ queryKey: ["gantt"] }),
      ]);

      const prevTasks = qc.getQueryData<Task[] | undefined>(taskKey);
      const prevAllTasks = qc.getQueryData<Task[] | undefined>(["tasks"]);
      const prevBoard = qc.getQueryData<Record<string, Task[]> | undefined>(qk.board);
      const prevGantt = qc.getQueriesData<GanttRow[]>({ queryKey: ["gantt"] });
      const normalizedPatch: Partial<Task> = {
        ...patch,
        title: patch.title?.trim() || undefined,
        description:
          patch.description === undefined ? undefined : patch.description?.trim() || null,
      };

      const applyPatch = (task: Task): Task =>
        task.id === id
          ? {
              ...task,
              ...normalizedPatch,
              title: normalizedPatch.title ?? task.title,
              projectId: normalizedPatch.projectId ?? task.projectId,
              assigneeIds: normalizedPatch.assigneeIds ?? task.assigneeIds,
              description:
                normalizedPatch.description !== undefined
                  ? normalizedPatch.description
                  : task.description,
            }
          : task;

      qc.setQueryData<Task[]>(taskKey, (old) => old?.map(applyPatch) ?? old);
      qc.setQueryData<Task[]>(["tasks"], (old) => old?.map(applyPatch) ?? old);
      qc.setQueryData<Record<string, Task[]>>(qk.board, (old) => {
        if (!old) return old;
        return Object.fromEntries(
          Object.entries(old).map(([columnId, tasks]) => [
            columnId,
            tasks.map(applyPatch),
          ]),
        );
      });
      prevGantt.forEach(([key, rows]) => {
        if (!rows) return;
        qc.setQueryData<GanttRow[]>(
          key,
          rows.map((row) =>
            row.type === "task" && row.id === id
              ? {
                  ...row,
                  label: normalizedPatch.title ?? row.label,
                  progress: normalizedPatch.progress ?? row.progress,
                  status: normalizedPatch.status ?? row.status,
                  assigneeIds: normalizedPatch.assigneeIds ?? row.assigneeIds,
                  bar:
                    normalizedPatch.startDate !== undefined ||
                    normalizedPatch.dueDate !== undefined
                      ? {
                          start: normalizedPatch.startDate ?? row.bar?.start ?? "",
                          due: normalizedPatch.dueDate ?? row.bar?.due ?? "",
                        }
                      : row.bar,
                }
              : row,
          ),
        );
      });

      return { prevTasks, prevAllTasks, prevBoard, prevGantt, taskKey };
    },
    onError: (_error, _variables, ctx) => {
      if (!ctx) return;
      qc.setQueryData(ctx.taskKey, ctx.prevTasks);
      qc.setQueryData(["tasks"], ctx.prevAllTasks);
      qc.setQueryData(qk.board, ctx.prevBoard);
      ctx.prevGantt.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: qk.tasks(params) });
      qc.invalidateQueries({ queryKey: qk.board });
      qc.invalidateQueries({ queryKey: qk.kpi });
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["project-activities"] });
    },
  });
}

export function useDeleteTask(params: repo.TaskListParams = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.deleteTask(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: qk.tasks(params) });
      qc.invalidateQueries({ queryKey: qk.board });
      qc.invalidateQueries({ queryKey: qk.kpi });
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["project-activities"] });
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

/** ガントのバー編集 (開始/終了日)。全 gantt キャッシュを楽観的に更新 */
export function useUpdateTaskSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      startDate,
      dueDate,
    }: {
      id: string;
      startDate: string;
      dueDate: string;
    }) => repo.updateTaskSchedule(id, startDate, dueDate),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["gantt"] });
      qc.setQueriesData<GanttRow[]>({ queryKey: ["gantt"] }, (old) =>
        old?.map((r) =>
          r.id === vars.id && r.bar
            ? {
                ...r,
                bar: { start: vars.startDate, due: vars.dueDate },
                milestone: r.milestone
                  ? { ...r.milestone, date: vars.dueDate }
                  : undefined,
              }
            : r,
        ),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["gantt"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
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

export function useTimeEntries(projectId?: string) {
  return useQuery({
    queryKey: qk.timeEntries(projectId),
    queryFn: () => repo.listTimeEntries(projectId),
  });
}

export function useCreateTimeEntry(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (init: {
      projectId: string;
      taskId?: string | null;
      memberId?: string;
      date: string;
      minutes: number;
      note: string;
      billable: boolean;
    }) => repo.createTimeEntry(init),
    onMutate: async (init) => {
      const key = qk.timeEntries(projectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TimeEntry[]>(key);
      qc.setQueryData<TimeEntry[]>(key, (old) => [
        {
          id: `temp-${Date.now()}`,
          projectId: init.projectId,
          taskId: init.taskId ?? null,
          memberId: init.memberId ?? "m-yamada",
          date: init.date,
          minutes: init.minutes,
          note: init.note,
          billable: init.billable,
        },
        ...(old ?? []),
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.timeEntries(projectId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      qc.invalidateQueries({ queryKey: ["project-activities"] });
    },
  });
}

export function useBillingRecords(projectId?: string) {
  return useQuery({
    queryKey: qk.billing(projectId),
    queryFn: () => repo.listBillingRecords(projectId),
  });
}

export function useUpdateBillingRecord(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<
          BillingRecord,
          "contractAmount" | "invoicedAmount" | "directCost" | "dueDate" | "closingReminder"
        >
      >;
    }) => repo.updateBillingRecord(id, patch),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.billing(projectId) }),
  });
}

export function useProjectActivities(projectId: string) {
  return useQuery({
    queryKey: qk.activities(projectId),
    queryFn: () => repo.listProjectActivities(projectId),
  });
}

export function useCreateProjectActivity(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => repo.createProjectActivity({ projectId, body }),
    onMutate: async (body) => {
      const key = qk.activities(projectId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ProjectActivity[]>(key);
      qc.setQueryData<ProjectActivity[]>(key, (old) => [
        {
          id: `temp-${Date.now()}`,
          projectId,
          actorMemberId: "m-yamada",
          createdAt: new Date().toISOString(),
          type: "comment",
          body,
        },
        ...(old ?? []),
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.activities(projectId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.activities(projectId) }),
  });
}
