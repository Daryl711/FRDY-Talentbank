-- ============================================================================
-- FIX: add the Animal Persona columns to the live database.
-- These are declared in schema.sql but were never applied to this project, so
-- the quiz result had nowhere to be stored and the quiz reappeared on every
-- sign-in. Run this once in the Supabase SQL editor (Database -> SQL Editor).
-- Safe to re-run: `add column if not exists` is a no-op when the column exists.
-- ============================================================================

alter table profiles add column if not exists animal_trait  text;
alter table profiles add column if not exists animal_scores jsonb default '{}';

-- Force PostgREST to pick up the new columns immediately (otherwise the API can
-- keep reporting "column does not exist" from a stale schema cache).
notify pgrst, 'reload schema';
