-- ══════════════════════════════════════════════════════════════════
-- CHẠY FILE NÀY 1 LẦN DUY NHẤT — Supabase SQL Editor → Run
-- Bao gồm TẤT CẢ migration cần thiết cho hệ thống DHDT LMS
-- ══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- PHẦN 1: Bảng homework — tính năng mới
-- ────────────────────────────────────────────────────────────────
ALTER TABLE homework ADD COLUMN IF NOT EXISTS open_at           TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN     DEFAULT FALSE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS shuffle_answers   BOOLEAN     DEFAULT FALSE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS anti_paste        BOOLEAN     DEFAULT FALSE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS is_locked         BOOLEAN     DEFAULT FALSE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS grading_notes     TEXT        DEFAULT NULL;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ DEFAULT NULL;

-- ────────────────────────────────────────────────────────────────
-- PHẦN 2: Bảng exam_progress — live monitor
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_progress (
  id               BIGSERIAL PRIMARY KEY,
  homework_id      BIGINT NOT NULL,
  username         TEXT NOT NULL,
  student_name     TEXT,
  class_name       TEXT,
  current_question INT         DEFAULT 0,
  answered_count   INT         DEFAULT 0,
  total_questions  INT         DEFAULT 0,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  elapsed_secs     INT         DEFAULT 0,
  status           TEXT        DEFAULT 'active',
  UNIQUE(homework_id, username)
);
ALTER TABLE exam_progress ADD COLUMN IF NOT EXISTS tab_violations    INT     DEFAULT 0;
ALTER TABLE exam_progress ADD COLUMN IF NOT EXISTS force_submit      BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_progress ADD COLUMN IF NOT EXISTS force_stopped     BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_progress ADD COLUMN IF NOT EXISTS flagged_questions TEXT    DEFAULT NULL;
ALTER TABLE exam_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exam_progress_select" ON exam_progress;
DROP POLICY IF EXISTS "exam_progress_insert" ON exam_progress;
DROP POLICY IF EXISTS "exam_progress_update" ON exam_progress;
DROP POLICY IF EXISTS "exam_progress_delete" ON exam_progress;
CREATE POLICY "exam_progress_select" ON exam_progress FOR SELECT USING (true);
CREATE POLICY "exam_progress_insert" ON exam_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "exam_progress_update" ON exam_progress FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "exam_progress_delete" ON exam_progress FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS idx_exam_progress_homework ON exam_progress(homework_id);
CREATE INDEX IF NOT EXISTS idx_exam_progress_updated  ON exam_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_progress_status   ON exam_progress(status, updated_at DESC);

