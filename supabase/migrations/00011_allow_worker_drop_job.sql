-- Migration 00011: Allow workers to drop accepted jobs
-- Workers need to be able to UPDATE a job to drop it (set it back to open and remove themselves).

CREATE POLICY "Allow workers to drop accepted jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = accepted_by AND status = 'matched')
    WITH CHECK (accepted_by IS NULL AND status = 'open');
