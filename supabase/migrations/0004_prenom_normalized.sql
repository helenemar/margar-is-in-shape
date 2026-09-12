-- Enable the unaccent extension (available by default in Supabase)
create extension if not exists unaccent;

-- unaccent() is not IMMUTABLE by default, which is required for generated columns.
-- This wrapper calls the extension with an explicit dictionary, which Postgres
-- can prove immutable.
create or replace function immutable_unaccent(text)
  returns text
  language sql immutable parallel safe strict
as $$
  select unaccent('unaccent', $1);
$$;

-- Add a stored generated column with the normalized prenom.
-- immutable_unaccent + lower strips accents and lowercases, e.g. "Hélène" → "helene".
alter table profiles
  add column if not exists prenom_normalized text
  generated always as (lower(immutable_unaccent(prenom))) stored;

-- Drop the old case-sensitive / accent-sensitive unique constraint.
alter table profiles
  drop constraint if exists profiles_group_id_prenom_key;

-- Add the new normalized unique constraint.
-- This prevents two profiles that differ only by case or accents in the same group.
alter table profiles
  add constraint profiles_group_id_prenom_normalized_key
  unique (group_id, prenom_normalized);
