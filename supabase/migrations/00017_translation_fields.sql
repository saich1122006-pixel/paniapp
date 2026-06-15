-- Migration: Add translations JSONB column to jobs, profiles, and support_tickets tables

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Example JSON structure for translations:
-- {
--   "hi": { "work_name": "पेंटर", "full_name": "जॉन डोल" },
--   "te": { "work_name": "పెయింటర్", "full_name": "జాన్ డోయ్" }
-- }
