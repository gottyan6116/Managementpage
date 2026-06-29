# 03 — データモデル / Supabase スキーマ

## 1. ER 図（概念）

```
owners(auth) ─┐
              │ owns
              ▼
          members ──assigned──< task_assignees >── tasks >── milestones
              │                                      ▲
              │ assigned (project lead)              │ belongs to
              ▼                                      │
          projects ◄───────────────────────────────┘
              │
              ├──< board_columns >──< (tasks.board_column_id)
              ├──< documents
              ├──< files
              └──< notes

actions(今週のアクション)   notifications(通知)
```

- 1 オーナー（auth.users）が全テーブルを所有（各行に `owner_id`）。
- `members` はログインしない担当者マスタ。タスクへは多対多（`task_assignees`）。
- `projects` 1 : N `tasks`、`tasks` 1 : N `milestones`（または project 直下マイルストーンも可）。

## 2. ENUM 型

```sql
create type task_status   as enum ('todo','in_progress','done','on_hold','canceled');
create type project_status as enum ('in_progress','final_check','done','on_hold','canceled');
create type priority       as enum ('low','medium','high');
```

> 表示ラベル対応は `docs/02 §2` と `docs/05` のマッピングを使う
> （例: `in_progress`→「進行中」, `high`→「高」）。

## 3. テーブル定義（SQL）

```sql
-- ============ members（担当者マスタ） ============
create table members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,                 -- 山田 太郎
  role        text,                          -- コンサルタント
  avatar_url  text,
  color       text default '#3B82F6',        -- 表示色（アバター枠/進捗）
  is_self     boolean default false,         -- オーナー本人かどうか
  created_at  timestamptz default now()
);

-- ============ projects（プロジェクト/案件） ============
create table projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,                -- 新規業務改革プロジェクト
  client       text,                         -- 株式会社グローバルホールディングス
  color        text default '#3B82F6',       -- ガント/進捗の識別色
  phase        text,                         -- 要件定義 / 設計 / 制作 ...
  status       project_status default 'in_progress',
  priority     priority default 'medium',
  progress     int default 0 check (progress between 0 and 100),
  start_date   date,
  end_date     date,
  next_due     date,                         -- 次回期限
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============ project_members（案件の担当者） ============
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  member_id  uuid references members(id) on delete cascade,
  primary key (project_id, member_id)
);

-- ============ board_columns（カンバン列） ============
create table board_columns (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,                  -- 未着手 / 進行中 / 完了
  position   int not null,
  created_at timestamptz default now()
);

-- ============ tasks（タスク） ============
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references projects(id) on delete cascade,
  parent_task_id   uuid references tasks(id) on delete cascade, -- ガントの親子
  board_column_id  uuid references board_columns(id) on delete set null,
  title            text not null,            -- 要件定義書作成
  status           task_status default 'todo',
  priority         priority default 'medium',
  progress         int default 0 check (progress between 0 and 100),
  start_date       date,                     -- ガントのバー開始
  due_date         date,                     -- 期限 / バー終了
  is_milestone     boolean default false,
  sort_order       int default 0,
  board_position   int default 0,            -- カンバン内の縦位置
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============ task_assignees（タスク担当者・多対多） ============
create table task_assignees (
  task_id   uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ============ task_dependencies（ガント依存関係） ============
create table task_dependencies (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  predecessor_id  uuid not null references tasks(id) on delete cascade,
  successor_id    uuid not null references tasks(id) on delete cascade,
  unique (predecessor_id, successor_id)
);

-- ============ milestones（マイルストーン） ============
create table milestones (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title      text not null,                  -- 要件定義レビュー
  due_date   date not null,
  is_done    boolean default false,
  created_at timestamptz default now()
);

-- ============ actions（今週のアクション） ============
create table actions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  title       text not null,                 -- CRM導入支援の設計レビュー
  due_date    date,
  is_done     boolean default false,
  created_at  timestamptz default now()
);

-- ============ notifications（通知） ============
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  type        text,                          -- due_soon / overdue / mention
  title       text not null,
  body        text,
  link        text,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ============ documents / files / notes ============
create table documents (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title      text not null,
  body       text,                           -- Markdown
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table files (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  name        text not null,
  storage_path text not null,                -- Supabase Storage のパス
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz default now()
);

create table notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  title      text,
  body       text,
  color      text default '#FEF3C7',
  is_pinned  boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
```

## 4. インデックス（抜粋）

```sql
create index on tasks (owner_id);
create index on tasks (project_id);
create index on tasks (due_date);
create index on tasks (board_column_id, board_position);
create index on projects (owner_id, sort_order);
create index on milestones (due_date);
create index on task_assignees (member_id);
```

## 5. RLS（Row Level Security）

全テーブル共通方針: **オーナー本人の行のみ全操作可**。

```sql
alter table members enable row level security;
-- ↓ 全テーブルに対して同型のポリシーを作る（owner_id = auth.uid()）
create policy "owner_all_members" on members
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- members 以外（projects, tasks, ...）も同じパターンで作成する。
-- 中間テーブル（project_members, task_assignees, task_dependencies）は
-- 親行の owner を辿るか、各行に owner_id を持たせて同様に保護する。
```

> `task_assignees` `project_members` は owner_id を持たないため、
> RLS は「親 task / project が auth.uid() の所有なら可」というサブクエリ条件にする。

## 6. 集計ビュー（KPI を SQL 側で計算）

```sql
-- プロジェクト別の進捗（子タスク平均）を更新するトリガ、または以下ビュー
create view v_project_progress as
select p.id as project_id,
       coalesce(round(avg(t.progress)),0) as progress
from projects p left join tasks t on t.project_id = p.id
group by p.id;

-- ダッシュボード KPI（例）
create view v_dashboard_kpi as
select
  (select count(*) from projects where status='in_progress') as active_projects,
  (select count(*) from tasks)                                as total_tasks,
  (select count(*) from tasks where status='done')            as done_tasks,
  (select count(*) from tasks where due_date < current_date
        and status <> 'done')                                 as overdue_tasks;
```

## 7. シードデータ（demo）

`supabase/seed.sql` にスクショと同じデモデータを投入する（`docs/04` の各表の値）。
最低限: members 5 名（山田太郎=self, 佐藤花子, 鈴木一郎, 田中美咲, +1）、
projects 6 件（新規業務改革 / CRM導入支援 / 基幹システム刷新 / 補助金LP改善 / 社内業務効率化 / 営業資料リニューアル ほか）、
各 project に tasks 4〜5 件、milestones、actions、notifications を数件。

## 8. 型生成

```bash
supabase gen types typescript --project-id <ref> > src/types/database.ts
```
アプリ側はこの生成型を `Database` として利用し、`Tables<'tasks'>` 等で参照する。
ドメイン型（表示用に整形した `Task`, `Project`）は `src/types/domain.ts` に別途定義し、
クエリ層（`src/lib/queries`）でマッピングする。
