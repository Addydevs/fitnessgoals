-- AI photo analysis scores (structured output from the aicoach edge function).
-- Shape: { overall_progress, leanness, muscle_definition, posture, photo_quality, focus_areas[] }
alter table public.photos
  add column if not exists ai_scores jsonb;
