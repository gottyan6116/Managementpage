"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  FileText,
  Folder,
  LayoutGrid,
  ListTodo,
  Mail,
  MessageSquare,
  Milestone,
  Phone,
  Plus,
  Users,
} from "lucide-react";
import { BoardKanban } from "@/components/board/board-kanban";
import { BillingView } from "@/components/billing/billing-view";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { AvatarGroup, Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PhaseBadge, PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { TaskTable } from "@/components/dashboard/task-table";
import { TimeView } from "@/components/time/time-view";
import {
  useBillingRecords,
  useClient,
  useCreateDocument,
  useCreateProjectActivity,
  useDocuments,
  useFiles,
  useMembers,
  useProject,
  useProjectActivities,
} from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "概要", icon: Activity },
  { key: "tasks", label: "タスク", icon: ListTodo },
  { key: "gantt", label: "ガント", icon: Milestone },
  { key: "board", label: "Todo", icon: LayoutGrid },
  { key: "documents", label: "ドキュメント", icon: FileText },
  { key: "files", label: "ファイル", icon: Folder },
  { key: "client", label: "クライアント", icon: Building2 },
  { key: "members", label: "メンバー", icon: Users },
  { key: "activity", label: "ログ", icon: MessageSquare },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const { data: members } = useMembers();
  const { data: billing } = useBillingRecords(id);
  const [tab, setTab] = useState<TabKey>("overview");
  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);

  if (isLoading) {
    return <div className="h-[60vh] rounded-2xl border border-line bg-surface animate-pulse" />;
  }

  if (!project) {
    return (
      <EmptyState
        icon={Activity}
        title="案件が見つかりません"
        description="案件一覧から確認できる案件を選択してください。"
        action={<Link href="/projects" className="text-sm font-medium text-brand-600">案件一覧へ戻る</Link>}
      />
    );
  }

  const assignees = project.memberIds
    .map((memberId) => memberMap.get(memberId))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const billingTotal = billing?.[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        <div className="px-5 py-5">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            担当案件へ戻る
          </button>
          <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ backgroundColor: project.color }} />
                <p className="text-sm text-ink-soft">{project.client}</p>
              </div>
              <h1 className="mt-1 text-[28px] leading-tight font-bold text-ink">{project.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {project.phase && <PhaseBadge label={project.phase} />}
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[560px]">
              <MiniMetric label="進捗" value={`${project.progress}%`} />
              <MiniMetric label="次回期限" value={project.nextDue ? formatDue(project.nextDue) : "未設定"} />
              <MiniMetric label="契約金額" value={billingTotal ? compactYen(billingTotal.contractAmount) : "未設定"} />
              <MiniMetric label="担当" value={`${assignees.length}名`} />
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={project.progress} color={project.color} />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-surface-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <Overview projectId={id} />}
      {tab === "tasks" && <TaskTable initialTab="all" projectId={id} />}
      {tab === "gantt" && <GanttChart variant="full" projectId={id} editable height={520} />}
      {tab === "board" && <BoardKanban projectId={id} />}
      {tab === "documents" && <ProjectDocuments projectId={id} />}
      {tab === "files" && <ProjectFiles projectId={id} />}
      {tab === "client" && <ProjectClient clientId={project.clientId ?? null} />}
      {tab === "members" && <ProjectMembers memberIds={project.memberIds} />}
      {tab === "activity" && <ActivityLog projectId={id} />}
    </div>
  );
}

function compactYen(n: number) {
  return `${Math.round(n / 10000).toLocaleString("ja-JP")}万円`;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-app px-3 py-2">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Overview({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <TimeView projectId={projectId} />
      <BillingView projectId={projectId} />
    </div>
  );
}

function ProjectDocuments({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data: docs } = useDocuments();
  const createDoc = useCreateDocument();
  const rows = docs?.filter((doc) => doc.projectId === projectId) ?? [];

  function createMeetingDoc() {
    createDoc.mutate(
      { projectId, template: "meeting", title: "新規議事録" },
      { onSuccess: (doc) => router.push(`/documents/${doc.id}`) },
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h2 className="text-base font-semibold text-ink">案件ドキュメント</h2>
        <button
          type="button"
          onClick={createMeetingDoc}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="size-4" />
          議事録を作成
        </button>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-line">
          {rows.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-muted">
              <span>
                <span className="block text-sm font-medium text-ink">{doc.title}</span>
                <span className="block text-xs text-ink-muted">{doc.template === "meeting" ? "議事録" : "Markdown"} / {formatDue(doc.updatedAt)}</span>
              </span>
              <FileText className="size-4 text-ink-muted" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="案件ドキュメントがありません" description="議事録や提案メモを案件に紐づけて残せます。" />
      )}
    </div>
  );
}

