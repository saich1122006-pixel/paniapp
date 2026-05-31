-- ============================================================================
-- Migration 00006: Add Delete User RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user() IS 'Allows a user to permanently delete their own account.';
