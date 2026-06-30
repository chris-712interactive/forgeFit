-- Optional acquisition / previous-app source from onboarding (analytics segmentation).
alter table public.profiles
  add column if not exists signup_source text;

comment on column public.profiles.signup_source is
  'Optional onboarding answer: previous app or discovery channel (e.g. myfitnesspal, strong, search).';
