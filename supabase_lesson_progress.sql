-- Tiến độ bài học: đánh dấu đã học / học tiếp
-- Chạy lại an toàn nếu bảng đã tồn tại (thiếu cột)

create table if not exists lesson_progress (
  id             bigint generated always as identity primary key,
  username       text not null,
  lesson_id      bigint not null references lessons(id) on delete cascade,
  status         text not null default 'in_progress',
  last_opened_at timestamptz default now(),
  completed_at   timestamptz,
  unique(username, lesson_id)
);

alter table lesson_progress add column if not exists username       text;
alter table lesson_progress add column if not exists lesson_id      bigint;
alter table lesson_progress add column if not exists status         text default 'in_progress';
alter table lesson_progress add column if not exists last_opened_at timestamptz default now();
alter table lesson_progress add column if not exists completed_at   timestamptz;

update lesson_progress set last_opened_at = now() where last_opened_at is null;
update lesson_progress set status = 'in_progress' where status is null;

alter table lesson_progress disable row level security;

create unique index if not exists lesson_progress_username_lesson_id_key
  on lesson_progress(username, lesson_id);
create index if not exists idx_lp_user on lesson_progress(username);
create index if not exists idx_lp_user_opened on lesson_progress(username, last_opened_at desc);
