-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00016: Push Notifications Setup
-- Engine:  PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Rename fcm_token to push_token for semantic clarity (Expo Push)
-- ALTER TABLE public.profiles
-- RENAME COLUMN fcm_token TO push_token;

-- 2. Ensure pg_net extension is available for database webhooks
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.webhook_job_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- We only fire when a job goes from open to matched
  IF NEW.status = 'matched' AND OLD.status = 'open' THEN
    PERFORM net.http_post(
      url := 'https://kybjiexugumywciusbna.supabase.co/functions/v1/push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_DSm1xyNsvWxzEZDYaWK2lQ_-d7bA-Gp'
      ),
      body := jsonb_build_object(
        'event_type', 'JOB_ACCEPTED',
        'record', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_job_accepted ON public.jobs;
CREATE TRIGGER trg_job_accepted
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.webhook_job_accepted();


CREATE OR REPLACE FUNCTION public.webhook_job_posted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://kybjiexugumywciusbna.supabase.co/functions/v1/push-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_DSm1xyNsvWxzEZDYaWK2lQ_-d7bA-Gp'
    ),
    body := jsonb_build_object(
      'event_type', 'JOB_POSTED',
      'record', row_to_json(NEW)::jsonb || jsonb_build_object(
        'job_lat', ST_Y(NEW.job_location::geometry),
        'job_lng', ST_X(NEW.job_location::geometry)
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_job_posted ON public.jobs;
CREATE TRIGGER trg_job_posted
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.webhook_job_posted();


-- 5. RPC to find workers matching a newly posted job
CREATE OR REPLACE FUNCTION get_push_tokens_for_new_job(
    job_id UUID,
    j_lat FLOAT,
    j_lng FLOAT,
    j_name TEXT
)
RETURNS TABLE(push_token TEXT, app_language TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.push_token, p.app_language
    FROM public.profiles p
    WHERE p.role = 'worker'
      AND p.push_token IS NOT NULL
      -- Filter by distance: distance between worker and job <= worker's search_radius_km
      AND extensions.ST_DWithin(
          p.last_location,
          extensions.ST_MakePoint(j_lng, j_lat)::extensions.geography,
          p.search_radius_km * 1000 -- convert km to meters
      )
      -- Filter by skills: work_name matches any of the worker's desired_skills
      AND (
          p.desired_skills IS NULL
          OR array_length(p.desired_skills, 1) IS NULL
          OR EXISTS (
              SELECT 1
              FROM unnest(p.desired_skills) AS skill
              WHERE j_name ILIKE '%' || skill || '%'
          )
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
