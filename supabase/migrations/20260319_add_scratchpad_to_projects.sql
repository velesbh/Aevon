-- Add scratchpad column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scratchpad TEXT DEFAULT '';
