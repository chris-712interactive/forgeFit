-- Phase 9A (part 1): add sport_performance to fitness_goal enum.
-- Must be its own migration — PostgreSQL forbids using a new enum value
-- in the same transaction that adds it ("unsafe use of new value").

alter type public.fitness_goal add value if not exists 'sport_performance';
