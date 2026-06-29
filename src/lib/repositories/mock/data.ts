/**
 * フェーズ1 用ダミーデータ (docs/03 §7・docs/04)。
 * スクリーンショット (2025/05 基準) に寄せたデモデータ。
 * フェーズ2で Supabase 実装へ差し替えても、UI 側のインターフェイスは不変。
 */
import type {
  ActionItem,
  AppNotification,
  BoardColumn,
  DashboardKpi,
  DocumentItem,
  FileItem,
  Member,
  Milestone,
  Note,
  Project,
  Task,
  TaskDependency,
} from "@/types/domain";

/* ===== 色トークン (docs/02 §2) ===== */
const C = {
  brand: "#2563EB",
  brandLight: "#3B82F6",
  teal: "#14B8A6",
  purple: "#8B5CF6",
  orange: "#F59E0B",
  sky: "#38BDF8",
} as const;

/* ===== メンバー (担当者マスタ) ===== */
export const members: Member[] = [
  { id: "m-yamada", name: "山田 太郎", role: "コンサルタント", avatarUrl: null, color: C.brand, isSelf: true },
  { id: "m-sato", name: "佐藤 花子", role: "シニアコンサルタント", avatarUrl: null, color: C.teal, isSelf: false },
  { id: "m-suzuki", name: "鈴木 一郎", role: "エンジニア", avatarUrl: null, color: C.purple, isSelf: false },
  { id: "m-tanaka", name: "田中 美咲", role: "デザイナー", avatarUrl: null, color: C.orange, isSelf: false },
  { id: "m-takahashi", name: "高橋 健", role: "データアナリスト", avatarUrl: null, color: C.sky, isSelf: false },
];

