-- Phase 11: Custom workouts — session source + saved templates

CREATE TYPE workout_session_source AS ENUM ('program', 'custom', 'imported');

ALTER TABLE workout_sessions
  ADD COLUMN session_source workout_session_source NOT NULL DEFAULT 'program',
  ADD COLUMN template_id UUID NULL;

CREATE TABLE user_workout_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  exercises   JSONB NOT NULL,
  warmup      JSONB NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_workout_sessions_source ON workout_sessions (user_id, session_source);
CREATE INDEX idx_user_workout_templates_user ON user_workout_templates (user_id);

ALTER TABLE user_workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout templates"
  ON user_workout_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
