# 07 — Issue Tree（論点ツリー）設計

> 2026-07-10 追加。ビジネス戦略コンサルタントとして、Webマーケ案件・業務改善案件の
> 論点ツリー / ロジックツリー / KPIツリー / 業務プロセスツリーを案件ごとに管理する機能。

## 画面構成

- サイドバー「案件 > Issue Tree」→ `/issue-tree`
- 一覧: クライアント/案件ごとのカードグリッド（desktop 3列 / tablet 2列 / mobile 1列）
  - カード表示項目: クライアント名 / 案件名 / 案件種別 / 目的 / 主要KPI / 論点数 / 検証中数 / 施策化済み数 / 最終更新日
- カードクリック → framer-motion の `layoutId` でカードがモーフする**拡張モーダル**
  （desktop: `inset-5` のほぼフルスクリーン / mobile: フルスクリーン）
  - 上部: 案件概要バー / 中央: ツリー / 右: 選択ノード詳細パネル（mobile は下部ドロワー）
  - タブで「論点 / ロジック / KPI / 業務プロセス」の4ツリーを切替
- ノード: 追加（ルート/子）・編集・削除（子孫ごと）・選択
  - 属性: 仮説 / 根拠 / 必要データ / 検証方法 / ステータス / 優先度
  - ステータス: `unverified` 未検証 / `validating` 検証中 / `supported` 支持 / `rejected` 棄却 / `actionized` 施策化済み
- 「この論点からタスク作成」→ 既存 `createTask`（board の連携案件 + ノード優先度を継承）
  を呼び、ノードを `actionized` に更新・`createdTaskId` で相互リンク（→ `/board?task=<id>`）

## コンポーネント構成（React Flow 差し替え可能設計）

```
src/components/issue-tree/
  board-grid.tsx        一覧 + 開閉制御 (AnimatePresence) + 新規ボードダイアログ
  board-card.tsx        カード (motion layoutId)
  board-detail.tsx      拡張モーダル (概要/タブ/レイアウト/mobileドロワー)
  tree-view.tsx         ★ツリー描画 (MVP: 再帰)。入力は「フラット nodes[] + コールバック」のみ
  node-detail-panel.tsx 選択ノード編集 + タスク作成
src/lib/issue-tree.ts   buildTree (flat→階層の純関数) / ステータスメタ / タブ定義
```

`tree-view.tsx` の props はフラット配列とコールバックに限定しているため、
React Flow 移行時は同じ入力から nodes/edges を導出する実装に差し替えるだけでよい。

## データ層

フェーズ1 はモックリポジトリ（`src/lib/repositories/mock/`）+ localStorage 永続化。
関数シグネチャ: `listIssueBoardSummaries / createIssueBoard / updateIssueBoard / deleteIssueBoard /
listIssueNodes / createIssueNode / updateIssueNode / deleteIssueNode`。

## Supabase テーブル設計（フェーズ2）

```sql
create type issue_tree_kind as enum ('issue','logic','kpi','process');
create type issue_node_status as enum ('unverified','validating','supported','rejected','actionized');

create table issue_boards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id),
  project_id  uuid references projects(id) on delete set null,
  client_name text not null,
  name        text not null,
  category    text not null,
  objective   text not null default '',
  kpi         text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table issue_nodes (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references issue_boards(id) on delete cascade,
  tree_kind       issue_tree_kind not null default 'issue',
  parent_id       uuid references issue_nodes(id) on delete cascade,
  title           text not null,
  hypothesis      text not null default '',
  evidence        text not null default '',
  data_needed     text not null default '',
  method          text not null default '',
  status          issue_node_status not null default 'unverified',
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  sort_order      int  not null default 0,
  created_task_id uuid references tasks(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index issue_nodes_board_kind_parent_idx
  on issue_nodes (board_id, tree_kind, parent_id);

-- RLS (個人利用: オーナーのみ)
alter table issue_boards enable row level security;
alter table issue_nodes  enable row level security;

create policy "own boards" on issue_boards
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own nodes" on issue_nodes
  for all using (
    exists (select 1 from issue_boards b where b.id = board_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from issue_boards b where b.id = board_id and b.owner_id = auth.uid())
  );

-- updated_at 自動更新
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger issue_boards_touch before update on issue_boards
  for each row execute function set_updated_at();
create trigger issue_nodes_touch before update on issue_nodes
  for each row execute function set_updated_at();
```

集計（論点数/検証中数/施策化済み数）はビューまたはクエリで導出:

```sql
create view issue_board_summaries as
select b.*,
  count(n.id)                                       as node_count,
  count(n.id) filter (where n.status = 'validating') as validating_count,
  count(n.id) filter (where n.status = 'actionized') as actionized_count
from issue_boards b
left join issue_nodes n on n.board_id = b.id
group by b.id;
```