function ProjectFiles({ projectId }: { projectId: string }) {
  const { data: files } = useFiles();
  const rows = files?.filter((file) => file.projectId === projectId) ?? [];
  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h2 className="text-base font-semibold text-ink">案件ファイル</h2>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-line">
          {rows.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <span>
                <span className="block text-sm font-medium text-ink">{file.name}</span>
                <span className="block text-xs text-ink-muted">{formatDue(file.createdAt)}</span>
              </span>
              <Folder className="size-4 text-ink-muted" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Folder} title="案件ファイルがありません" description="提案書、議事録、参考資料をここに集約できます。" />
      )}
    </div>
  );
}

const HEALTH_LABEL: Record<string, { label: string; cls: string }> = {
  good: { label: "良好", cls: "bg-emerald-50 text-emerald-700" },
  watch: { label: "要確認", cls: "bg-orange-50 text-orange-700" },
  risk: { label: "リスク", cls: "bg-red-50 text-red-700" },
};

function ProjectClient({ clientId }: { clientId: string | null }) {
  const { data: client, isLoading } = useClient(clientId ?? "");
  const { data: members } = useMembers();

  if (!clientId) {
    return (
      <EmptyState
        icon={Building2}
        title="クライアントが未設定です"
        description="この案件にはクライアント企業が紐づいていません。"
      />
    );
  }
  if (isLoading) {
    return <div className="h-40 rounded-2xl border border-line bg-surface animate-pulse" />;
  }
  if (!client) {
    return (
      <EmptyState icon={Building2} title="クライアント情報が見つかりません" description="" />
    );
  }

  const owner = members?.find((m) => m.id === client.ownerMemberId);
  const health = HEALTH_LABEL[client.health];

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-ink">{client.name}</h2>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", health.cls)}>
              {health.label}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">{client.industry}</p>
        </div>
        {owner && <Avatar member={owner} size="sm" />}
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold text-ink-muted">担当者連絡先</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {client.contacts.length > 0 ? client.contacts.map((contact) => (
            <div key={contact.id} className="rounded-xl bg-app px-3 py-3">
              <p className="text-sm font-semibold text-ink">{contact.name}</p>
              <p className="text-xs text-ink-muted">{contact.role}</p>
              <div className="mt-2 space-y-1 text-xs text-ink-soft">
                <p className="flex items-center gap-1.5"><Mail className="size-3.5" />{contact.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="size-3.5" />{contact.phone}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-ink-muted">連絡先は未登録です</p>
          )}
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        <p className="text-xs font-semibold text-ink-muted">対応履歴</p>
        <div className="mt-3 space-y-3">
          {client.interactions.length > 0 ? client.interactions.map((item) => (
            <div key={item.id} className="flex gap-3">
              <span className="mt-1 size-2 rounded-full bg-brand-500" />
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">{formatDue(item.date)} / {item.channel}</p>
                <p className="text-sm text-ink-soft">{item.summary}</p>
                {item.nextAction && <p className="mt-1 text-xs font-medium text-brand-600">次: {item.nextAction}</p>}
              </div>
            </div>
          )) : (
            <p className="text-sm text-ink-muted">対応履歴はまだありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectMembers({ memberIds }: { memberIds: string[] }) {
  const { data: members } = useMembers();
  const rows = members?.filter((m) => memberIds.includes(m.id)) ?? [];
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">メンバー</h2>
        <AvatarGroup members={rows} max={6} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((member) => (
          <div key={member.id} className="rounded-xl border border-line bg-app px-4 py-3">
            <p className="font-semibold text-ink">{member.name}</p>
            <p className="text-sm text-ink-muted">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLog({ projectId }: { projectId: string }) {
  const { data: activities } = useProjectActivities(projectId);
  const { data: members } = useMembers();
  const create = useCreateProjectActivity(projectId);
  const [body, setBody] = useState("");
  const memberMap = new Map(members?.map((m) => [m.id, m]));

  function submit() {
    const text = body.trim();
    if (!text) return;
    create.mutate(text);
    setBody("");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h2 className="text-base font-semibold text-ink">コメント / アクティビティ</h2>
      </div>
      <div className="p-5 border-b border-line">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="更新内容、依頼、確認事項を残す"
          className="min-h-24 w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <button
          type="button"
          onClick={submit}
          className="mt-3 inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <MessageSquare className="size-4" />
          コメントを追加
        </button>
      </div>
      <div className="divide-y divide-line">
        {activities?.map((activity) => {
          const actor = memberMap.get(activity.actorMemberId);
          return (
            <div key={activity.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-ink">{actor?.name ?? "不明な担当者"}</p>
                <p className="text-xs text-ink-muted">{new Date(activity.createdAt).toLocaleString("ja-JP")}</p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{activity.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
