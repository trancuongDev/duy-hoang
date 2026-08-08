-- ================================================================
-- ĐIỂM DANH (ATTENDANCE SYSTEM)
-- Chạy file này trong Supabase SQL Editor
-- ================================================================

-- ── 1. ATTENDANCE_SESSIONS (buổi điểm danh) ──────────────────────
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,          -- VD: "Buổi học 15/01 - Toán 12A"
  class_name  text NOT NULL,
  session_date date NOT NULL,
  start_time  time,                   -- Giờ bắt đầu
  end_time    time,                   -- Giờ kết thúc
  meet_link   text,                   -- Link Google Meet (optional)
  description text,
  is_active   boolean DEFAULT true,   -- Đang mở điểm danh
  created_by  text,                   -- Username admin tạo
  created_at  timestamptz DEFAULT now()
);

-- ── 2. ATTENDANCE (điểm danh của từng học sinh) ──────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id                bigserial PRIMARY KEY,
  session_id        bigint REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  username          text NOT NULL,
  student_name      text,
  class_name        text,
  status            text DEFAULT 'absent',  -- 'present' | 'absent' | 'late' | 'excused'
  check_in_time     timestamptz,
  proof_image_url   text,                   -- URL ảnh đã vào Google Meet
  absence_reason    text,                   -- Lý do vắng (nếu status = excused)
  notes             text,                   -- Ghi chú của GV
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(session_id, username)
);

-- ── 3. ATTENDANCE_IMAGES (lưu ảnh upload) ────────────────────────
CREATE TABLE IF NOT EXISTS attendance_images (
  id            bigserial PRIMARY KEY,
  attendance_id bigint REFERENCES attendance(id) ON DELETE CASCADE,
  image_url     text NOT NULL,
  uploaded_at   timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_images   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='attendance_sessions' AND policyname='allow_all_attendance_sessions'
  ) THEN
    CREATE POLICY "allow_all_attendance_sessions" ON attendance_sessions
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='attendance' AND policyname='allow_all_attendance'
  ) THEN
    CREATE POLICY "allow_all_attendance" ON attendance
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='attendance_images' AND policyname='allow_all_attendance_images'
  ) THEN
    CREATE POLICY "allow_all_attendance_images" ON attendance_images
      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- REALTIME — Bật realtime cho attendance (admin theo dõi live)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE attendance          REPLICA IDENTITY FULL;
ALTER TABLE attendance_sessions REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ════════════════════════════════════════════════════════════════
-- INDEX — Tăng tốc truy vấn
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_attendance_session    ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_username   ON attendance(username);
CREATE INDEX IF NOT EXISTS idx_attendance_status     ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_sessions_class_date   ON attendance_sessions(class_name, session_date);

-- ════════════════════════════════════════════════════════════════
-- STORAGE BUCKET cho ảnh điểm danh
-- Chạy trong Supabase Storage UI hoặc SQL:
-- ════════════════════════════════════════════════════════════════
-- Tạo bucket 'attendance-images' (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-images', 'attendance-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- XONG! Reload lại trang admin.html sau khi chạy xong.
-- ════════════════════════════════════════════════════════════════
