-- Cho phép / không cho phép học viên tải video & tài liệu bài học
-- Chạy 1 lần trong Supabase SQL Editor

ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT FALSE;
ALTER TABLE lesson_docs  ADD COLUMN IF NOT EXISTS allow_download BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN lesson_videos.allow_download IS 'TRUE = học viên được tải video';
COMMENT ON COLUMN lesson_docs.allow_download  IS 'TRUE = học viên được tải tài liệu';
