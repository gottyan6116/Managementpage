# 07 — Issue Tree ワークスペース設計

> 2026-07-11 改訂。モーダル型から `/issue-tree/[projectId]` の専用ワークスペースへ置換。
> フェーズ1〜3 は実装済み。フェーズ4 (Supabase) は本ドキュメントの設計のみで、実装は含まない。

## アーキテクチャ

- 永続化へのアクセスは **`IssueTreeRepository` インターフェイス経由のみ**
  (`src/lib/issue-tree/repository.ts`)。
  - アプリ実装: `LocalStorageIssueTreeRepository` — ストレージ可用性チェック、
    スキーマ読込、マイグレーション、エラー正規化を所有
  - テスト実装: `InMemoryIssueTreeRepository` (独立実装)
- ドメイン (`src/lib/issue-tree/domain.ts`) は `IssueTreeProject` / `IssueTreeNode` /
  `IssueTreeEdge` を所有し、**`@xyflow/react` に依存しない**。
  React Flow との変換は `react-flow-adapter.ts` のみが行う。
- TanStack Query が project/nodes/edges の正本を持つ (`issue-tree-hooks.ts`)。
  Zustand (`issue-tree-store.ts`) は選択ノード・アクティブツリー・ビューモード・
  フィルタ・パネル状態・**セッション内のみの Undo/Redo 履歴**に限定し、
  永続エンティティを複製しない。

## ルーティング / UI

- `/issue-tree` — プロジェクト一覧 + 新規作成。カードは `Link` で遷移
- `/issue-tree/[projectId]?view=issue|logic|kpi|process` — ワークスペース
- Desktop: フィルタ 240px / キャンバス・リスト可変 / サマリー・詳細 360px の3カラム
- Tablet: サイドパネルはドロワー化。Mobile: リストビュー既定、ノード詳細はオーバーレイ
- ノードカード: ニュートラルな白 + 控えめな境界/影 + 文字ラベル付きステータスバッジ +
  優先度バッジ。**左カラーストライプは使わない**

## ストレージ / マイグレーション

```ts
interface IssueTreeStorageV1 {
  version: 1;
  projects: IssueTreeProject[];
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
}
```

- `window` / `localStorage` へアクセスする前にランタイムを確認。SSR・ストレージ不可時は
  メモリ上のシードで動作
- 読込時: JSON を安全にパース → レガシー値の移行 (旧モーダル実装の
  `issueBoards`/`issueNodes`、**`validating` → `testing`**) → 不正参照の除去
  (孤児ノード破棄・親消失はルート化・宙吊りエッジ破棄) → 破損時はシードへフォールバック
- パース失敗・ストレージ不可・容量超過・書込失敗は
  `IssueTreeRepositoryError` (code: `storage_unavailable` / `parse_error` /
  `quota_exceeded` / `write_failed` / `not_found`) へ正規化
- `saving` / `saved` / `error` の保存 UI はミューテーション結果が駆動する (視覚タイマーではない)

## インタラクション規約

- ノード作成はインライン入力 (Enter=確定 / Shift+Enter=改行 / Escape=キャンセル)。
  空ノードの先行描画はしない
- ノード位置の永続化は **ドラッグ終了時のみ** (`onNodeDragStop`)
- フィルタ不一致のノード・エッジは削除せず**淡色表示** (構造の文脈を保つ)
- 詳細パネルのフィールド保存は **800ms デバウンス**、正規化エラー後は再試行ボタン
- Undo/Redo は Zustand にドメインエンティティをスナップショット (localStorage へ非永続)。
  Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
- 削除は Undo トースト付き。子ノードまたは連携タスクがあるノードは確認ダイアログ必須

## テスト

`tests/issue-tree.test.mts` (node:test、注入 StorageAdapter でブラウザグローバル不要):
リポジトリ CRUD / localStorage 復元 / マイグレーション / 破損 JSON フォールバック /
`validating` 移行 / ノード作成・更新・削除 (カスケード) / 親付け替え / Undo/Redo /
フィルタ / React Flow アダプタ変換。

---

## フェーズ4: Supabase 設計 (ドキュメントのみ)

### テーブル

