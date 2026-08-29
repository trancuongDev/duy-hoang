-- Nhóm trao đổi Zalo + đề xuất mở nhóm — chạy trong Supabase SQL Editor
-- (CREATE TABLE IF NOT EXISTS: chạy lại an toàn nếu đã có bảng nhóm cũ)

create table if not exists discussion_groups (
  id           bigint generated always as identity primary key,
  name         text not null,
  description  text,
  class_name   text,
  zalo_url     text not null,
  icon         text default '💬',
  color        text default '#dbeafe',
  active       boolean default true,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

create table if not exists discussion_group_joins (
  id            bigint generated always as identity primary key,
  group_id      bigint references discussion_groups(id) on delete cascade,
  username      text,
  student_code  text,
  student_name  text,
  class_name    text,
  created_at    timestamptz default now()
);

alter table discussion_groups      disable row level security;
alter table discussion_group_joins disable row level security;

create index if not exists idx_dg_joins_group on discussion_group_joins(group_id);

create table if not exists discussion_group_suggestions (
  id            bigint generated always as identity primary key,
  name          text not null,
  class_name    text,
  reason        text,
  zalo_url      text,
  student_name  text,
  username      text,
  student_code  text,
  status        text default 'pending',
  admin_note    text,
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);

alter table discussion_group_suggestions disable row level security;
create index if not exists idx_dg_sug_status on discussion_group_suggestions(status);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE discussion_group_suggestions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE discussion_groups;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
