/**
 * フェーズ1 用ダミーデータ (docs/03 §7・docs/04)。
 * 現在日付 (2026/07/02 基準) に寄せたデモデータ。
 * フェーズ2で Supabase 実装へ差し替えても、UI 側のインターフェイスは不変。
 */
import type {
  ActionItem,
  AppNotification,
  BoardColumn,
  BillingRecord,
  ClientCompany,
  DocumentItem,
  FileItem,
  IssueBoard,
  IssueNode,
  Member,
  Milestone,
  Note,
  NoteSection,
  Project,
  ProjectActivity,
  Task,
  TaskDependency,
  TimeEntry,
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
  { id: "m-yamada", name: "後藤 孝", role: "コンサルタント", avatarUrl: null, color: C.brand, isSelf: true },
  { id: "m-sato", name: "佐藤 花子", role: "シニアコンサルタント", avatarUrl: null, color: C.teal, isSelf: false },
  { id: "m-suzuki", name: "鈴木 一郎", role: "エンジニア", avatarUrl: null, color: C.purple, isSelf: false },
  { id: "m-tanaka", name: "田中 美咲", role: "デザイナー", avatarUrl: null, color: C.orange, isSelf: false },
  { id: "m-takahashi", name: "高橋 健", role: "データアナリスト", avatarUrl: null, color: C.sky, isSelf: false },
];

