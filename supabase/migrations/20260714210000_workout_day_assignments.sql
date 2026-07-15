-- Phase 11b: Assign custom workout templates to calendar days

CREATE TABLE user_workout_day_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES user_workout_templates(id) ON DELETE CASCADE,
  scheduled_date  DATE NOT NULL,
  replaces_program BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id, scheduled_date)
);

CREATE INDEX idx_user_workout_day_assignments_user_date
  ON user_workout_day_assignments (user_id, scheduled_date);

ALTER TABLE user_workout_day_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout day assignments"
  ON user_workout_day_assignments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
