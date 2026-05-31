-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00001: Initial Schema Setup
-- Engine:  PostgreSQL 15+ (Supabase)
-- Author:  Database Engineering Team
-- Date:    2026-05-28
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. EXTENSIONS                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- PostGIS: spatial queries & geography types (installed in the extensions schema
-- per Supabase convention so it doesn't pollute public).
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- pgcrypto: gen_random_uuid() for primary-key generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. CUSTOM ENUM TYPES                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- User role: every profile is either a worker looking for gigs or a recruiter
-- posting them. Kept as a DB-level enum so invalid values are impossible.
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('worker', 'recruiter');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Job lifecycle states.
DO $$ BEGIN
    CREATE TYPE public.job_status AS ENUM ('open', 'matched', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment verification workflow states.
DO $$ BEGIN
    CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. PROFILES TABLE                                                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- One-to-one with auth.users. This is the single source of truth for every
-- user's profile data, spatial location, and wallet state.

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key mirrors auth.users.id (1:1 relationship).
    id                  UUID        PRIMARY KEY
                                    REFERENCES auth.users (id) ON DELETE CASCADE,

    phone_number        TEXT        UNIQUE NOT NULL,
    full_name           TEXT,

    -- Worker or recruiter.
    role                public.user_role NOT NULL,

    -- Real-time online/offline toggle (set by the app on foreground/background).
    is_online           BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Firebase Cloud Messaging token for push notifications.
    fcm_token           TEXT,

    -- UI language preference; constrained to supported locales.
    app_language        TEXT        CHECK (app_language IN ('en', 'te', 'hi')),

    -- Skills the worker is interested in (or recruiter commonly hires for).
    desired_skills      TEXT[],

    -- Minimum acceptable daily wage (workers set this as a floor).
    min_wage_floor      NUMERIC     CHECK (min_wage_floor >= 0),

    -- In-app wallet balance (credits / escrow).
    wallet_balance      NUMERIC     NOT NULL DEFAULT 0
                                    CHECK (wallet_balance >= 0),

    -- Has the user completed at least one verified payment cycle?
    first_pay_verified  BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Live GPS location stored as a geography POINT (SRID 4326 = WGS 84).
    -- Using geography (not geometry) gives us meter-accurate ST_DWithin queries.
    last_location       geography(POINT, 4326),

    -- Housekeeping timestamps.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles IS 'User profiles linked 1:1 with auth.users.';
COMMENT ON COLUMN public.profiles.last_location IS 'WGS 84 point; used for proximity matching via GIST index.';


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. JOBS TABLE                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Each row is a single day-labor gig posted by a recruiter.

CREATE TABLE IF NOT EXISTS public.jobs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The recruiter who created the job.
    recruiter_id        UUID        NOT NULL
                                    REFERENCES public.profiles (id) ON DELETE CASCADE,

    work_name           TEXT        NOT NULL,

    -- Optional voice description (Supabase Storage URL).
    voice_note_url      TEXT,

    -- Offered daily wage in INR.
    daily_wage          NUMERIC     NOT NULL CHECK (daily_wage > 0),

    -- Lifecycle status with a sane default.
    status              public.job_status NOT NULL DEFAULT 'open',

    -- Where the work takes place (geography POINT, SRID 4326).
    job_location        geography(POINT, 4326),

    -- Filled once a worker accepts the job.
    accepted_by         UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
    accepted_at         TIMESTAMPTZ,

    -- Standard creation timestamps.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.jobs IS 'Day-labor gigs posted by recruiters.';
COMMENT ON COLUMN public.jobs.job_location IS 'WGS 84 point; indexed with GIST for radius searches.';


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. TRANSACTIONS TABLE                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Tracks every payment between a recruiter and a worker for a completed job.

CREATE TABLE IF NOT EXISTS public.transactions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The job this payment relates to.
    job_id              UUID        NOT NULL
                                    REFERENCES public.jobs (id) ON DELETE CASCADE,

    -- Denormalized for fast ledger queries (avoids joining through jobs).
    recruiter_id        UUID        NOT NULL
                                    REFERENCES public.profiles (id) ON DELETE CASCADE,
    worker_id           UUID        NOT NULL
                                    REFERENCES public.profiles (id) ON DELETE CASCADE,

    -- Payment amount in INR.
    amount              NUMERIC     NOT NULL CHECK (amount > 0),

    -- Proof-of-payment screenshot (Supabase Storage URL).
    screenshot_url      TEXT,

    -- Worker must confirm receipt before we mark the txn verified.
    worker_confirmed    BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Three-state verification workflow.
    verification_status public.verification_status NOT NULL DEFAULT 'pending',

    -- Housekeeping timestamps.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transactions IS 'Payment ledger for completed jobs.';


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. SPATIAL INDEXES (GIST)                                             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- GIST indexes on geography columns enable sub-millisecond ST_DWithin and
-- KNN (<->) queries — critical for the "workers near me" feature.

CREATE INDEX IF NOT EXISTS idx_profiles_last_location
    ON public.profiles USING GIST (last_location);

CREATE INDEX IF NOT EXISTS idx_jobs_job_location
    ON public.jobs USING GIST (job_location);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  7. SUPPORTING INDEXES                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Extra B-tree indexes for the most common query patterns.

-- Fast lookup of all jobs by a specific recruiter.
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id
    ON public.jobs (recruiter_id);

-- Filter open jobs quickly (feed queries).
CREATE INDEX IF NOT EXISTS idx_jobs_status
    ON public.jobs (status);

-- Transaction history per job / user.
CREATE INDEX IF NOT EXISTS idx_transactions_job_id
    ON public.transactions (job_id);

CREATE INDEX IF NOT EXISTS idx_transactions_worker_id
    ON public.transactions (worker_id);

CREATE INDEX IF NOT EXISTS idx_transactions_recruiter_id
    ON public.transactions (recruiter_id);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  8. AUTO-UPDATE TRIGGER FOR updated_at                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- A reusable trigger function that bumps `updated_at` on every UPDATE.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to every table that carries an updated_at column.
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.jobs;
CREATE TRIGGER trg_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- Migration complete.
-- ============================================================================
