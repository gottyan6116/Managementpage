-- ProManage 初期スキーマ (docs/03_data_model.md より)
-- 適用: supabase db push もしくは SQL Editor に貼り付け

-- ============ ENUM ============
create type task_status   as enum ('todo','in_progress','done','on_hold','canceled');
create type project_status as enum ('in_progress','final_check','done','on_hold','canceled');
create type priority       as enum ('low','medium','high');

-- ============ members（担当者マスタ） ============
create table members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  role        text,
  avatar_url  text,
  color       text default '#3B82F6',
  is_self     boolean default false,
  created_at  timestamptz default now()
);

-- ============ projects ============
create table projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  client       text,
  color        text default '#3B82F6',
  phase        text,
  status       project_status default 'in_progress',
  priority     priority default 'medium',
  progress     int default 0 check (progress between 0 and 100),
  start_date   date,
  end_date     date,
  next_due     date,
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============ project_members ============
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  member_id  uuid references members(id) on delete cascade,
  primary key (project_id, member_id)
);

-- ============ board_columns ============
create table board_columns (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  position   int not null,
  created_at timestamptz default now()
);

-- ============ tasks ============
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references projects(id) on delete cascade,
  parent_task_id   uuid references tasks(id) on delete cascade,
  board_column_id  uuid references board_columns(id) on delete set null,
  title            text not null,
  status           task_status default 'todo',
  priority         priority default 'medium',
  progress         int default 0 check (progress between 0 and 100),
  start_date       date,
  due_date         date,
  is_milestone     boolean default false,
  sort_order       int default 0,
  board_position   int default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============ task_assignees ============
create table task_assignees (
  task_id   uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ============ task_dependencies ============
create table task_dependencies (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  predecessor_id  uuid not null references tasks(id) on delete cascade,
  successor_id    uuid not null references tasks(id) on delete cascade,
  unique (predecessor_id, successor_id)
);

-- ============ milestones ============
create table milestones (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title      text not null,
  due_date   date not null,
  is_done    boolean default false,
  created_at timestamptz default now()
);

-- ============ actions ============
create table actions (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  title       text not null,
  due_date    date,
  is_done     boolean default false,
  created_at  timestamptz default now()
);

-- ============ notifications ============
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  type        text,
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
  body       text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table files (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  name         text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz default now()
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

-- ============ インデックス ============
create index on tasks (owner_id);
create index on tasks (project_id);
create index on tasks (due_date);
create index on tasks (board_column_id, board_position);
create index on projects (owner_id, sort_order);
create index on milestones (due_date);
create index on task_assignees (member_id);

-- ============ 集計ビュー ============
create view v_project_progress as
select p.id as project_id,
       coalesce(round(avg(t.progress)),0) as progress
from projects p left join tasks t on t.project_id = p.id
group by p.id;

create view v_dashboard_kpi as
select
  (select count(*) from projects where status='in_progress') as active_projects,
  (select count(*) from tasks)                                as total_tasks,
  (select count(*) from tasks where status='done')            as done_tasks,
  (select count(*) from tasks where due_date < current_date
        and status <> 'done')                                 as overdue_tasks;

-- ============ RLS（オーナー本人の行のみ全操作可） ============
alter table members            enable row level security;
alter table projects           enable row level security;
alter table project_members    enable row level security;
alter table board_columns      enable row level security;
alter table tasks              enable row level security;
alter table task_assignees     enable row level security;
alter table task_dependencies  enable row level security;
alter table milestones         enable row level security;
alter table actions            enable row level security;
alter table notifications      enable row level security;
alter table documents          enable row level security;
alter table files              enable row level security;
alter table notes              enable row level security;

-- owner_id を持つテーブル: owner_id = auth.uid()
create policy owner_all_members        on members           for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_projects       on projects          for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_board_columns  on board_columns     for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_tasks          on tasks             for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_task_deps      on task_dependencies for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_milestones     on milestones        for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_actions        on actions           for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_notifications  on notifications     for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_documents      on documents         for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_files          on files             for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy owner_all_notes          on notes             for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 中間テーブル: 親行の owner を辿って判定
create policy owner_all_project_members on project_members for all
  using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy owner_all_task_assignees on task_assignees for all
  using (exists (select 1 from tasks t where t.id = task_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = task_id and t.owner_id = auth.uid()));
