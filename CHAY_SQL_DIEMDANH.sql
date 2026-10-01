-- ============================================================
-- HỆ THỐNG ĐIỂM DANH — DHDT LMS
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- Buổi học
create table if not exists dd_sessions (
  id           bigint generated always as identity primary key,
  title        text not null,
  class_name   text not null,
  session_date date not null,
  start_time   time not null,
  end_time     time not null,
  meet_link    text default null,
  status       text default 'scheduled', -- scheduled | open | closed
  auto_open    boolean default false,
  auto_close   boolean default false,
  created_by   text default 'admin',
  created_at   timestamptz default now()
);

-- Bản ghi điểm danh
create table if not exists dd_records (
  id             bigint generated always as identity primary key,
  session_id     bigint references dd_sessions(id) on delete cascade,
  username       text not null,
  student_name   text default null,
  class_name     text default null,
  status         text default 'absent',  -- present | late | absent | excused
  check_in_time  timestamptz default null,
  device         text default null,
  note           text default null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(session_id, username)
);

-- Đơn xin vắng
create table if not exists dd_absences (
  id           bigint generated always as identity primary key,
  session_id   bigint references dd_sessions(id) on delete cascade,
  username     text not null,
  student_name text default null,
  class_name   text default null,
  reason_type  text default 'other',  -- health | family | exam | personal | other
  reason_detail text default null,
  proof_url    text default null,
  status       text default 'pending', -- pending | approved | rejected
  admin_note   text default null,
  reviewed_by  text default null,
  reviewed_at  timestamptz default null,
  created_at   timestamptz default now(),
  unique(session_id, username)
);

-- Tắt RLS
alter table dd_sessions disable row level security;
alter table dd_records  disable row level security;
alter table dd_absences disable row level security;

-- Thêm cột nếu bảng đã tồn tại (migration)
alter table dd_sessions add column if not exists auto_open  boolean default false;
alter table dd_sessions add column if not exists auto_close boolean default false;
create index if not exists idx_dd_sessions_date  on dd_sessions(session_date);
create index if not exists idx_dd_sessions_class on dd_sessions(class_name);
create index if not exists idx_dd_sessions_status on dd_sessions(status);
create index if not exists idx_dd_records_session on dd_records(session_id);
create index if not exists idx_dd_records_user    on dd_records(username);
create index if not exists idx_dd_absences_session on dd_absences(session_id);
create index if not exists idx_dd_absences_status  on dd_absences(status);