-- ────────────────────────────────────────────────────────────────
-- PHẦN 3: File Manager
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_folders (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  icon       TEXT DEFAULT '📁',
  class_name TEXT DEFAULT NULL,
  parent_id  BIGINT REFERENCES file_folders(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  is_pinned  BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE file_folders DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS file_items (
  id             BIGSERIAL PRIMARY KEY,
  folder_id      BIGINT REFERENCES file_folders(id) ON DELETE SET NULL,
  display_name   TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_url       TEXT NOT NULL,
  file_type      TEXT DEFAULT 'other',
  file_size      BIGINT DEFAULT 0,
  class_name     TEXT DEFAULT NULL,
  tags           TEXT DEFAULT NULL,
  is_pinned      BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,
  deleted_at     TIMESTAMPTZ DEFAULT NULL,
  created_by     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE file_items DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS file_downloads (
  id            BIGSERIAL PRIMARY KEY,
  file_id       BIGINT REFERENCES file_items(id) ON DELETE CASCADE,
  username      TEXT NOT NULL,
  student_name  TEXT,
  class_name    TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE file_downloads DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_file_items_folder   ON file_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_items_deleted  ON file_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_file_downloads_file ON file_downloads(file_id);

-- Storage bucket cho file tài liệu
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public Access files" ON storage.objects;
CREATE POLICY "Public Access files" ON storage.objects
  FOR ALL USING (bucket_id = 'files') WITH CHECK (bucket_id = 'files');

-- ────────────────────────────────────────────────────────────────
-- PHẦN 4: Bật Realtime — mỗi bảng chạy riêng
-- Nếu dòng nào báo "already member" thì bỏ qua, KHÔNG phải lỗi
-- ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE homework;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE exam_progress;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE homework_submissions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE file_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE file_folders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────
-- PHẦN 5: Thư viện số — đề xuất học sinh + nguồn admin duyệt
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_suggestions (
  id            bigint generated always as identity primary key,
  title         text not null,
  url           text not null,
  source        text,
  category      text default 'open',
  description   text,
  note          text,
  student_name  text,
  username      text,
  class_name    text,
  status        text default 'pending',
  admin_note    text,
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);

CREATE TABLE IF NOT EXISTS library_resources (
  id             bigint generated always as identity primary key,
  title          text not null,
  url            text not null,
  source         text,
  category       text default 'open',
  description    text,
  tags           text default 'Mới',
  icon           text default '✨',
  color          text default '#fef3c7',
  suggestion_id  bigint references library_suggestions(id) on delete set null,
  added_by       text,
  active         boolean default true,
  created_at     timestamptz default now()
);

ALTER TABLE library_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE library_resources   DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE library_suggestions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE library_resources;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS library_reports (
  id             bigint generated always as identity primary key,
  resource_id    bigint,
  url            text not null,
  title          text,
  reason         text not null,
  note           text,
  student_name   text,
  username       text,
  class_name     text,
  status         text default 'pending',
  admin_note     text,
  created_at     timestamptz default now()
);

ALTER TABLE library_reports DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE library_reports;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────
-- PHẦN 6: Nhóm trao đổi Zalo
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discussion_groups (
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

CREATE TABLE IF NOT EXISTS discussion_group_joins (
  id            bigint generated always as identity primary key,
  group_id      bigint references discussion_groups(id) on delete cascade,
  username      text,
  student_code  text,
  student_name  text,
  class_name    text,
  created_at    timestamptz default now()
);

ALTER TABLE discussion_groups      DISABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_group_joins DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dg_joins_group ON discussion_group_joins(group_id);

CREATE TABLE IF NOT EXISTS discussion_group_suggestions (
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

ALTER TABLE discussion_group_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_group_suggestions ADD COLUMN IF NOT EXISTS group_id bigint;
CREATE INDEX IF NOT EXISTS idx_dg_sug_status ON discussion_group_suggestions(status);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE discussion_group_suggestions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE discussion_groups;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────
-- PHẦN 7: Tiến độ bài học — đánh dấu đã học / học tiếp
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id             bigint generated always as identity primary key,
  username       text not null,
  lesson_id      bigint not null references lessons(id) on delete cascade,
  status         text not null default 'in_progress',
  last_opened_at timestamptz default now(),
  completed_at   timestamptz,
  unique(username, lesson_id)
);
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS username       text;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS lesson_id      bigint;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS status         text default 'in_progress';
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_opened_at timestamptz default now();
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_at   timestamptz;
UPDATE lesson_progress SET last_opened_at = now() WHERE last_opened_at IS NULL;
UPDATE lesson_progress SET status = 'in_progress' WHERE status IS NULL;
ALTER TABLE lesson_progress DISABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_username_lesson_id_key
  ON lesson_progress(username, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lp_user ON lesson_progress(username);
CREATE INDEX IF NOT EXISTS idx_lp_user_opened ON lesson_progress(username, last_opened_at DESC);

-- ────────────────────────────────────────────────────────────────
-- PHẦN 8: Góp ý buổi học
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_feedback (
  id              bigserial PRIMARY KEY,
  title           text NOT NULL,
  class_name      text NOT NULL,
  session_date    date NOT NULL,
  prompt          text,
  attendance_id   bigint,
  is_open         boolean DEFAULT true,
  admin_note      text,
  created_by      text,
  created_at      timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS session_feedback_replies (
  id              bigserial PRIMARY KEY,
  feedback_id     bigint REFERENCES session_feedback(id) ON DELETE CASCADE,
  username        text NOT NULL,
  student_name    text,
  class_name      text,
  rating          int CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  pace            text,
  understood      text,
  want_review     text,
  comment         text NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(feedback_id, username)
);
ALTER TABLE session_feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback_replies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='session_feedback' AND policyname='allow_all_session_feedback'
  ) THEN
    CREATE POLICY "allow_all_session_feedback" ON session_feedback
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='session_feedback_replies' AND policyname='allow_all_session_feedback_replies'
  ) THEN
    CREATE POLICY "allow_all_session_feedback_replies" ON session_feedback_replies
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_sf_class_date ON session_feedback(class_name, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sfr_feedback  ON session_feedback_replies(feedback_id);
CREATE INDEX IF NOT EXISTS idx_sfr_user      ON session_feedback_replies(username);
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE session_feedback;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE session_feedback_replies;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
