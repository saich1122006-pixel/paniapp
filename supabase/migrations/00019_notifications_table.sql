-- ============================================================================
-- PaniApp: Hyper-Local Daily Labor Marketplace
-- Migration 00019: Notifications Table
-- Engine:  PostgreSQL 15+ (Supabase)
-- ============================================================================

-- In-app notifications table to store all user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The user who receives this notification
    user_id         UUID        NOT NULL
                                REFERENCES public.profiles (id) ON DELETE CASCADE,

    -- Optional link to a related job
    job_id          UUID        REFERENCES public.jobs (id) ON DELETE SET NULL,

    -- Notification content
    title           TEXT        NOT NULL,
    body            TEXT        NOT NULL,

    -- Notification type for icon/color mapping in the UI
    type            TEXT        NOT NULL DEFAULT 'general'
                                CHECK (type IN ('job_accepted', 'job_posted', 'job_completed', 'payment_received', 'payment_sent', 'general')),

    -- Read/unread tracking
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'In-app notification feed for workers and recruiters.';

-- Index for fast user-specific queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON public.notifications (user_id, created_at DESC);

-- Index for unread count badge
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON public.notifications (user_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- RLS policies
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Only service_role / triggers can insert notifications
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================================
-- Auto-create notifications on job events
-- ============================================================================

-- When a job is accepted (status goes open -> matched), notify the recruiter
CREATE OR REPLACE FUNCTION public.notify_job_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'matched' AND OLD.status = 'open' THEN
        -- Notify recruiter that a worker accepted their job
        INSERT INTO public.notifications (user_id, job_id, title, body, type)
        VALUES (
            NEW.recruiter_id,
            NEW.id,
            'Worker Accepted Your Job',
            'A worker has accepted your job "' || NEW.work_name || '".',
            'job_accepted'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_job_accepted ON public.jobs;
CREATE TRIGGER trg_notify_job_accepted
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_job_accepted();

-- When a job is completed, notify the worker
CREATE OR REPLACE FUNCTION public.notify_job_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'matched' AND NEW.accepted_by IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, job_id, title, body, type)
        VALUES (
            NEW.accepted_by,
            NEW.id,
            'Job Completed',
            'The job "' || NEW.work_name || '" has been marked as completed.',
            'job_completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_job_completed ON public.jobs;
CREATE TRIGGER trg_notify_job_completed
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_job_completed();

-- When a payment is made, notify the worker
CREATE OR REPLACE FUNCTION public.notify_payment_made()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, job_id, title, body, type)
    VALUES (
        NEW.worker_id,
        NEW.job_id,
        'Payment Received',
        'You received a payment of ₹' || NEW.amount || '.',
        'payment_received'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_payment ON public.transactions;
CREATE TRIGGER trg_notify_payment
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_payment_made();

-- ============================================================================
-- Migration complete.
-- ============================================================================
