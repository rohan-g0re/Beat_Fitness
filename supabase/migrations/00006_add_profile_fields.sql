-- =====================================================
-- Migration: 00006_add_profile_fields
-- Description: Add height and weight to profiles table
-- =====================================================

-- Add height column (stored in cm for consistency)
alter table public.profiles 
  add column if not exists height numeric;

-- Add weight column (stored in kg for consistency)
alter table public.profiles 
  add column if not exists weight numeric;

comment on column public.profiles.height is 'User height in centimeters';
comment on column public.profiles.weight is 'User weight in kilograms';

