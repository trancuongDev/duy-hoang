-- ══════════════════════════════════════════════════════════════
-- CHẠY FILE NÀY 1 LẦN cho tính năng "LỜI GIẢI CHI TIẾT"
-- Supabase Dashboard → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Thêm cột show_solution vào bảng homework
--    true  = học sinh được xem lời giải sau khi nộp bài
--    false = học sinh KHÔNG thấy lời giải (mặc định)
ALTER TABLE homework
  ADD COLUMN IF NOT EXISTS show_solution BOOLEAN DEFAULT FALSE;

-- 2. Realtime bật cho bảng homework (bỏ qua nếu đã có)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE homework;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Realtime gửi đầy đủ giá trị cũ (payload.old) khi UPDATE
--    Không có dòng này thì thông báo "Bài tập mới" / "Bài bị khóa" không hoạt động.
ALTER TABLE homework            REPLICA IDENTITY FULL;
ALTER TABLE homework_submissions REPLICA IDENTITY FULL;
ALTER TABLE homework_questions  REPLICA IDENTITY FULL;
ALTER TABLE exam_progress        REPLICA IDENTITY FULL;

-- 4. Index lọc bài có lời giải (tùy chọn, không bắt buộc)
CREATE INDEX IF NOT EXISTS idx_homework_show_solution
  ON homework(show_solution)
  WHERE show_solution = TRUE;

-- ══════════════════════════════════════════════════════════════
-- LƯU Ý: Lời giải của từng câu nằm trong cột `data` (JSONB) của
-- bảng homework_questions, thuộc tính `solution` — KHÔNG cần
-- thêm cột mới cho phần này.
--
-- Ví dụ đặt lời giải cho câu có id = 123:
--
--   UPDATE homework_questions
--   SET data = jsonb_set(
--     COALESCE(data, '{}'::jsonb),
--     '{solution}',
--     to_jsonb('Buoc 1: ap dung cong thuc $E=mc^2$.
--                Buoc 2: ket luan $F=ma$.')
--   )
--   WHERE id = 123;
-- ══════════════════════════════════════════════════════════════
