-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00004: Update Payment Model to Amount & Hours
-- Engine:  PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. Rename daily_wage to payment_amount and add estimated_hours
ALTER TABLE public.jobs RENAME COLUMN daily_wage TO payment_amount;
ALTER TABLE public.jobs ADD COLUMN estimated_hours NUMERIC;

COMMENT ON COLUMN public.jobs.payment_amount IS 'Total payment amount for the job.';
COMMENT ON COLUMN public.jobs.estimated_hours IS 'Estimated number of hours required for the job.';

-- 2. Update get_filtered_jobs_v2 to reflect the new columns
DROP FUNCTION IF EXISTS get_filtered_jobs_v2;

CREATE OR REPLACE FUNCTION get_filtered_jobs_v2(
    worker_lat   FLOAT,
    worker_lng   FLOAT,
    radius_meters FLOAT,
    search_query TEXT    DEFAULT NULL,
    min_wage     NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    output_payload JSON;
BEGIN
    WITH filtered_pool AS (
        SELECT
            j.id,
            j.work_name,
            j.voice_note_url,
            j.payment_amount,
            j.estimated_hours,
            j.status,
            p.full_name   AS recruiter_name,
            p.phone_number AS recruiter_phone,
            extensions.ST_Y(j.job_location::extensions.geometry)  AS latitude,
            extensions.ST_X(j.job_location::extensions.geometry)  AS longitude,
            ROUND(
                (extensions.ST_Distance(
                    j.job_location,
                    extensions.ST_MakePoint(worker_lng, worker_lat)::extensions.geography
                ))::NUMERIC,
                0
            ) AS distance_meters
        FROM public.jobs j
        JOIN public.profiles p ON j.recruiter_id = p.id
        WHERE j.status = 'open'
          AND j.payment_amount >= min_wage
          AND extensions.ST_DWithin(
                j.job_location,
                extensions.ST_MakePoint(worker_lng, worker_lat)::extensions.geography,
                radius_meters
              )
          AND (
                search_query IS NULL
                OR search_query = ''
                OR j.work_name ILIKE '%' || search_query || '%'
              )
        ORDER BY j.job_location
            OPERATOR(extensions.<->)
            extensions.ST_MakePoint(worker_lng, worker_lat)::extensions.geography
    )
    SELECT json_build_object(
        'results', json_agg(filtered_pool.*)
    ) INTO output_payload
    FROM filtered_pool;

    -- Return an empty results array instead of NULL when no jobs match.
    RETURN COALESCE(
        output_payload,
        json_build_object('results', json_build_array())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
