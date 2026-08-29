-- ================================================================
-- GÓP Ý BUỔI HỌC — học viên gửi ý kiến, admin tổng hợp
-- Chạy trong Supabase SQL Editor (hoặc đã gộp trong CHAY_TAT_CA_SQL.sql)
-- ================================================================

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
CREATE INDEX IF NOT EXISTS idx_sf_open       ON session_feedback(is_open);
CREATE INDEX IF NOT EXISTS idx_sfr_feedback  ON session_feedback_replies(feedback_id);
CREATE INDEX IF NOT EXISTS idx_sfr_user      ON session_feedback_replies(username);

ALTER TABLE session_feedback         REPLICA IDENTITY FULL;
ALTER TABLE session_feedback_replies REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE session_feedback;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE session_feedback_replies;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
