-- Phase 13: Interval protocols on custom workout templates

ALTER TABLE user_workout_templates
  ADD COLUMN IF NOT EXISTS interval_protocol JSONB NULL;
