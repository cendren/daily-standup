
-- Add tags column to the tasks table
ALTER TABLE public.tasks 
ADD COLUMN tags text[] DEFAULT '{}';