/* ===== プロジェクト (12件: 進行中8/最終確認1/完了2/保留1) ===== */
export const projects: Project[] = [
  { id: "p1", name: "新規業務改革プロジェクト", clientId: "c1", client: "株式会社グローバルホールディングス", color: C.brand, phase: "要件定義", status: "in_progress", priority: "high", progress: 65, startDate: "2026-06-28", endDate: "2026-07-29", nextDue: "2026-07-20", sortOrder: 1, memberIds: ["m-yamada", "m-sato", "m-suzuki"] },
  { id: "p2", name: "CRM導入支援", clientId: "c2", client: "フューチャーリンク株式会社", color: C.teal, phase: "設計", status: "in_progress", priority: "medium", progress: 45, startDate: "2026-06-28", endDate: "2026-08-02", nextDue: "2026-07-19", sortOrder: 2, memberIds: ["m-sato", "m-yamada", "m-suzuki", "m-tanaka"] },
  { id: "p3", name: "基幹システム刷新", clientId: "c3", client: "日本テクノ工業株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 30, startDate: "2026-06-28", endDate: "2026-08-20", nextDue: "2026-07-23", sortOrder: 3, memberIds: ["m-yamada", "m-suzuki", "m-tanaka", "m-sato"] },
  { id: "p4", name: "補助金LP改善", clientId: "c4", client: "クリエイトデザイン合同会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 70, startDate: "2026-06-28", endDate: "2026-07-28", nextDue: "2026-07-21", sortOrder: 4, memberIds: ["m-tanaka", "m-sato", "m-yamada", "m-suzuki"] },
  { id: "p5", name: "社内業務効率化", clientId: null, client: "自社プロジェクト", color: C.sky, phase: "分析", status: "in_progress", priority: "low", progress: 55, startDate: "2026-06-28", endDate: "2026-08-10", nextDue: "2026-07-28", sortOrder: 5, memberIds: ["m-suzuki", "m-tanaka", "m-yamada", "m-sato"] },
  { id: "p6", name: "営業資料リニューアル", clientId: "c5", client: "株式会社サクセスパートナーズ", color: C.brandLight, phase: "制作", status: "final_check", priority: "medium", progress: 90, startDate: "2026-06-21", endDate: "2026-07-16", nextDue: "2026-07-16", sortOrder: 6, memberIds: ["m-tanaka", "m-sato"] },
  { id: "p7", name: "問い合わせフォーム改善", clientId: "c6", client: "ビジネスフロンティア株式会社", color: C.teal, phase: "テスト", status: "done", priority: "low", progress: 100, startDate: "2026-06-14", endDate: "2026-07-09", nextDue: "2026-07-09", sortOrder: 7, memberIds: ["m-suzuki"] },
  { id: "p8", name: "ECサイト構築", clientId: "c7", client: "リテールイノベーション株式会社", color: C.purple, phase: "開発", status: "in_progress", priority: "high", progress: 55, startDate: "2026-07-02", endDate: "2026-09-15", nextDue: "2026-07-22", sortOrder: 8, memberIds: ["m-suzuki", "m-tanaka"] },
  { id: "p9", name: "マーケティング分析基盤", clientId: "c8", client: "データドリブン株式会社", color: C.sky, phase: "構築", status: "in_progress", priority: "medium", progress: 42, startDate: "2026-07-08", endDate: "2026-08-25", nextDue: "2026-07-26", sortOrder: 9, memberIds: ["m-takahashi", "m-yamada"] },
  { id: "p10", name: "採用サイトリニューアル", clientId: "c9", client: "タレントブリッジ株式会社", color: C.orange, phase: "制作", status: "in_progress", priority: "medium", progress: 68, startDate: "2026-06-30", endDate: "2026-08-05", nextDue: "2026-07-24", sortOrder: 10, memberIds: ["m-tanaka"] },
  { id: "p11", name: "業務マニュアル整備", clientId: null, client: "自社プロジェクト", color: C.teal, phase: "制作", status: "done", priority: "low", progress: 100, startDate: "2026-06-01", endDate: "2026-07-02", nextDue: "2026-07-02", sortOrder: 11, memberIds: ["m-sato"] },
  { id: "p12", name: "セキュリティ監査対応", clientId: "c10", client: "セーフガードシステムズ株式会社", color: C.brand, phase: "要件定義", status: "on_hold", priority: "high", progress: 30, startDate: "2026-07-10", endDate: "2026-08-18", nextDue: "2026-07-18", sortOrder: 12, memberIds: ["m-yamada", "m-suzuki"] },
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
  { id: "t1-1", projectId: "p1", parentTaskId: null, title: "現状分析・要件定義", status: "done", priority: "high", progress: 100, startDate: "2026-06-28", dueDate: "2026-07-02", sortOrder: 1, assigneeIds: ["m-sato"] },
  { id: "t1-2", projectId: "p1", parentTaskId: null, title: "業務フロー設計", status: "in_progress", priority: "high", progress: 80, startDate: "2026-06-30", dueDate: "2026-07-12", sortOrder: 2, assigneeIds: ["m-yamada"] },
  { id: "t1-3", projectId: "p1", parentTaskId: null, title: "要件定義レビュー", status: "todo", priority: "high", progress: 0, startDate: "2026-07-15", dueDate: "2026-07-15", sortOrder: 3, assigneeIds: ["m-suzuki"], isMilestone: true },
  { id: "t1-4", projectId: "p1", parentTaskId: null, title: "新業務プロセス設計", status: "in_progress", priority: "medium", progress: 40, startDate: "2026-07-15", dueDate: "2026-07-22", sortOrder: 4, assigneeIds: ["m-tanaka"] },
  { id: "t1-5", projectId: "p1", parentTaskId: null, title: "ユーザートレーニング準備", status: "todo", priority: "medium", progress: 0, startDate: "2026-07-22", dueDate: "2026-08-06", sortOrder: 5, assigneeIds: ["m-yamada"] },

  // --- p2 CRM導入支援 (45%) ---
  { id: "t2-1", projectId: "p2", parentTaskId: null, title: "要件ヒアリング", status: "done", priority: "medium", progress: 100, startDate: "2026-06-28", dueDate: "2026-07-07", sortOrder: 1, assigneeIds: ["m-sato"] },
  { id: "t2-2", projectId: "p2", parentTaskId: null, title: "CRM業務フロー設計", status: "in_progress", priority: "high", progress: 60, startDate: "2026-07-01", dueDate: "2026-07-16", sortOrder: 2, assigneeIds: ["m-yamada"] },
  { id: "t2-3", projectId: "p2", parentTaskId: null, title: "システム設定・カスタマイズ", status: "todo", priority: "medium", progress: 0, startDate: "2026-07-16", dueDate: "2026-07-26", sortOrder: 3, assigneeIds: ["m-suzuki"] },
  { id: "t2-4", projectId: "p2", parentTaskId: null, title: "テスト・ユーザー検証", status: "todo", priority: "medium", progress: 0, startDate: "2026-07-26", dueDate: "2026-07-30", sortOrder: 4, assigneeIds: ["m-tanaka"] },
  { id: "t2-5", projectId: "p2", parentTaskId: null, title: "本番リリース・運用サポート", status: "todo", priority: "high", progress: 0, startDate: "2026-07-30", dueDate: "2026-08-02", sortOrder: 5, assigneeIds: ["m-sato"] },

  // --- p3 基幹システム刷新 (30%) ---
  { id: "t3-1", projectId: "p3", parentTaskId: null, title: "要件定義・RFP作成", status: "done", priority: "high", progress: 100, startDate: "2026-06-28", dueDate: "2026-07-08", sortOrder: 1, assigneeIds: ["m-yamada"] },
  { id: "t3-2", projectId: "p3", parentTaskId: null, title: "ベンダー選定", status: "in_progress", priority: "medium", progress: 60, startDate: "2026-07-08", dueDate: "2026-07-20", sortOrder: 2, assigneeIds: ["m-suzuki"] },
  { id: "t3-3", projectId: "p3", parentTaskId: null, title: "設計・開発", status: "todo", priority: "high", progress: 0, startDate: "2026-07-20", dueDate: "2026-08-06", sortOrder: 3, assigneeIds: ["m-tanaka"] },
  { id: "t3-4", projectId: "p3", parentTaskId: null, title: "テスト・受入検証", status: "todo", priority: "medium", progress: 0, startDate: "2026-08-06", dueDate: "2026-08-13", sortOrder: 4, assigneeIds: ["m-sato"] },
  { id: "t3-5", projectId: "p3", parentTaskId: null, title: "移行・本番切替", status: "todo", priority: "high", progress: 0, startDate: "2026-08-13", dueDate: "2026-08-20", sortOrder: 5, assigneeIds: ["m-yamada"] },

  // --- p4 補助金LP改善 (70%) ---
  { id: "t4-1", projectId: "p4", parentTaskId: null, title: "現状分析・改善案策定", status: "done", priority: "medium", progress: 100, startDate: "2026-06-28", dueDate: "2026-07-06", sortOrder: 1, assigneeIds: ["m-tanaka"] },
  { id: "t4-2", projectId: "p4", parentTaskId: null, title: "デザイン制作", status: "in_progress", priority: "high", progress: 90, startDate: "2026-07-06", dueDate: "2026-07-14", sortOrder: 2, assigneeIds: ["m-sato"] },
  { id: "t4-3", projectId: "p4", parentTaskId: null, title: "コーディング・実装", status: "in_progress", priority: "medium", progress: 50, startDate: "2026-07-14", dueDate: "2026-07-23", sortOrder: 3, assigneeIds: ["m-yamada"] },
  { id: "t4-4", projectId: "p4", parentTaskId: null, title: "検証・公開", status: "todo", priority: "medium", progress: 0, startDate: "2026-07-23", dueDate: "2026-07-28", sortOrder: 4, assigneeIds: ["m-suzuki"] },

  // --- p5 社内業務効率化 (55%) ---
  { id: "t5-1", projectId: "p5", parentTaskId: null, title: "課題洗い出し・優先順位付け", status: "done", priority: "medium", progress: 100, startDate: "2026-06-28", dueDate: "2026-07-05", sortOrder: 1, assigneeIds: ["m-suzuki"] },
  { id: "t5-2", projectId: "p5", parentTaskId: null, title: "ツール選定", status: "in_progress", priority: "medium", progress: 60, startDate: "2026-07-05", dueDate: "2026-07-19", sortOrder: 2, assigneeIds: ["m-tanaka"] },
  { id: "t5-3", projectId: "p5", parentTaskId: null, title: "運用設計・ルール整備", status: "todo", priority: "medium", progress: 0, startDate: "2026-07-19", dueDate: "2026-07-30", sortOrder: 3, assigneeIds: ["m-yamada"] },
  { id: "t5-4", projectId: "p5", parentTaskId: null, title: "トレーニング・展開", status: "todo", priority: "low", progress: 0, startDate: "2026-07-30", dueDate: "2026-08-10", sortOrder: 4, assigneeIds: ["m-sato"] },
];

export const tasks: Task[] = seed.map((t, i) => ({
  ...t,
  isMilestone: t.isMilestone ?? false,
  boardColumnId: colOf(t.status),
  boardPosition: i,
}));

/* ===== タスク担当者 (多対多) は Task.assigneeIds に内包 ===== */

/*
 * ===== マイルストーン =====
 * 注意: タスク側の isMilestone と二重管理しない (t1-3「要件定義レビュー」は
 * タスク側で管理するためここには置かない)。
 * 命名は「〜フェーズ完了」等、ステータスの「完了」と誤読されない形にする。
 */
export const milestones: Milestone[] = [
  { id: "ms-2", projectId: "p2", title: "CRM業務フロー設計 フェーズ完了", dueDate: "2026-07-17", isDone: false },
  { id: "ms-3", projectId: "p3", title: "設計・開発 フェーズ完了", dueDate: "2026-07-20", isDone: false },
  { id: "ms-4", projectId: "p4", title: "コーディング・実装 フェーズ完了", dueDate: "2026-07-23", isDone: false },
  { id: "ms-5", projectId: "p2", title: "テスト・ユーザー検証 開始", dueDate: "2026-07-30", isDone: false },
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
  { id: "a1", projectId: "p2", title: "CRM導入支援の設計レビュー準備", dueDate: "2026-07-19", isDone: false },
  { id: "a2", projectId: "p1", title: "要件定義書を顧客へ共有", dueDate: "2026-07-16", isDone: true },
  { id: "a3", projectId: "p6", title: "営業資料の最終確認依頼", dueDate: "2026-07-16", isDone: false },
  { id: "a4", projectId: "p8", title: "決済代行業者と打ち合わせ", dueDate: "2026-07-20", isDone: false },
  { id: "a5", projectId: "p3", title: "DB設計レビューのMTG設定", dueDate: "2026-07-21", isDone: false },
];

/*
 * ===== 通知 =====
 * 実在するタスク/マイルストーンだけを参照する (KPI と矛盾する通知を作らない)。
 */
export const notifications: AppNotification[] = [
  { id: "n1", type: "due_soon", title: "期限が近いタスク", body: "「業務フロー設計」の期限は 7/12 です", link: "/todo?due=week", isRead: false, createdAt: "2026-07-04T09:00:00+09:00" },
  { id: "n2", type: "due_soon", title: "期限が近いタスク", body: "「デザイン制作」の期限は 7/14 です", link: "/todo?due=week", isRead: false, createdAt: "2026-07-04T08:30:00+09:00" },
  { id: "n3", type: "due_soon", title: "マイルストーン接近", body: "「CRM業務フロー設計 フェーズ完了」が 7/17 に予定されています", link: "/gantt", isRead: false, createdAt: "2026-07-03T08:00:00+09:00" },
];

/* ===== ドキュメント ===== */
export const documents: DocumentItem[] = [
  {
    id: "doc1",
    projectId: "p1",
    template: "standard",
    title: "要件定義書 v2",
    updatedAt: "2026-07-15",
    body: "# 要件定義書\n\n## 1. 目的\n新規業務改革プロジェクトにおける業務要件を整理する。\n\n## 2. スコープ\n- 受発注管理の刷新\n- 在庫管理の自動化\n\n## 3. 非機能要件\n- 同時接続 200 ユーザー\n- 99.5% の可用性",
  },
  {
    id: "doc2",
    projectId: "p1",
    template: "meeting",
    title: "キックオフ議事録",
    updatedAt: "2026-07-08",
    body: "# キックオフ議事録\n\n- 日時: 2026/06/29 10:00-11:30\n- 参加者: 後藤、佐藤、鈴木\n\n## 決定事項\n1. 週次定例は毎週月曜 10:00\n2. 現状分析・要件定義は 7/2 までに完了",
  },
  {
    id: "doc3",
    projectId: "p2",
    template: "standard",
    title: "CRM導入 提案書",
    updatedAt: "2026-07-14",
    body: "# CRM導入支援 提案書\n\n## 現状課題\n顧客情報が部署ごとに分散している。\n\n## 提案\nSalesforce をベースにした統合 CRM を構築。",
  },
  {
    id: "doc4",
    projectId: "p3",
    template: "standard",
    title: "基幹システム 設計方針",
    updatedAt: "2026-07-13",
    body: "# 設計方針\n\n## アーキテクチャ\n- マイクロサービス\n- イベント駆動\n\n## DB\nPostgreSQL + Redis キャッシュ",
  },
  {
    id: "doc5",
    projectId: "p4",
    template: "standard",
    title: "LP改善 ガイドライン",
    updatedAt: "2026-07-11",
    body: "# 補助金LP改善ガイドライン\n\n- ファーストビューに CTA を配置\n- フォーム項目は 5 つ以内\n- モバイル最適化を優先",
  },
  {
    id: "doc6",
    projectId: "p11",
    template: "standard",
    title: "運用マニュアル",
    updatedAt: "2026-07-02",
    body: "# 運用マニュアル\n\n## 日次作業\n1. バックアップ確認\n2. エラーログ確認\n\n## 障害対応フロー\n担当者へ即時エスカレーション。",
  },
];

/* ===== ファイル ===== */
export const files: FileItem[] = [
  { id: "f1", projectId: "p1", name: "要件定義書_v2.pdf", mimeType: "application/pdf", sizeBytes: 2_415_000, createdAt: "2026-07-15" },
  { id: "f2", projectId: "p2", name: "CRM提案資料.pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", sizeBytes: 5_820_000, createdAt: "2026-07-14" },
  { id: "f3", projectId: "p4", name: "ワイヤーフレーム.fig", mimeType: "application/octet-stream", sizeBytes: 1_240_000, createdAt: "2026-07-12" },
  { id: "f4", projectId: "p3", name: "画面設計書.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 880_000, createdAt: "2026-07-13" },
  { id: "f5", projectId: "p6", name: "ロゴ_最終版.png", mimeType: "image/png", sizeBytes: 320_000, createdAt: "2026-07-10" },
  { id: "f6", projectId: "p1", name: "キックオフ議事録.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 145_000, createdAt: "2026-07-08" },
  { id: "f7", projectId: "p8", name: "API仕様書.pdf", mimeType: "application/pdf", sizeBytes: 1_690_000, createdAt: "2026-07-11" },
  { id: "f8", projectId: "p4", name: "デザインカンプ.png", mimeType: "image/png", sizeBytes: 4_100_000, createdAt: "2026-07-09" },
];

/* ===== クライアント管理 ===== */
export const clients: ClientCompany[] = [
  {
    id: "c1",
    name: "株式会社グローバルホールディングス",
    industry: "製造・商社",
    ownerMemberId: "m-yamada",
    health: "watch",
    contacts: [
      { id: "ct1", clientId: "c1", name: "田中 健一", role: "経営企画部 部長", email: "tanaka@example.com", phone: "03-0000-1101" },
      { id: "ct2", clientId: "c1", name: "井上 沙織", role: "業務改革PM", email: "inoue@example.com", phone: "03-0000-1102" },
    ],
    interactions: [
      { id: "ci1", clientId: "c1", date: "2026-07-01", channel: "meeting", summary: "現状分析の共有。受発注領域の例外処理を次回までに整理。", nextAction: "7/10に業務フロー案を提示" },
      { id: "ci2", clientId: "c1", date: "2026-07-10", channel: "email", summary: "現行システムの権限一覧を受領。", nextAction: "権限棚卸し表に反映" },
    ],
  },
  {
    id: "c2",
    name: "フューチャーリンク株式会社",
    industry: "B2B SaaS",
    ownerMemberId: "m-sato",
    health: "good",
    contacts: [
      { id: "ct3", clientId: "c2", name: "森 亮", role: "営業企画 マネージャー", email: "mori@example.com", phone: "03-0000-2201" },
    ],
    interactions: [
      { id: "ci3", clientId: "c2", date: "2026-07-14", channel: "meeting", summary: "CRM項目定義の合意。商談フェーズ名のみ再確認。", nextAction: "Sandbox設定を開始" },
    ],
  },
  {
    id: "c3",
    name: "日本テクノ工業株式会社",
    industry: "製造",
    ownerMemberId: "m-yamada",
    health: "risk",
    contacts: [
      { id: "ct4", clientId: "c3", name: "高橋 学", role: "情報システム部", email: "takahashi@example.com", phone: "03-0000-3301" },
    ],
    interactions: [
      { id: "ci4", clientId: "c3", date: "2026-07-13", channel: "call", summary: "ベンダー選定の評価軸が未確定。意思決定者の追加ヒアリングが必要。", nextAction: "評価表のドラフトを送付" },
    ],
  },
  {
    id: "c4",
    name: "クリエイトデザイン合同会社",
    industry: "制作・マーケティング",
    ownerMemberId: "m-tanaka",
    health: "good",
    contacts: [
      { id: "ct5", clientId: "c4", name: "小林 由美", role: "代表", email: "kobayashi@example.com", phone: "03-0000-4401" },
    ],
    interactions: [
      { id: "ci5", clientId: "c4", date: "2026-07-11", channel: "email", summary: "LP改善ガイドラインを共有。フォーム項目削減に前向き。", nextAction: "初稿デザインを確認" },
    ],
  },
  { id: "c5", name: "株式会社サクセスパートナーズ", industry: "人材", ownerMemberId: "m-sato", health: "good", contacts: [], interactions: [] },
  { id: "c6", name: "ビジネスフロンティア株式会社", industry: "B2Bサービス", ownerMemberId: "m-suzuki", health: "good", contacts: [], interactions: [] },
  { id: "c7", name: "リテールイノベーション株式会社", industry: "小売", ownerMemberId: "m-tanaka", health: "watch", contacts: [], interactions: [] },
  { id: "c8", name: "データドリブン株式会社", industry: "データ分析", ownerMemberId: "m-takahashi", health: "good", contacts: [], interactions: [] },
  { id: "c9", name: "タレントブリッジ株式会社", industry: "採用支援", ownerMemberId: "m-tanaka", health: "good", contacts: [], interactions: [] },
  { id: "c10", name: "セーフガードシステムズ株式会社", industry: "セキュリティ", ownerMemberId: "m-yamada", health: "risk", contacts: [], interactions: [] },
];

/* ===== 工数 ===== */
export const timeEntries: TimeEntry[] = [
  { id: "te1", projectId: "p1", taskId: "t1-2", memberId: "m-yamada", date: "2026-07-12", minutes: 150, note: "業務フロー整理", billable: true },
  { id: "te2", projectId: "p1", taskId: "t1-4", memberId: "m-tanaka", date: "2026-07-14", minutes: 210, note: "新業務プロセス案作成", billable: true },
  { id: "te3", projectId: "p2", taskId: "t2-2", memberId: "m-sato", date: "2026-07-13", minutes: 180, note: "CRM項目定義", billable: true },
  { id: "te4", projectId: "p3", taskId: "t3-2", memberId: "m-suzuki", date: "2026-07-15", minutes: 240, note: "ベンダー比較表作成", billable: true },
  { id: "te5", projectId: "p4", taskId: "t4-2", memberId: "m-tanaka", date: "2026-07-15", minutes: 120, note: "FVコピー確認", billable: true },
  { id: "te6", projectId: "p5", taskId: "t5-2", memberId: "m-yamada", date: "2026-07-16", minutes: 90, note: "自社ツール比較", billable: false },
];

/* ===== 請求・売上 ===== */
export const billingRecords: BillingRecord[] = [
  { id: "b1", projectId: "p1", contractAmount: 1800000, invoicedAmount: 900000, directCost: 420000, dueDate: "2026-07-31", closingReminder: "7月末締め。要件定義完了分を請求対象に含める。" },
  { id: "b2", projectId: "p2", contractAmount: 1200000, invoicedAmount: 300000, directCost: 260000, dueDate: "2026-07-31", closingReminder: "設計フェーズ完了時に中間請求。" },
  { id: "b3", projectId: "p3", contractAmount: 2400000, invoicedAmount: 0, directCost: 760000, dueDate: "2026-08-30", closingReminder: "RFP確定後に初回請求。" },
  { id: "b4", projectId: "p4", contractAmount: 650000, invoicedAmount: 325000, directCost: 140000, dueDate: "2026-07-31", closingReminder: "公開前検収で残額請求。" },
  { id: "b5", projectId: "p6", contractAmount: 480000, invoicedAmount: 480000, directCost: 110000, dueDate: "2026-07-20", closingReminder: "請求済。入金確認のみ。" },
];

/* ===== 案件アクティビティ ===== */
export const projectActivities: ProjectActivity[] = [
  { id: "pa1", projectId: "p1", actorMemberId: "m-yamada", createdAt: "2026-07-16T11:20:00+09:00", type: "comment", body: "顧客レビュー後、例外処理の論点を3つに整理。" },
  { id: "pa2", projectId: "p1", actorMemberId: "m-sato", createdAt: "2026-07-15T16:40:00+09:00", type: "document", body: "要件定義書 v2 を更新。" },
  { id: "pa3", projectId: "p1", actorMemberId: "m-tanaka", createdAt: "2026-07-14T18:10:00+09:00", type: "time", body: "新業務プロセス案作成に3.5hを記録。" },
  { id: "pa4", projectId: "p2", actorMemberId: "m-sato", createdAt: "2026-07-14T15:00:00+09:00", type: "comment", body: "CRM項目定義を顧客と合意。" },
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
  { id: "note1", sectionId: "sec-work", title: "今週やること", body: "・要件定義レビュー準備\n・CRM提案書を仕上げる\n・請求書を送付\n\n優先度高: 要件定義レビュー（7/15）", color: "#FEF3C7", isPinned: true, updatedAt: "2026-07-03" },
  { id: "note5", sectionId: "sec-work", title: "請求まわり", body: "7月分の請求は月末締め。\n完了案件として計上する案件を整理する。", color: "#F1F5F9", isPinned: false, updatedAt: "2026-07-02" },
  { id: "note3", sectionId: "sec-ideas", title: "改善アイデア", body: "ダッシュボードに稼働率の推移グラフを追加したい。\n\n・週次の稼働率トレンド\n・メンバー別の負荷ヒートマップ", color: "#DCFCE7", isPinned: false, updatedAt: "2026-07-14" },
  { id: "note4", sectionId: "sec-ideas", title: "リサーチメモ", body: "競合のガント実装が分かりやすい。後で調査する。\nドラッグ編集とクリティカルパス表示が参考になりそう。", color: "#FCE7F3", isPinned: false, updatedAt: "2026-07-13" },
  { id: "note2", sectionId: "sec-clients", title: "グローバルHD 連絡メモ", body: "次回MTGは7/9（木）14:00。\n資料は前日までに共有すること。\n窓口: 経営企画部 田中様", color: "#DBEAFE", isPinned: true, updatedAt: "2026-07-02" },
  { id: "note6", sectionId: "sec-clients", title: "採用サイト案件", body: "トップのキービジュアルは田中さんが7/24までに準備。\n初稿レビューはオンラインで。", color: "#FFEDD5", isPinned: false, updatedAt: "2026-07-01" },
  { id: "note7", sectionId: "sec-personal", title: "読みたい本・記事", body: "・プロジェクトマネジメントの教科書\n・SaaS グロースの記事まとめ", color: "#FEF9C3", isPinned: false, updatedAt: "2026-07-10" },
];

/* ===== Issue Tree: 論点ボード ===== */
export const issueBoards: IssueBoard[] = [
  {
    id: "ib-1",
    clientName: "クリエイトデザイン合同会社",
    projectId: "p4",
    name: "補助金LP CVR改善",
    category: "Webマーケ",
    objective: "補助金申請LPのCVRを2.1%→4.0%へ引き上げる",
    kpi: "CVR / フォーム完了率 / CPA",
    updatedAt: "2026-07-08",
  },
  {
    id: "ib-2",
    clientName: "フューチャーリンク株式会社",
    projectId: "p2",
    name: "営業プロセス業務改善",
    category: "業務改善",
    objective: "CRM導入に合わせて営業リードタイムを30%短縮する",
    kpi: "リードタイム / 商談化率 / 入力工数",
    updatedAt: "2026-07-07",
  },
];

/* ===== Issue Tree: ノード ===== */
export const issueNodes: IssueNode[] = [
  // --- ib-1 論点ツリー ---
  { id: "in-1", boardId: "ib-1", treeKind: "issue", parentId: null, title: "なぜCVRが2.1%に留まっているのか", hypothesis: "流入の質ではなくLP内の離脱が主因", evidence: "広告CTRは業界平均以上。LP直帰率68%", dataNeeded: "GA4ファネル / Clarityヒートマップ", method: "ファネル分析で離脱ポイントを特定", status: "validating", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-08" },
  { id: "in-2", boardId: "ib-1", treeKind: "issue", parentId: "in-1", title: "FVで価値が伝わっていないのでは", hypothesis: "FV離脱率が高く、補助金額の訴求が弱い", evidence: "スクロール到達率40%", dataNeeded: "Clarityスクロールマップ", method: "FVコピーABテスト", status: "supported", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-08" },
  { id: "in-3", boardId: "ib-1", treeKind: "issue", parentId: "in-1", title: "フォームが長すぎるのでは", hypothesis: "項目12個が完了率を下げている", evidence: "フォーム開始→完了 31%", dataNeeded: "項目別離脱データ", method: "項目5個への削減テスト", status: "validating", priority: "medium", sortOrder: 2, createdTaskId: null, updatedAt: "2026-07-07" },
  { id: "in-4", boardId: "ib-1", treeKind: "issue", parentId: "in-1", title: "信頼要素が不足しているのでは", hypothesis: "実績・事例の提示で不安を解消できる", evidence: "", dataNeeded: "競合LPの信頼要素比較", method: "採択実績セクション追加の前後比較", status: "unverified", priority: "medium", sortOrder: 3, createdTaskId: null, updatedAt: "2026-07-06" },
  { id: "in-5", boardId: "ib-1", treeKind: "issue", parentId: "in-2", title: "補助金額を数字で見せるべきか", hypothesis: "「最大250万円」の明示でFV突破率が上がる", evidence: "ヒートマップで金額表記への注視を確認", dataNeeded: "ABテスト結果", method: "コピー2案のABテスト", status: "actionized", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-08" },
  // --- ib-1 KPIツリー ---
  { id: "in-6", boardId: "ib-1", treeKind: "kpi", parentId: null, title: "CVR 4.0%", hypothesis: "", evidence: "", dataNeeded: "GA4", method: "", status: "validating", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-05" },
  { id: "in-7", boardId: "ib-1", treeKind: "kpi", parentId: "in-6", title: "フォーム到達率 55%", hypothesis: "", evidence: "", dataNeeded: "GA4イベント", method: "", status: "unverified", priority: "medium", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-05" },
  { id: "in-8", boardId: "ib-1", treeKind: "kpi", parentId: "in-6", title: "フォーム完了率 60%", hypothesis: "", evidence: "", dataNeeded: "GA4イベント", method: "", status: "unverified", priority: "medium", sortOrder: 2, createdTaskId: null, updatedAt: "2026-07-05" },
  // --- ib-2 論点ツリー ---
  { id: "in-9", boardId: "ib-2", treeKind: "issue", parentId: null, title: "なぜ商談化までのリードタイムが長いのか", hypothesis: "情報の分散と手入力の多さがボトルネック", evidence: "リード対応まで平均2.5営業日", dataNeeded: "現行フローの工数実測", method: "業務フロー可視化ワークショップ", status: "validating", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-07" },
  { id: "in-10", boardId: "ib-2", treeKind: "issue", parentId: "in-9", title: "リード情報の転記作業が多いのでは", hypothesis: "フォーム→Excel→CRMの三重入力が発生", evidence: "ヒアリングで週5時間の転記を確認", dataNeeded: "作業ログ", method: "CRM自動連携の効果試算", status: "supported", priority: "high", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-07" },
  { id: "in-11", boardId: "ib-2", treeKind: "issue", parentId: "in-9", title: "担当割り当てルールが曖昧なのでは", hypothesis: "割り当て待ちで平均1営業日滞留", evidence: "", dataNeeded: "対応開始までの時間分布", method: "自動割り当てルールの設計・検証", status: "unverified", priority: "medium", sortOrder: 2, createdTaskId: null, updatedAt: "2026-07-06" },
  // --- ib-2 業務プロセスツリー ---
  { id: "in-12", boardId: "ib-2", treeKind: "process", parentId: null, title: "リード獲得〜商談化プロセス", hypothesis: "", evidence: "", dataNeeded: "", method: "", status: "validating", priority: "medium", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-06" },
  { id: "in-13", boardId: "ib-2", treeKind: "process", parentId: "in-12", title: "問い合わせ受付 (フォーム/電話)", hypothesis: "", evidence: "", dataNeeded: "", method: "", status: "unverified", priority: "low", sortOrder: 1, createdTaskId: null, updatedAt: "2026-07-06" },
  { id: "in-14", boardId: "ib-2", treeKind: "process", parentId: "in-12", title: "CRM登録・担当割り当て", hypothesis: "", evidence: "", dataNeeded: "", method: "", status: "validating", priority: "medium", sortOrder: 2, createdTaskId: null, updatedAt: "2026-07-06" },
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
