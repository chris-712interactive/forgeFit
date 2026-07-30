-- Phase 11c: Clear a plan week's program workouts so custom workouts can replace them

CREATE TABLE user_workout_week_program_clears (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date  DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_user_workout_week_program_clears_user
  ON user_workout_week_program_clears (user_id);

ALTER TABLE user_workout_week_program_clears ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout week program clears"
  ON user_workout_week_program_clears
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
