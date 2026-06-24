-- Store ingredient breakdown on nutrition log entries (meal/recipe logging).

alter table public.nutrition_logs
  add column if not exists line_items jsonb,
  add column if not exists servings_logged numeric(8, 2);

comment on column public.nutrition_logs.line_items is
  'Optional ingredient breakdown [{ foodId, foodName, servingLabel, quantity, calories, proteinG, carbsG, fatG }]';

comment on column public.nutrition_logs.servings_logged is
  'Number of recipe servings logged when line_items present';
