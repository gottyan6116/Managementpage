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
  NoteSection,
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
  { id: "p1", name: "新規業務改革プロジェクト", client: "株式会社グローバルホールディングス", color: C.brand, phase: "要件定義", status: "in_progress", priority: "high", progress: 65, startDate: "2025-04-28", endDate: "2025-05-29", nextDue: "2025-05-20", sortOrder: 1, memberIds: ["m-yamada", "m-sato", "m-suzuki"] },
  { id: "p2", name: "CRM導入支援", client: "フューチャーリンク株式会社", color: C.teal, phase: "設計", status: "in_progress", priority: "medium", progress: 45, startDate: "2025-04-28", endDate: "2025-06-02", nextDue: "2025-05-19", sortOrder: 2, memberIds: ["m-sato", "m-yamada", "m-suzuki", "m-tanaka"] },
  { id: "p3", name: "基幹システム刷新", client: "日本テクノ工業株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 30, startDate: "2025-04-28", endDate: "2025-06-20", nextDue: "2025-05-23", sortOrder: 3, memberIds: ["m-yamada", "m-suzuki", "m-tanaka", "m-sato"] },
  { id: "p4", name: "補助金LP改善", client: "クリエイトデザイン合同会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 70, startDate: "2025-04-28", endDate: "2025-05-28", nextDue: "2025-05-21", sortOrder: 4, memberIds: ["m-tanaka", "m-sato", "m-yamada", "m-suzuki"] },
  { id: "p5", name: "社内業務効率化", client: "自社プロジェクト", color: C.sky, phase: "分析", status: "in_progress", priority: "low", progress: 55, startDate: "2025-04-28", endDate: "2025-06-10", nextDue: "2025-05-28", sortOrder: 5, memberIds: ["m-suzuki", "m-tanaka", "m-yamada", "m-sato"] },
  { id: "p6", name: "営業資料リニューアル", client: "株式会社サクセスパートナーズ", color: C.brandLight, phase: "制作", status: "final_check", priority: "medium", progress: 90, startDate: "2025-04-21", endDate: "2025-05-16", nextDue: "2025-05-16", sortOrder: 6, memberIds: ["m-tanaka", "m-sato"] },
  { id: "p7", name: "問い合わせフォーム改善", client: "ビジネスフロンティア株式会社", color: C.teal, phase: "テスト", status: "done", priority: "low", progress: 100, startDate: "2025-04-14", endDate: "2025-05-09", nextDue: "2025-05-09", sortOrder: 7, memberIds: ["m-suzuki"] },
  { id: "p8", name: "ECサイト構築", client: "リテールイノベーション株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 55, startDate: "2025-05-02", endDate: "2025-07-15", nextDue: "2025-05-22", sortOrder: 8, memberIds: ["m-suzuki", "m-tanaka"] },
  { id: "p9", name: "マーケティング分析基盤", client: "データドリブン株式会社", color: C.sky, phase: "構築", status: "in_progress", priority: "medium", progress: 42, startDate: "2025-05-08", endDate: "2025-06-25", nextDue: "2025-05-26", sortOrder: 9, memberIds: ["m-takahashi", "m-yamada"] },
  { id: "p10", name: "採用サイトリニューアル", client: "タレントブリッジ株式会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 68, startDate: "2025-04-30", endDate: "2025-06-05", nextDue: "2025-05-24", sortOrder: 10, memberIds: ["m-tanaka"] },
  { id: "p11", name: "業務マニュアル整備", client: "自社プロジェクト", color: C.teal, phase: "制作", status: "done", priority: "low", progress: 100, startDate: "2025-04-01", endDate: "2025-05-02", nextDue: "2025-05-02", sortOrder: 11, memberIds: ["m-sato"] },
  { id: "p12", name: "セキュリティ監査対応", client: "セーフガードシステムズ株式会社", color: C.brand, phase: "要件定義", status: "on_hold", priority: "high", progress: 30, startDate: "2025-05-10", endDate: "2025-06-18", nextDue: "2025-05-18", sortOrder: 12, memberIds: ["m-yamada", "m-suzuki"] },
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
  // --- p1 新規業務改革プロジェクト (65%) ---
  { id: "t1-1", projectId: "p1", parentTaskId: null, title: "現状分析・要件定義", status: "done", priority: "high", progress: 100, startDate: "2025-04-28", dueDate: "2025-05-02", sortOrder: 1, assigneeIds: ["m-sato"] },
  { id: "t1-2", projectId: "p1", parentTaskId: null, title: "業務フロー設計", status: "in_progress", priority: "high", progress: 80, startDate: "2025-05-05", dueDate: "2025-05-12", sortOrder: 2, assigneeIds: ["m-yamada"] },
  { id: "t1-3", projectId: "p1", parentTaskId: null, title: "要件定義レビュー", status: "done", priority: "high", progress: 100, startDate: "2025-05-15", dueDate: "2025-05-15", sortOrder: 3, assigneeIds: ["m-suzuki"], isMilestone: true },
  { id: "t1-4", projectId: "p1", parentTaskId: null, title: "新業務プロセス設計", status: "in_progress", priority: "medium", progress: 40, startDate: "2025-05-15", dueDate: "2025-05-22", sortOrder: 4, assigneeIds: ["m-tanaka"] },
  { id: "t1-5", projectId: "p1", parentTaskId: null, title: "ユーザートレーニング準備", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-22", dueDate: "2025-05-29", sortOrder: 5, assigneeIds: ["m-yamada"] },

  // --- p2 CRM導入支援 (45%) ---
  { id: "t2-1", projectId: "p2", parentTaskId: null, title: "要件ヒアリング", status: "done", priority: "medium", progress: 100, startDate: "2025-04-28", dueDate: "2025-05-07", sortOrder: 1, assigneeIds: ["m-sato"] },
  { id: "t2-2", projectId: "p2", parentTaskId: null, title: "業務フロー・設計", status: "in_progress", priority: "high", progress: 60, startDate: "2025-05-07", dueDate: "2025-05-16", sortOrder: 2, assigneeIds: ["m-yamada"] },
  { id: "t2-3", projectId: "p2", parentTaskId: null, title: "システム設定・カスタマイズ", status: "in_progress", priority: "medium", progress: 30, startDate: "2025-05-16", dueDate: "2025-05-26", sortOrder: 3, assigneeIds: ["m-suzuki"] },
  { id: "t2-4", projectId: "p2", parentTaskId: null, title: "テスト・ユーザー検証", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-26", dueDate: "2025-05-30", sortOrder: 4, assigneeIds: ["m-tanaka"] },
  { id: "t2-5", projectId: "p2", parentTaskId: null, title: "本番リリース・運用サポート", status: "todo", priority: "high", progress: 0, startDate: "2025-05-30", dueDate: "2025-06-02", sortOrder: 5, assigneeIds: ["m-sato"] },

  // --- p3 基幹システム刷新 (30%) ---
  { id: "t3-1", projectId: "p3", parentTaskId: null, title: "要件定義・RFP作成", status: "done", priority: "high", progress: 100, startDate: "2025-04-28", dueDate: "2025-05-08", sortOrder: 1, assigneeIds: ["m-yamada"] },
  { id: "t3-2", projectId: "p3", parentTaskId: null, title: "ベンダー選定", status: "in_progress", priority: "medium", progress: 60, startDate: "2025-05-08", dueDate: "2025-05-20", sortOrder: 2, assigneeIds: ["m-suzuki"] },
  { id: "t3-3", projectId: "p3", parentTaskId: null, title: "設計・開発", status: "in_progress", priority: "high", progress: 10, startDate: "2025-05-20", dueDate: "2025-06-06", sortOrder: 3, assigneeIds: ["m-tanaka"] },
  { id: "t3-4", projectId: "p3", parentTaskId: null, title: "テスト・受入検証", status: "todo", priority: "medium", progress: 0, startDate: "2025-06-06", dueDate: "2025-06-13", sortOrder: 4, assigneeIds: ["m-sato"] },
  { id: "t3-5", projectId: "p3", parentTaskId: null, title: "移行・本番切替", status: "todo", priority: "high", progress: 0, startDate: "2025-06-13", dueDate: "2025-06-20", sortOrder: 5, assigneeIds: ["m-yamada"] },

  // --- p4 補助金LP改善 (70%) ---
  { id: "t4-1", projectId: "p4", parentTaskId: null, title: "現状分析・改善案策定", status: "done", priority: "medium", progress: 100, startDate: "2025-04-28", dueDate: "2025-05-06", sortOrder: 1, assigneeIds: ["m-tanaka"] },
  { id: "t4-2", projectId: "p4", parentTaskId: null, title: "デザイン制作", status: "in_progress", priority: "high", progress: 90, startDate: "2025-05-06", dueDate: "2025-05-14", sortOrder: 2, assigneeIds: ["m-sato"] },
  { id: "t4-3", projectId: "p4", parentTaskId: null, title: "コーディング・実装", status: "in_progress", priority: "medium", progress: 50, startDate: "2025-05-14", dueDate: "2025-05-23", sortOrder: 3, assigneeIds: ["m-yamada"] },
  { id: "t4-4", projectId: "p4", parentTaskId: null, title: "検証・公開", status: "todo", priority: "medium", progress: 0, startDate: "2025-05-23", dueDate: "2025-05-28", sortOrder: 4, assigneeIds: ["m-suzuki"] },

  // --- p5 社内業務効率化 (55%) ---
  { id: "t5-1", projectId: "p5", parentTaskId: null, title: "課題洗い出し・優先順位付け", status: "done", priority: "medium", progress: 100, startDate: "2025-04-28", dueDate: "2025-05-05", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t5-2", projectId: "p5", parentTaskId: null, title: "ツール選定", status: "in_progress", priority: "medium", progress: 60, startDate: "2025-05-05", dueDate: "2025-05-19", sortOrder: 2, assigneeIds: ["m-tanaka"] },
  { id: "t5-3", projectId: "p5", parentTaskId: null, title: "運用設計・ルール整備", status: "in_progress", priority: "medium", progress: 30, startDate: "2025-05-19", dueDate: "2025-05-30", sortOrder: 3, assigneeIds: ["m-yamada"] },
  { id: "t5-4", projectId: "p5", parentTaskId: null, title: "トレーニング・展開", status: "todo", priority: "low", progress: 0, startDate: "2025-05-30", dueDate: "2025-06-10", sortOrder: 4, assigneeIds: ["m-sato"] },
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
  { id: "ms-1", projectId: "p1", title: "要件定義レビュー", dueDate: "2025-05-16", isDone: false },
  { id: "ms-2", projectId: "p2", title: "業務フロー・設計 完了", dueDate: "2025-05-17", isDone: false },
  { id: "ms-3", projectId: "p3", title: "設計・開発 フェーズ完了", dueDate: "2025-05-20", isDone: false },
  { id: "ms-4", projectId: "p4", title: "コーディング・実装 完了", dueDate: "2025-05-23", isDone: false },
  { id: "ms-5", projectId: "p2", title: "テスト・ユーザー検証 開始", dueDate: "2025-05-30", isDone: false },
];

/* ===== ガント依存関係 (各プロジェクトの順次依存) ===== */
export const dependencies: TaskDependency[] = [
  { id: "d1-1", predecessorId: "t1-1", successorId: "t1-2" },
  { id: "d1-2", predecessorId: "t1-2", successorId: "t1-4" },
  { id: "d1-3", predecessorId: "t1-4", successorId: "t1-5" },
  { id: "d2-1", predecessorId: "t2-1", successorId: "t2-2" },
  { id: "d2-2", predecessorId: "t2-2", successorId: "t2-3" },
  { id: "d2-3", predecessorId: "t2-3", successorId: "t2-4" },
  { id: "d2-4", predecessorId: "t2-4", successorId: "t2-5" },
  { id: "d3-1", predecessorId: "t3-1", successorId: "t3-2" },
  { id: "d3-2", predecessorId: "t3-2", successorId: "t3-3" },
  { id: "d3-3", predecessorId: "t3-3", successorId: "t3-4" },
  { id: "d3-4", predecessorId: "t3-4", successorId: "t3-5" },
  { id: "d4-1", predecessorId: "t4-1", successorId: "t4-2" },
  { id: "d4-2", predecessorId: "t4-2", successorId: "t4-3" },
  { id: "d4-3", predecessorId: "t4-3", successorId: "t4-4" },
  { id: "d5-1", predecessorId: "t5-1", successorId: "t5-2" },
  { id: "d5-2", predecessorId: "t5-2", successorId: "t5-3" },
  { id: "d5-3", predecessorId: "t5-3", successorId: "t5-4" },
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

/* ===== メモ: セクション (OneNote 風) ===== */
export const noteSections: NoteSection[] = [
  { id: "sec-work", name: "業務メモ", color: "#7719AA" },
  { id: "sec-ideas", name: "アイデア", color: "#107C41" },
  { id: "sec-clients", name: "クライアント", color: "#0F6CBD" },
  { id: "sec-personal", name: "個人", color: "#CA5010" },
];

/* ===== メモ (ページ) ===== */
export const notes: Note[] = [
  { id: "note1", sectionId: "sec-work", title: "今週やること", body: "・要件定義レビュー準備\n・CRM提案書を仕上げる\n・請求書を送付\n\n優先度高: 要件定義レビュー（5/16）", color: "#FEF3C7", isPinned: true, updatedAt: "2025-05-16" },
  { id: "note5", sectionId: "sec-work", title: "請求まわり", body: "5月分の請求は月末締め。\n完了案件として計上する案件を整理する。", color: "#F1F5F9", isPinned: false, updatedAt: "2025-05-12" },
  { id: "note3", sectionId: "sec-ideas", title: "改善アイデア", body: "ダッシュボードに稼働率の推移グラフを追加したい。\n\n・週次の稼働率トレンド\n・メンバー別の負荷ヒートマップ", color: "#DCFCE7", isPinned: false, updatedAt: "2025-05-14" },
  { id: "note4", sectionId: "sec-ideas", title: "リサーチメモ", body: "競合のガント実装が分かりやすい。後で調査する。\nドラッグ編集とクリティカルパス表示が参考になりそう。", color: "#FCE7F3", isPinned: false, updatedAt: "2025-05-13" },
  { id: "note2", sectionId: "sec-clients", title: "グローバルHD 連絡メモ", body: "次回MTGは5/22（木）14:00。\n資料は前日までに共有すること。\n窓口: 経営企画部 田中様", color: "#DBEAFE", isPinned: true, updatedAt: "2025-05-15" },
  { id: "note6", sectionId: "sec-clients", title: "採用サイト案件", body: "トップのキービジュアルは田中さんが5/24までに準備。\n初稿レビューはオンラインで。", color: "#FFEDD5", isPinned: false, updatedAt: "2025-05-11" },
  { id: "note7", sectionId: "sec-personal", title: "読みたい本・記事", body: "・プロジェクトマネジメントの教科書\n・SaaS グロースの記事まとめ", color: "#FEF9C3", isPinned: false, updatedAt: "2025-05-10" },
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
