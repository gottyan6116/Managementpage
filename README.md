# ProManage

> **Work Together, Succeed.**
> コンサルタント／個人事業主のための「プロジェクト・タスク・案件」一元管理アプリ。

提供スクリーンショット（Todo ダッシュボード／ガントチャート／担当案件）の **UI 完全再現** を目指し、
Supabase をバックエンドに実際に動くマネジメントアプリを構築するプロジェクトです。

## 技術スタック

| 領域 | 採用 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + React 19 |
| 言語 | TypeScript (strict) |
| スタイリング | Tailwind CSS v4（デザイントークンは `src/app/globals.css`） |
| サーバー状態 | TanStack Query |
| UI 状態 | Zustand |
| フォーム | React Hook Form + Zod（フェーズ6〜） |
| グラフ | Recharts |
| アイコン | lucide-react |
| ドラッグ&ドロップ | @dnd-kit |
| 日付 | date-fns（ロケール ja） |
| バックエンド | Supabase（フェーズ6で接続予定） |

## セットアップ

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npx tsc --noEmit
```

## 実装状況（`docs/06_roadmap.md`）

- [x] **フェーズ0** プロジェクト基盤（トークン・依存・ディレクトリ・モックデータ）
- [x] **フェーズ1** 共通レイアウト（Sidebar / Header / AppShell・7ルート）
- [x] **フェーズ2** Todo ダッシュボード（KPI・今後の期限・タスク一覧・ボード/ガントプレビュー）
- [x] **フェーズ3** ガントチャート（左ツリー＋タイムライン・バー・依存矢印・今日ライン・ズーム）
- [x] **フェーズ4** 担当案件（KPI・案件テーブル・要注意/アクション/ステータス分布）
- [x] **フェーズ5** 残り4画面（ボード D&D・ドキュメント・ファイル・メモ）
- [ ] **フェーズ6** Supabase 接続（認証・CRUD・RLS・Realtime）
- [ ] **フェーズ7** 仕上げ（a11y・レスポンシブ・E2E）

現在は **フェーズ1〜5（フロント完全再現）をダミーデータで実装済み**。
データ取得は `src/lib/repositories`（モック）→ `src/lib/queries`（TanStack Query フック）に
隠蔽してあるため、フェーズ6では同じインターフェイスのまま Supabase 実装へ差し替えられます。

## ディレクトリ

```
src/
├─ app/
│  ├─ (app)/                 # 共通レイアウト配下の7画面
│  │  ├─ todo/ gantt/ projects/ board/ documents/ files/ notes/
│  │  └─ layout.tsx          # AppShell
│  ├─ layout.tsx  page.tsx   # ルート（/ → /todo リダイレクト）
│  └─ globals.css            # デザイントークン (docs/02)
├─ components/
│  ├─ layout/                # Sidebar / Header / AppShell
│  ├─ shared/                # Badge / Avatar / ProgressBar / KpiCard / Charts ...
│  ├─ dashboard/ gantt/ projects/ board/ documents/ files/ notes/
│  └─ providers.tsx          # TanStack Query Provider
├─ lib/
│  ├─ repositories/mock/     # ダミーデータ + モックリポジトリ
│  ├─ queries/               # TanStack Query フック
│  ├─ gantt.ts               # ガント座標計算（純関数）
│  ├─ date.ts  labels.ts  utils.ts
├─ stores/                   # Zustand（UI 状態）
└─ types/                    # ドメイン型
```

## 設計ドキュメント

詳細は [`CLAUDE.md`](./CLAUDE.md) と [`docs/`](./docs) を参照。

| ファイル | 内容 |
|----------|------|
| `docs/00_overview.md` | 全体像・進め方 |
| `docs/01_requirements.md` | 要件定義 |
| `docs/02_design_system.md` | デザイントークン・UI再現仕様 |
| `docs/03_data_model.md` | Supabase スキーマ |
| `docs/04_screens.md` | 画面別詳細設計 |
| `docs/05_architecture.md` | アーキテクチャ・状態管理 |
| `docs/06_roadmap.md` | 実装ロードマップ |

> デモ用の「今日」は `2025-05-16`（スクリーンショット基準）に固定しています（`src/lib/date.ts` の `APP_TODAY`）。
> フェーズ6で実データに切り替える際は `new Date()` に置き換えてください。
