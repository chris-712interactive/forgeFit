-- Fix ingredient suggestions after manual migration runs (grants + PostgREST cache).

grant insert on table public.nutrition_ingredient_suggestions to authenticated;

notify pgrst, 'reload schema';
