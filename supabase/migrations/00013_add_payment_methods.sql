-- Migration 00013: Add payment method to transactions
-- Adds payment_method column to public.transactions

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI';
COMMENT ON COLUMN public.transactions.payment_method IS 'The method used for payment (e.g., UPI, Cash, Bank Transfer)';
