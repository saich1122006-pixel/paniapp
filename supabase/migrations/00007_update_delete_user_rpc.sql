-- ============================================================================
-- Migration 00007: Update Delete User RPC for complete data wipe
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Reset jobs accepted by this worker back to 'open' 
    -- (so the recruiter doesn't have a broken 'matched' job)
    UPDATE public.jobs 
    SET accepted_by = NULL, status = 'open' 
    WHERE accepted_by = current_user_id;

    -- 2. Delete all transactions where the user is either recruiter or worker
    DELETE FROM public.transactions 
    WHERE recruiter_id = current_user_id OR worker_id = current_user_id;

    -- 3. Delete all jobs posted by this recruiter
    DELETE FROM public.jobs 
    WHERE recruiter_id = current_user_id;

    -- 4. Delete the profile explicitly
    DELETE FROM public.profiles 
    WHERE id = current_user_id;

    -- 5. Delete the auth user (this will cascade to auth.identities, auth.sessions, etc.)
    DELETE FROM auth.users 
    WHERE id = current_user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user() IS 'Permanently deletes the user account and explicitly cleans up all related data in the public schema.';
