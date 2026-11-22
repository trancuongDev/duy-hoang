-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Tính năng "Lời giải chi tiết" cho bài tập
-- Chạy trong Supabase Dashboard → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Cho phép giáo viên bật/tắt việc cho học sinh xem lời giải
--    (false = học sinh không thấy lời giải, chỉ GV thấy)
ALTER TABLE homework
  ADD COLUMN IF NOT EXISTS show_solution BOOLEAN DEFAULT FALSE;

-- 2. Đảm bảo Realtime bật cho bảng homework
--    (bỏ qua nếu bảng đã có trong publication)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE homework;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Index phục vị truy vấn lọc bài có lời giải
CREATE INDEX IF NOT EXISTS idx_homework_show_solution
  ON homework(show_solution)
  WHERE show_solution = TRUE;

-- ══════════════════════════════════════════════════════════════
-- GHI CHÚ:
-- - Lời giải chi tiết của từng câu được lưu trong cột `data`
--   của bảng homework_questions (JSONB), thuộc tính `solution`.
--   Ví dụ: data = { "solution": "Bước 1: ...\nBước 2: ...", ... }
--
-- - Trường `data` đã là JSONB nên KHÔNG cần migration thêm cột
--   cho phần lời giải — mọi bài cũ cũng dùng được ngay.
--
-- - Ví dụ cập nhật lời giải cho một câu có id = 123:
--
--   UPDATE homework_questions
--   SET data = jsonb_set(
--     COALESCE(data, '{}'::jsonb),
--     '{solution}',
--     to_jsonb('Bước 1: áp dụng công thức Newton-Raphson.
--                Bước 2: tính f(x) và f''(x).
--                Bước 3: lặp lại cho đến khi |x - x0| < 0.001')
--   )
--   WHERE id = 123;
--
-- ══════════════════════════════════════════════════════════════
