-- Migration 00009: Allow workers to accept open jobs
-- Workers need to be able to UPDATE a job to accept it.

CREATE POLICY "Allow workers to accept open jobs"
    ON public.jobs FOR UPDATE
    USING (status = 'open')
    WITH CHECK (auth.uid() = accepted_by AND status = 'matched');
