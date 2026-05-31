-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00014: Skill-Based Job Filtering
-- Engine:  PostgreSQL 15+ (Supabase)
-- ============================================================================
-- Workers should only see jobs whose work_name partially matches one of their
-- desired_skills.  E.g. a worker with skill "painting" sees jobs named
-- "House painting needed", "Painting & cleaning", etc.
--
-- The RPC now accepts an optional worker_skills TEXT[] parameter.
-- When provided (and non-empty), it filters jobs where work_name ILIKE any
-- of the skills.  When NULL or empty, all open jobs are returned (backward
-- compatible — also covers workers who haven't set skills yet).
-- ============================================================================

DROP FUNCTION IF EXISTS get_filtered_jobs_v2;

CREATE OR REPLACE FUNCTION get_filtered_jobs_v2(
    worker_lat    FLOAT,
    worker_lng    FLOAT,
    radius_meters FLOAT,
    search_query  TEXT    DEFAULT NULL,
    min_wage      NUMERIC DEFAULT 0,
    worker_skills TEXT[]  DEFAULT NULL
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
            j.location_address,
            j.created_at,
            p.full_name    AS recruiter_name,
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
          -- Free-text search filter (existing behaviour)
          AND (
                search_query IS NULL
                OR search_query = ''
                OR j.work_name ILIKE '%' || search_query || '%'
              )
          -- Skill-based filter: match work_name against ANY of the worker's skills
          -- When worker_skills is NULL or empty, this clause is skipped (show all)
          AND (
                worker_skills IS NULL
                OR array_length(worker_skills, 1) IS NULL
                OR EXISTS (
                    SELECT 1
                    FROM unnest(worker_skills) AS skill
                    WHERE j.work_name ILIKE '%' || skill || '%'
                )
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

COMMENT ON FUNCTION get_filtered_jobs_v2 IS
    'KNN spatial search: returns open jobs within radius_meters of (lat,lng), '
    'filtered by keyword, minimum wage, and optionally by worker skills '
    '(partial match on work_name).';
