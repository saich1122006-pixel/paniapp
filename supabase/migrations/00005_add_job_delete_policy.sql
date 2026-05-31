-- Migration 00005: Add Delete Policy for Jobs
-- Allows recruiters to delete their own job posts at any time.

CREATE POLICY "Allow recruiters to delete their own jobs"
    ON public.jobs FOR DELETE
    USING (auth.uid() = recruiter_id);
