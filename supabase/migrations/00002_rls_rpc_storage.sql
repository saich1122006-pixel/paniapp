-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00002: Spatial RPC, Row Level Security & Storage Buckets
-- Engine:  PostgreSQL 15+ (Supabase)
-- Author:  Database Engineering Team
-- Date:    2026-05-28
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. SPATIAL MATCHING RPC FUNCTION                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Called from FlutterFlow / client as:
--   supabase.rpc('get_filtered_jobs_v2', {
--       worker_lat: 17.385,
--       worker_lng: 78.486,
--       radius_meters: 5000,
--       search_query: 'painting',
--       min_wage: 500
--   })
--
-- Returns a JSON object:  { "results": [ { id, work_name, distance_meters, … }, … ] }
-- Uses the GIST index on jobs(job_location) for sub-ms KNN ordering.
-- `security definer` runs with the function owner's privileges so RLS
-- doesn't block the cross-table join (profiles + jobs).

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
            j.daily_wage,
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
          AND j.daily_wage >= min_wage
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

COMMENT ON FUNCTION get_filtered_jobs_v2 IS
    'KNN spatial search: returns open jobs within radius_meters of (lat,lng), '
    'optionally filtered by keyword and minimum wage.';


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. ROW LEVEL SECURITY (RLS)                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ----- Enable RLS on all tables -----
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;


-- ========================  PROFILES  ========================

-- Anyone (including anon) can read profiles — needed for showing recruiter
-- names on job cards and worker lists.
CREATE POLICY "Allow public read access to profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can only update their own profile row.
CREATE POLICY "Allow users to update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can only insert a profile for themselves (triggered on sign-up).
CREATE POLICY "Allow users to insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- ========================  JOBS  ========================

-- Workers see open jobs; recruiters and matched workers see their own jobs
-- regardless of status.
CREATE POLICY "Allow anyone to view open jobs"
    ON public.jobs FOR SELECT
    USING (
        status = 'open'
        OR auth.uid() = recruiter_id
        OR auth.uid() = accepted_by
    );

-- Only the recruiter who owns the row can create a job.
CREATE POLICY "Allow authenticated recruiters to create jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

-- The recruiter can update their own job; the matched worker can also
-- update (e.g. mark arrival / completion).
CREATE POLICY "Allow recruiters or matched workers to update jobs"
    ON public.jobs FOR UPDATE
    USING (
        auth.uid() = recruiter_id
        OR auth.uid() = accepted_by
    );


-- ========================  TRANSACTIONS  ========================

-- Only the two parties involved can see a transaction.
CREATE POLICY "Allow parties involved to view transactions"
    ON public.transactions FOR SELECT
    USING (
        auth.uid() = recruiter_id
        OR auth.uid() = worker_id
    );

-- Either party can create a transaction record.
CREATE POLICY "Allow parties involved to insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (
        auth.uid() = recruiter_id
        OR auth.uid() = worker_id
    );

-- Either party can update (e.g. worker confirms receipt).
CREATE POLICY "Allow parties involved to update transactions"
    ON public.transactions FOR UPDATE
    USING (
        auth.uid() = recruiter_id
        OR auth.uid() = worker_id
    );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. STORAGE BUCKETS & POLICIES                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ----- Create buckets (idempotent) -----

-- Voice notes attached to job posts.
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-audio', 'job-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Payment receipt screenshots.
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;


-- ----- Storage object policies -----

-- Public read for audio files (workers need to listen before accepting).
CREATE POLICY "Allow public access to audio files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'job-audio');

-- Only authenticated users can upload voice notes.
CREATE POLICY "Allow authenticated users to upload audio files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'job-audio'
        AND auth.role() = 'authenticated'
    );

-- Public read for receipts (both parties can view proof-of-payment).
CREATE POLICY "Allow public access to receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

-- Only authenticated users can upload receipt screenshots.
CREATE POLICY "Allow authenticated users to upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
    );


-- ============================================================================
-- Migration complete.
-- ============================================================================
