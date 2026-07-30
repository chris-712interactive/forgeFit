-- Allow Pro users to clear (hide) program workouts for an active plan week
-- so they can replace them with custom day assignments.

CREATE TABLE user_program_week_clears (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id       UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  week_start_date  DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_user_program_week_clears_user_week
  ON user_program_week_clears (user_id, week_start_date);

ALTER TABLE user_program_week_clears ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own program week clears"
  ON user_program_week_clears
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