```sql
create type issue_tree_type   as enum ('issue','logic','kpi','process');
create type issue_node_status as enum ('unverified','testing','supported','rejected','actionized');
create type issue_node_type   as enum ('question','hypothesis','driver','metric','process','action');
create type issue_relation    as enum ('breakdown','supports','contradicts','relates');

create table issue_tree_projects (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null,                -- 将来のマルチテナント境界
  owner_id          uuid not null references auth.users(id),
  linked_project_id uuid references projects(id) on delete set null,
  client_name       text not null,
  name              text not null,
  category          text not null,
  objective         text not null default '',
  next_action       text not null default '',
  status            text not null default 'active' check (status in ('active','on_hold','done')),
  deadline          date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table issue_tree_kpi_entries (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references issue_tree_projects(id) on delete cascade,
  label      text not null,
  target     text not null default '',
  current    text not null default '',
  sort_order int  not null default 0
);

create table issue_tree_nodes (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references issue_tree_projects(id) on delete cascade,
  tree_type    issue_tree_type not null default 'issue',
  parent_id    uuid references issue_tree_nodes(id) on delete cascade,
  sort_order   int  not null default 0,
  title        text not null,
  description  text not null default '',
  node_type    issue_node_type   not null default 'question',
  status       issue_node_status not null default 'unverified',
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  hypothesis   text not null default '',
  data_needed  text not null default '',
  method       text not null default '',
  conclusion   text not null default '',
  owner_id     uuid references auth.users(id),
  deadline     date,
  linked_task_ids uuid[] not null default '{}',
  collapsed    boolean not null default false,
  position_x   double precision,                 -- null = 自動レイアウト
  position_y   double precision,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on issue_tree_nodes (project_id, tree_type, parent_id);

create table issue_tree_evidence_items (
  id         uuid primary key default gen_random_uuid(),
  node_id    uuid not null references issue_tree_nodes(id) on delete cascade,
  text       text not null,
  source     text not null default '',
  created_at timestamptz not null default now()
);

create table issue_tree_edges (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references issue_tree_projects(id) on delete cascade,
  tree_type      issue_tree_type not null default 'issue',
  source_node_id uuid not null references issue_tree_nodes(id) on delete cascade,
  target_node_id uuid not null references issue_tree_nodes(id) on delete cascade,
  relation_type  issue_relation not null default 'relates',
  label          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on issue_tree_edges (project_id, tree_type);
```

### テナントスコープ RLS

`tenant_id` を境界とし、`auth.jwt() ->> 'tenant_id'` (カスタムクレーム) と照合する。
個人利用フェーズでは tenant_id = owner_id 相当の単一テナントで開始できる。

```sql
alter table issue_tree_projects       enable row level security;
alter table issue_tree_kpi_entries    enable row level security;
alter table issue_tree_nodes          enable row level security;
alter table issue_tree_evidence_items enable row level security;
alter table issue_tree_edges          enable row level security;

create policy tenant_projects on issue_tree_projects
  for all
  using  (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 子テーブルは親プロジェクト経由でテナントを判定
create policy tenant_nodes on issue_tree_nodes
  for all
  using (exists (
    select 1 from issue_tree_projects p
    where p.id = project_id
      and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ))
  with check (exists (
    select 1 from issue_tree_projects p
    where p.id = project_id
      and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ));
-- kpi_entries / edges も同形。evidence_items は node → project の2段結合で判定
```

`updated_at` は `set_updated_at()` トリガで自動更新 (docs/03 と同じ関数を共用)。

### リポジトリ差し替え手順

1. `SupabaseIssueTreeRepository implements IssueTreeRepository` を実装
   (`@supabase/supabase-js` クライアントをコンストラクタ注入)
   - `evidenceItems` / `kpis` はテーブル join で読み、書込みは upsert/delete の差分適用
   - `replaceProjectGraph` は RPC (plpgsql 関数) で原子的に置換
   - Supabase エラー (PostgrestError / ネットワーク) を `IssueTreeRepositoryError` へ正規化
2. `issue-tree-hooks.ts` の 1 箇所のバインディングを差し替える:
   `export const issueTreeRepository = new SupabaseIssueTreeRepository(client)`
   (環境変数 `NEXT_PUBLIC_USE_MOCK` でフォールバック切替可)
3. 初回ログイン時に `LocalStorageIssueTreeRepository` から読み出した V1 ペイロードを
   Supabase へ一括インポートする移行アクションを用意 (`migrateStoredPayload` を再利用)
4. `tests/issue-tree.test.mts` の契約テストを `InMemoryIssueTreeRepository` と同様に
   Supabase 実装 (ローカル supabase or モッククライアント) にも通す
