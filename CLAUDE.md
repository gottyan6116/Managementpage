# CLAUDE.md — ProManage 開発ガイド

> このファイルは Claude Code / Cursor / AntiGravity / Codex などの AI 開発エージェントが
> **最初に必ず読む** プロジェクトのルート指示書です。各詳細は `docs/` 配下を参照してください。

---

## 1. プロジェクト概要

**ProManage** は、コンサルタント／個人事業主が「プロジェクト・タスク・案件」を一元管理するための
Web マネジメントアプリです。提供 3 画面（Todo ダッシュボード／ガントチャート／担当案件）を中心に、
ボード・ドキュメント・ファイル・メモを備えます。

- **キャッチコピー**: "Work Together, Succeed."
- **UI 方針**: 提供スクリーンショットの **完全再現**（ピクセル単位で寄せる）
- **UX 方針**: 直感的・ユーザーフレンドリー。迷わない導線、即時フィードバック、楽観的更新
- **利用形態**: **個人利用中心**。ログインするのはオーナー 1 人。
  「山田太郎」「佐藤花子」などの担当者は **ログインしないマスタデータ（members）** として扱う

---

## 2. 技術スタック（確定）

| 領域 | 採用技術 | 備考 |
|------|----------|------|
| フレームワーク | **Next.js 15 (App Router) + React 19** | Server Components 前提 |
| 言語 | **TypeScript** (strict) | `any` 禁止 |
| スタイリング | **Tailwind CSS v4** + **shadcn/ui** | デザイントークンは `docs/02` |
| 状態管理 | **TanStack Query**（サーバー状態）+ **Zustand**（UI 状態） | `docs/05` 参照 |
| フォーム | **React Hook Form + Zod** | スキーマは Zod を単一の真実とする |
| バックエンド | **Supabase**（Postgres + Auth + Storage + Realtime） | 無料枠 |
| ガント描画 | 自前 SVG/CSS グリッド（外部ライブラリ最小化） | `docs/04` 参照 |
| グラフ | **Recharts** | KPI カードのスパークライン・ドーナツ |
| アイコン | **lucide-react** | |
| ドラッグ&ドロップ | **@dnd-kit** | ボードのカンバン用 |
| 日付 | **date-fns** | ロケール ja |
| テスト | **Vitest** + **Testing Library** + **Playwright** | |
| Lint/Format | **ESLint + Prettier** | |
| パッケージ管理 | **pnpm** | |

---

## 3. ディレクトリ構成（目標）

```
promanage/
├─ CLAUDE.md                  # このファイル
├─ .cursorrules               # Cursor 用ルール
├─ docs/                      # 設計書一式（下記参照）
├─ src/
│  ├─ app/                    # App Router
│  │  ├─ (auth)/login/
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx        # サイドバー + ヘッダーの共通レイアウト
│  │  │  ├─ todo/             # Todo ダッシュボード
│  │  │  ├─ gantt/            # ガントチャート
│  │  │  ├─ projects/         # 担当案件
│  │  │  ├─ board/            # ボード（カンバン）
│  │  │  ├─ documents/        # ドキュメント
│  │  │  ├─ files/            # ファイル
│  │  │  └─ notes/            # メモ
│  │  └─ layout.tsx
│  ├─ components/
│  │  ├─ ui/                  # shadcn/ui プリミティブ
│  │  ├─ layout/              # Sidebar, Header, AppShell
│  │  ├─ dashboard/           # KPIカード, タスク一覧 等
│  │  ├─ gantt/               # ガント専用
│  │  └─ shared/              # Badge, Avatar, ProgressBar 等
│  ├─ lib/
│  │  ├─ supabase/            # client.ts, server.ts
│  │  ├─ queries/             # TanStack Query フック
│  │  └─ utils.ts
│  ├─ stores/                 # Zustand
│  ├─ types/                  # 型定義（Supabase 生成型を含む）
│  └─ styles/                 # globals.css（デザイントークン）
├─ supabase/
│  ├─ migrations/             # SQL マイグレーション
│  └─ seed.sql                # デモデータ
└─ tests/
```

---

## 4. ドキュメント索引（必ず該当ファイルを開いて作業）

| ファイル | 内容 | いつ読むか |
|----------|------|-----------|
| `docs/00_overview.md` | 全体像・進め方・フェーズ | 着手前に最初 |
| `docs/01_requirements.md` | 機能要件・非機能要件・スコープ | 機能を実装する前 |
| `docs/02_design_system.md` | カラー・タイポ・余白・UI 再現仕様 | UI を書く前 |
| `docs/03_data_model.md` | ER 図・テーブル・RLS・SQL | DB / API を触る前 |
| `docs/04_screens.md` | 画面別の詳細設計 | 各画面を実装する前 |
| `docs/05_architecture.md` | データ取得・状態管理・命名規約 | 設計判断の前 |
| `docs/06_roadmap.md` | 段階的タスク分解（実装順） | 全体の進行管理 |

---

## 5. 開発ルール（厳守）

### コーディング
- TypeScript strict。`any` 禁止。外部入力は **Zod でパース**してから使う。
- Server Components をデフォルトに。`"use client"` は対話が必要な末端のみ。
- データ取得は **TanStack Query フック経由**（`src/lib/queries/`）。コンポーネント内で直接 fetch しない。
- 命名: コンポーネント `PascalCase`、フック `useXxx`、ファイルは機能名。DB は `snake_case`。
- マジックナンバー禁止。色・余白・角丸は **必ずデザイントークン（CSS 変数 / Tailwind テーマ）** を使う。

### UI 再現
- 提供スクリーンショットが**正**。実装後は必ず見比べて差分を潰す。
- 余白・角丸・影・グラデーションは `docs/02` の数値に従う。目視の「だいたい」で済ませない。
- レスポンシブは後回しにせず、サイドバーの折りたたみ（ハンバーガー）を最初から考慮する。

### Git / コミット
- 1 タスク 1 ブランチ（`feat/`, `fix/`, `chore/`）。
- コミットメッセージは Conventional Commits（日本語可）。
- `docs/06_roadmap.md` のタスク単位でコミットし、各タスク完了時にスクショ比較する。

### 完了の定義（DoD）
1. 型エラー・Lint エラーがない
2. 該当画面がスクショと視覚的に一致する
3. 主要操作に楽観的更新とエラーハンドリングがある
4. キーボード操作・フォーカスリングが機能する（アクセシビリティ）

---

## 6. AI エージェントへの作業手順（推奨フロー）

1. `docs/00_overview.md` と `docs/06_roadmap.md` を読み、**今のフェーズのタスク**を1つ選ぶ。
2. そのタスクに関係する `docs/02` `docs/03` `docs/04` の該当節を読む。
3. 実装 → 型/Lint → スクショ比較 → 自己レビュー（DoD）。
4. 不明点は**推測で進めず**、`docs/` の該当箇所に TODO コメントを残して人間に確認を促す。
5. 完了したらロードマップのチェックを更新。

> **重要**: 一度に全部作らない。`docs/06_roadmap.md` のフェーズ順（基盤 → レイアウト → 画面ごと）で
> 小さく刻んで進めること。
