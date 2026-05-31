-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00003: Add search_radius_km to profiles
-- Engine:  PostgreSQL 15+ (Supabase)
-- ============================================================================

-- Add search_radius_km column to public.profiles
ALTER TABLE public.profiles
ADD COLUMN search_radius_km NUMERIC NOT NULL DEFAULT 10 CHECK (search_radius_km > 0);

COMMENT ON COLUMN public.profiles.search_radius_km IS 'Worker preferred search radius for jobs in kilometers. Defaults to 10.';
