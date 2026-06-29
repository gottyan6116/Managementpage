# 05 — アーキテクチャ / 状態管理 / 規約

## 1. レンダリング戦略

- **Server Components 既定**。ページの初期データは Server 側で取得し、`HydrationBoundary` で渡す。
- 対話が必要な末端のみ `"use client"`（テーブルのタブ、D&D、フォーム、ガントのスクロール）。
- 書き込みは **Server Actions** 優先。複雑なものは Route Handler（`app/api/...`）。

## 2. データ取得レイヤ（重要・最初に整える）

UI から Supabase を直接触らない。必ずこの 2 層を経由する。

```
components → src/lib/queries/*  (TanStack Query フック)
                  ↓
           src/lib/repositories/*  (supabase-js でテーブル操作 + domain 型へマッピング)
                  ↓
              Supabase
```

- 例: `useTasks(params)`, `useProjects()`, `useDashboardKpi()`, `useGanttRows()`。
- フェーズ1ではリポジトリ実装を **ダミー JSON**（`src/lib/repositories/mock/`）にしておき、
  フェーズ2で同じインターフェイスのまま Supabase 実装へ差し替える（UI 改修ゼロ）。

```ts
// src/lib/repositories/tasks.repo.ts
export interface TasksRepo {
  list(params: TaskListParams): Promise<Task[]>;
  toggleDone(id: string): Promise<void>;
  // ...
}
export const tasksRepo: TasksRepo = USE_MOCK ? mockTasksRepo : supabaseTasksRepo;
```

## 3. 状態管理の役割分担

| 種類 | 手段 | 例 |
|------|------|----|
| サーバー状態（取得/キャッシュ/更新） | **TanStack Query** | tasks, projects, kpi |
| グローバル UI 状態 | **Zustand** | sidebarCollapsed, commandPaletteOpen, ganttZoom |
| URL 状態（共有/復元したい） | **searchParams** | タブ、フィルター、期間 |
| フォーム | **React Hook Form + Zod** | 作成/編集モーダル |

- 楽観的更新は TanStack Query の `onMutate` でキャッシュを即時更新し、失敗時 `onError` でロールバック＋トースト。

## 4. ラベル ↔ ENUM マッピング

`src/lib/labels.ts` に集約（表示は必ずここを通す）。

```ts
export const STATUS_LABEL: Record<TaskStatus,string> = {
  todo:'未着手', in_progress:'進行中', done:'完了', on_hold:'保留', canceled:'中止',
};
export const PRIORITY_LABEL: Record<Priority,string> = { low:'低', medium:'中', high:'高' };
// 残り日数の表示は src/lib/date.ts の formatDue()/remainingLabel() を使う
```

## 5. 命名・ディレクトリ規約（再掲＋詳細）

- コンポーネント: `PascalCase.tsx`、1ファイル1主要コンポーネント。
- フック: `useXxx.ts`。リポジトリ: `xxx.repo.ts`。クエリ: `useXxxQuery` でも可。
- DB: テーブル/カラム `snake_case`。TS ドメイン型は `PascalCase` プロパティ `camelCase`。
- 色・余白・角丸は Tailwind テーマ（`tailwind.config` で `docs/02` のトークンを定義）から参照。

## 6. Supabase セットアップ

```bash
pnpm add @supabase/supabase-js @supabase/ssr
# .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
- `src/lib/supabase/client.ts`（ブラウザ）/ `server.ts`（Server Components・cookies 連携）。
- 認証: メールマジックリンク or Google OAuth。未ログインは `/login` へリダイレクト（middleware）。

## 7. パフォーマンス指針

- 画像（サイドバー背景・アバター）は `next/image`、適切な sizes。
- グラフは必要な画面のみ動的 import（`next/dynamic`, `ssr:false`）。
- ガントは行数が増えたら `@tanstack/react-virtual` を導入（初期は不要）。

## 8. アクセシビリティ

- すべてのインタラクティブ要素に `aria-label` / フォーカスリング。
- バッジの色だけに依存せずテキストも併記（色覚対応）。
- `⌘K`、矢印キーでのリスト移動、モーダルのフォーカストラップ。
- `prefers-reduced-motion` 対応。

## 9. テスト方針

- ユニット: ラベル変換・日付計算・ガントのバー座標計算（純関数を切り出してテスト）。
- コンポーネント: KpiCard/StatusBadge/Table のレンダリング。
- E2E（Playwright）: ログイン→Todo 表示→タスク完了トグル→ボード D&D の主要動線。

## 10. 将来拡張（スコープ外メモ）

- members への `auth_user_id` 追加でチーム化。
- 通知のメール/プッシュ配信。外部カレンダー（Google）双方向同期。
- ガントのベースライン比較、クリティカルパス表示。