/* ===== プロジェクト (12件: 進行中8/最終確認1/完了2/保留1) ===== */
export const projects: Project[] = [
  { id: "p1", name: "新規業務改革プロジェクト", client: "株式会社グローバルホールディングス", color: C.brand, phase: "要件定義", status: "in_progress", priority: "high", progress: 72, startDate: "2025-05-07", endDate: "2025-06-20", nextDue: "2025-05-20", sortOrder: 1, memberIds: ["m-yamada", "m-sato", "m-suzuki"] },
  { id: "p2", name: "CRM導入支援", client: "フューチャーリンク株式会社", color: C.teal, phase: "設計", status: "in_progress", priority: "medium", progress: 45, startDate: "2025-05-12", endDate: "2025-06-30", nextDue: "2025-05-19", sortOrder: 2, memberIds: ["m-sato", "m-tanaka"] },
  { id: "p3", name: "基幹システム刷新", client: "日本テクノ工業株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 38, startDate: "2025-04-28", endDate: "2025-07-31", nextDue: "2025-05-23", sortOrder: 3, memberIds: ["m-yamada", "m-suzuki", "m-takahashi"] },
  { id: "p4", name: "補助金LP改善", client: "クリエイトデザイン合同会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 60, startDate: "2025-05-05", endDate: "2025-05-30", nextDue: "2025-05-21", sortOrder: 4, memberIds: ["m-tanaka"] },
  { id: "p5", name: "社内業務効率化", client: "自社プロジェクト", color: C.sky, phase: "分析", status: "on_hold", priority: "low", progress: 25, startDate: "2025-05-01", endDate: "2025-06-15", nextDue: "2025-05-28", sortOrder: 5, memberIds: ["m-yamada", "m-takahashi"] },
  { id: "p6", name: "営業資料リニューアル", client: "株式会社サクセスパートナーズ", color: C.brandLight, phase: "制作", status: "final_check", priority: "medium", progress: 90, startDate: "2025-04-21", endDate: "2025-05-16", nextDue: "2025-05-16", sortOrder: 6, memberIds: ["m-tanaka", "m-sato"] },
  { id: "p7", name: "問い合わせフォーム改善", client: "ビジネスフロンティア株式会社", color: C.teal, phase: "テスト", status: "done", priority: "low", progress: 100, startDate: "2025-04-14", endDate: "2025-05-09", nextDue: "2025-05-09", sortOrder: 7, memberIds: ["m-suzuki"] },
  { id: "p8", name: "ECサイト構築", client: "リテールイノベーション株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 55, startDate: "2025-05-02", endDate: "2025-07-15", nextDue: "2025-05-22", sortOrder: 8, memberIds: ["m-suzuki", "m-tanaka"] },
  { id: "p9", name: "マーケティング分析基盤", client: "データドリブン株式会社", color: C.sky, phase: "構築", status: "in_progress", priority: "medium", progress: 42, startDate: "2025-05-08", endDate: "2025-06-25", nextDue: "2025-05-26", sortOrder: 9, memberIds: ["m-takahashi", "m-yamada"] },
  { id: "p10", name: "採用サイトリニューアル", client: "タレントブリッジ株式会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 68, startDate: "2025-04-30", endDate: "2025-06-05", nextDue: "2025-05-24", sortOrder: 10, memberIds: ["m-tanaka"] },
  { id: "p11", name: "業務マニュアル整備", client: "自社プロジェクト", color: C.teal, phase: "制作", status: "done", priority: "low", progress: 100, startDate: "2025-04-01", endDate: "2025-05-02", nextDue: "2025-05-02", sortOrder: 11, memberIds: ["m-sato"] },
  { id: "p12", name: "セキュリティ監査対応", client: "セーフガードシステムズ株式会社", color: C.brand, phase: "要件定義", status: "in_progress", priority: "high", progress: 30, startDate: "2025-05-10", endDate: "2025-06-18", nextDue: "2025-05-18", sortOrder: 12, memberIds: ["m-yamada", "m-suzuki"] },
];

/* ===== ボード列 ===== */
export const boardColumns: BoardColumn[] = [
  { id: "col-todo", name: "未着手", position: 0 },
  { id: "col-doing", name: "進行中", position: 1 },
  { id: "col-done", name: "完了", position: 2 },
];

const colOf = (status: Task["status"]): string =>
  status === "done" ? "col-done" : status === "in_progress" ? "col-doing" : "col-todo";

/* ===== タスク ===== */
type TaskSeed = Omit<Task, "boardColumnId" | "boardPosition" | "isMilestone"> &
  Partial<Pick<Task, "isMilestone">>;

const seed: TaskSeed[] = [
  // --- p1 新規業務改革 ---
  { id: "t1-4", projectId: "p1", parentTaskId: null, title: "ステークホルダーヒアリング", status: "done", priority: "medium", progress: 100, startDate: "2025-05-07", dueDate: "2025-05-12", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t1-1", projectId: "p1", parentTaskId: null, title: "要件定義書作成", status: "in_progress", priority: "high", progress: 65, startDate: "2025-05-12", dueDate: "2025-05-16", sortOrder: 2, assigneeIds: ["m-yamada"] },
  { id: "t1-2", projectId: "p1", parentTaskId: null, title: "業務フロー分析", status: "in_progress", priority: "medium", progress: 50, startDate: "2025-05-12", dueDate: "2025-05-19", sortOrder: 3, assigneeIds: ["m-sato"] },
  { id: "t1-3", projectId: "p1", parentTaskId: null, title: "提案書ドラフト提出", status: "todo", priority: "high", progress: 0, startDate: "2025-05-19", dueDate: "2025-05-23", sortOrder: 4, assigneeIds: ["m-yamada"] },
  { id: "t1-m", projectId: "p1", parentTaskId: null, title: "要件定義レビュー", status: "todo", priority: "high", progress: 0, startDate: "2025-05-20", dueDate: "2025-05-20", sortOrder: 5, assigneeIds: ["m-yamada"], isMilestone: true },

  // --- p2 CRM導入支援 ---
  { id: "t2-1", projectId: "p2", parentTaskId: null, title: "現状システム調査", status: "done", priority: "medium", progress: 100, startDate: "2025-05-12", dueDate: "2025-05-15", sortOrder: 1, assigneeIds: ["m-sato"] },
  { id: "t2-2", projectId: "p2", parentTaskId: null, title: "提案書ドラフト提出", status: "in_progress", priority: "high", progress: 40, startDate: "2025-05-15", dueDate: "2025-05-19", sortOrder: 2, assigneeIds: ["m-sato"] },
  { id: "t2-3", projectId: "p2", parentTaskId: null, title: "基本設計書作成", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-19", dueDate: "2025-05-27", sortOrder: 3, assigneeIds: ["m-tanaka"] },
  { id: "t2-m", projectId: "p2", parentTaskId: null, title: "設計レビュー", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-28", dueDate: "2025-05-28", sortOrder: 4, assigneeIds: ["m-sato"], isMilestone: true },

  // --- p3 基幹システム刷新 ---
  { id: "t3-1", projectId: "p3", parentTaskId: null, title: "DB設計", status: "in_progress", priority: "high", progress: 55, startDate: "2025-05-05", dueDate: "2025-05-23", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t3-2", projectId: "p3", parentTaskId: null, title: "API実装", status: "todo", priority: "high", progress: 0, startDate: "2025-05-23", dueDate: "2025-06-10", sortOrder: 2, assigneeIds: ["m-takahashi"] },
  { id: "t3-3", projectId: "p3", parentTaskId: null, title: "移行計画策定", status: "in_progress", priority: "medium", progress: 30, startDate: "2025-05-12", dueDate: "2025-05-21", sortOrder: 3, assigneeIds: ["m-yamada"] },

  // --- p4 補助金LP改善 ---
  { id: "t4-1", projectId: "p4", parentTaskId: null, title: "デザインカンプ作成", status: "in_progress", priority: "medium", progress: 70, startDate: "2025-05-07", dueDate: "2025-05-21", sortOrder: 1, assigneeIds: ["m-tanaka"] },
  { id: "t4-2", projectId: "p4", parentTaskId: null, title: "コーディング", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-21", dueDate: "2025-05-29", sortOrder: 2, assigneeIds: ["m-suzuki"] },

  // --- p6 営業資料リニューアル ---
  { id: "t6-1", projectId: "p6", parentTaskId: null, title: "最終校正", status: "in_progress", priority: "medium", progress: 90, startDate: "2025-05-12", dueDate: "2025-05-16", sortOrder: 1, assigneeIds: ["m-tanaka"] },
  { id: "t6-2", projectId: "p6", parentTaskId: null, title: "クライアント確認", status: "todo", priority: "high", progress: 0, startDate: "2025-05-16", dueDate: "2025-05-19", sortOrder: 2, assigneeIds: ["m-sato"] },

  // --- p7 問い合わせフォーム改善 (完了) ---
  { id: "t7-1", projectId: "p7", parentTaskId: null, title: "受け入れテスト", status: "done", priority: "low", progress: 100, startDate: "2025-05-01", dueDate: "2025-05-09", sortOrder: 1, assigneeIds: ["m-suzuki"] },

  // --- p8 ECサイト構築 ---
  { id: "t8-1", projectId: "p8", parentTaskId: null, title: "カート機能実装", status: "in_progress", priority: "high", progress: 60, startDate: "2025-05-08", dueDate: "2025-05-22", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t8-2", projectId: "p8", parentTaskId: null, title: "決済連携", status: "todo", priority: "high", progress: 0, startDate: "2025-05-22", dueDate: "2025-06-06", sortOrder: 2, assigneeIds: ["m-suzuki"] },
  { id: "t8-3", projectId: "p8", parentTaskId: null, title: "商品ページデザイン", status: "in_progress", priority: "medium", progress: 45, startDate: "2025-05-10", dueDate: "2025-05-20", sortOrder: 3, assigneeIds: ["m-tanaka"] },

  // --- p9 マーケティング分析基盤 ---
  { id: "t9-1", projectId: "p9", parentTaskId: null, title: "データ連携設計", status: "in_progress", priority: "medium", progress: 50, startDate: "2025-05-08", dueDate: "2025-05-26", sortOrder: 1, assigneeIds: ["m-takahashi"] },

  // --- p10 採用サイトリニューアル ---
  { id: "t10-1", projectId: "p10", parentTaskId: null, title: "ワイヤーフレーム作成", status: "done", priority: "medium", progress: 100, startDate: "2025-04-30", dueDate: "2025-05-10", sortOrder: 1, assigneeIds: ["m-tanaka"] },
  { id: "t10-2", projectId: "p10", parentTaskId: null, title: "トップページ制作", status: "in_progress", priority: "medium", progress: 55, startDate: "2025-05-10", dueDate: "2025-05-24", sortOrder: 2, assigneeIds: ["m-tanaka"] },

  // --- p12 セキュリティ監査対応 ---
  { id: "t12-1", projectId: "p12", parentTaskId: null, title: "脆弱性診断", status: "in_progress", priority: "high", progress: 35, startDate: "2025-05-10", dueDate: "2025-05-18", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t12-2", projectId: "p12", parentTaskId: null, title: "対応方針ドキュメント作成", status: "todo", priority: "high", progress: 0, startDate: "2025-05-18", dueDate: "2025-05-30", sortOrder: 2, assigneeIds: ["m-yamada"] },
];

export const tasks: Task[] = seed.map((t, i) => ({
  ...t,
  isMilestone: t.isMilestone ?? false,
  boardColumnId: colOf(t.status),
  boardPosition: i,
}));

/* ===== タスク担当者 (多対多) は Task.assigneeIds に内包 ===== */

/* ===== マイルストーン ===== */
export const milestones: Milestone[] = [
  { id: "ms-1", projectId: "p1", title: "要件定義レビュー", dueDate: "2025-05-20", isDone: false },
  { id: "ms-2", projectId: "p2", title: "設計レビュー", dueDate: "2025-05-28", isDone: false },
  { id: "ms-3", projectId: "p6", title: "納品", dueDate: "2025-05-16", isDone: false },
  { id: "ms-4", projectId: "p3", title: "開発フェーズ開始", dueDate: "2025-05-23", isDone: false },
  { id: "ms-5", projectId: "p8", title: "α版リリース", dueDate: "2025-05-22", isDone: false },
  { id: "ms-6", projectId: "p12", title: "監査報告書提出", dueDate: "2025-05-30", isDone: false },
];

/* ===== ガント依存関係 ===== */
export const dependencies: TaskDependency[] = [
  { id: "d1", predecessorId: "t1-4", successorId: "t1-1" },
  { id: "d2", predecessorId: "t1-1", successorId: "t1-3" },
  { id: "d3", predecessorId: "t2-1", successorId: "t2-2" },
  { id: "d4", predecessorId: "t2-2", successorId: "t2-3" },
  { id: "d5", predecessorId: "t3-1", successorId: "t3-2" },
  { id: "d6", predecessorId: "t8-1", successorId: "t8-2" },
  { id: "d7", predecessorId: "t12-1", successorId: "t12-2" },
];

/* ===== 今週のアクション ===== */
export const actions: ActionItem[] = [
  { id: "a1", projectId: "p2", title: "CRM導入支援の設計レビュー準備", dueDate: "2025-05-19", isDone: false },
  { id: "a2", projectId: "p1", title: "要件定義書を顧客へ共有", dueDate: "2025-05-16", isDone: true },
  { id: "a3", projectId: "p6", title: "営業資料の最終確認依頼", dueDate: "2025-05-16", isDone: false },
  { id: "a4", projectId: "p8", title: "決済代行業者と打ち合わせ", dueDate: "2025-05-20", isDone: false },
  { id: "a5", projectId: "p3", title: "DB設計レビューのMTG設定", dueDate: "2025-05-21", isDone: false },
];

/* ===== 通知 ===== */
export const notifications: AppNotification[] = [
  { id: "n1", type: "overdue", title: "期限超過のタスクがあります", body: "「最終校正」の期限が過ぎています", link: "/todo", isRead: false, createdAt: "2025-05-16T09:00:00+09:00" },
  { id: "n2", type: "due_soon", title: "本日が期限のタスク", body: "「要件定義書作成」は本日が期限です", link: "/todo", isRead: false, createdAt: "2025-05-16T08:30:00+09:00" },
  { id: "n3", type: "due_soon", title: "マイルストーン接近", body: "「要件定義レビュー」が4日後に予定されています", link: "/gantt", isRead: false, createdAt: "2025-05-16T08:00:00+09:00" },
];

/* ===== ダッシュボード KPI (デモ固定値: テーブルはページングされる前提) ===== */
export const dashboardKpi: DashboardKpi = {
  activeProjects: 12,
  totalTasks: 120,
  doneTasks: 86,
  overdueTasks: 2,
};

/* ===== ドキュメント ===== */
export const documents: DocumentItem[] = [
  {
    id: "doc1",
    projectId: "p1",
    title: "要件定義書 v2",
    updatedAt: "2025-05-15",
    body: "# 要件定義書\n\n## 1. 目的\n新規業務改革プロジェクトにおける業務要件を整理する。\n\n## 2. スコープ\n- 受発注管理の刷新\n- 在庫管理の自動化\n\n## 3. 非機能要件\n- 同時接続 200 ユーザー\n- 99.5% の可用性",
  },
  {
    id: "doc2",
    projectId: "p1",
    title: "キックオフ議事録",
    updatedAt: "2025-05-08",
    body: "# キックオフ議事録\n\n- 日時: 2025/05/08 10:00-11:30\n- 参加者: 山田、佐藤、鈴木\n\n## 決定事項\n1. 週次定例は毎週月曜 10:00\n2. 要件定義は 5/20 までに完了",
  },
  {
    id: "doc3",
    projectId: "p2",
    title: "CRM導入 提案書",
    updatedAt: "2025-05-14",
    body: "# CRM導入支援 提案書\n\n## 現状課題\n顧客情報が部署ごとに分散している。\n\n## 提案\nSalesforce をベースにした統合 CRM を構築。",
  },
  {
    id: "doc4",
    projectId: "p3",
    title: "基幹システム 設計方針",
    updatedAt: "2025-05-13",
    body: "# 設計方針\n\n## アーキテクチャ\n- マイクロサービス\n- イベント駆動\n\n## DB\nPostgreSQL + Redis キャッシュ",
  },
  {
    id: "doc5",
    projectId: "p4",
    title: "LP改善 ガイドライン",
    updatedAt: "2025-05-11",
    body: "# 補助金LP改善ガイドライン\n\n- ファーストビューに CTA を配置\n- フォーム項目は 5 つ以内\n- モバイル最適化を優先",
  },
  {
    id: "doc6",
    projectId: "p11",
    title: "運用マニュアル",
    updatedAt: "2025-05-02",
    body: "# 運用マニュアル\n\n## 日次作業\n1. バックアップ確認\n2. エラーログ確認\n\n## 障害対応フロー\n担当者へ即時エスカレーション。",
  },
];

/* ===== ファイル ===== */
export const files: FileItem[] = [
  { id: "f1", projectId: "p1", name: "要件定義書_v2.pdf", mimeType: "application/pdf", sizeBytes: 2_415_000, createdAt: "2025-05-15" },
  { id: "f2", projectId: "p2", name: "CRM提案資料.pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", sizeBytes: 5_820_000, createdAt: "2025-05-14" },
  { id: "f3", projectId: "p4", name: "ワイヤーフレーム.fig", mimeType: "application/octet-stream", sizeBytes: 1_240_000, createdAt: "2025-05-12" },
  { id: "f4", projectId: "p3", name: "画面設計書.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 880_000, createdAt: "2025-05-13" },
  { id: "f5", projectId: "p6", name: "ロゴ_最終版.png", mimeType: "image/png", sizeBytes: 320_000, createdAt: "2025-05-10" },
  { id: "f6", projectId: "p1", name: "キックオフ議事録.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 145_000, createdAt: "2025-05-08" },
  { id: "f7", projectId: "p8", name: "API仕様書.pdf", mimeType: "application/pdf", sizeBytes: 1_690_000, createdAt: "2025-05-11" },
  { id: "f8", projectId: "p4", name: "デザインカンプ.png", mimeType: "image/png", sizeBytes: 4_100_000, createdAt: "2025-05-09" },
];

/* ===== メモ ===== */
export const notes: Note[] = [
  { id: "note1", title: "今週やること", body: "・要件定義レビュー準備\n・CRM提案書を仕上げる\n・請求書を送付", color: "#FEF3C7", isPinned: true, updatedAt: "2025-05-16" },
  { id: "note2", title: "クライアント連絡メモ", body: "グローバルHD様：次回MTGは5/22。資料は前日までに共有。", color: "#DBEAFE", isPinned: true, updatedAt: "2025-05-15" },
  { id: "note3", title: "改善アイデア", body: "ダッシュボードに稼働率の推移グラフを追加したい。", color: "#DCFCE7", isPinned: false, updatedAt: "2025-05-14" },
  { id: "note4", title: null, body: "参考: 競合のガント実装が分かりやすい。後で調査。", color: "#FCE7F3", isPinned: false, updatedAt: "2025-05-13" },
  { id: "note5", title: "請求まわり", body: "5月分の請求は月末締め。p6とp7は完了案件として計上。", color: "#F1F5F9", isPinned: false, updatedAt: "2025-05-12" },
  { id: "note6", title: "採用サイト", body: "トップのキービジュアルは田中さんが5/24までに。", color: "#FFEDD5", isPinned: false, updatedAt: "2025-05-11" },
];

/** KPI のスパークライン用ダミー系列 */
export const kpiSeries = {
  projectsTrend: [8, 9, 9, 10, 10, 11, 12],
  weeklyTasks: [4, 6, 3, 5, 2, 1, 0],
  monthlyDue: [5, 8, 6, 4, 7, 9, 6, 3],
  projectsCountTrend: [10, 10, 11, 11, 12, 12],
  atRiskTrend: [4, 3, 3, 2, 3, 2],
  completeSoonTrend: [1, 2, 2, 3, 2, 3],
};
