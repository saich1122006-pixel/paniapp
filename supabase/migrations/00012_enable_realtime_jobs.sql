-- Migration 00012: Enable realtime for jobs table

-- Enable realtime on public.jobs so workers can see live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
