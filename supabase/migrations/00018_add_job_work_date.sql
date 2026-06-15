-- Migration: 00018_add_job_work_date
-- Description: Add work_date column to the jobs table

ALTER TABLE jobs
ADD COLUMN work_date TIMESTAMPTZ NULL;
