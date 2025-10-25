
-- Add order column to tasks table for drag and drop functionality
ALTER TABLE public.tasks ADD COLUMN task_order INTEGER DEFAULT 0;

-- Update existing tasks to have sequential order using a subquery approach
WITH ordered_tasks AS (
  SELECT id, row_number() OVER (PARTITION BY user_id, date ORDER BY created_at) as new_order
  FROM public.tasks
  WHERE task_order = 0
)
UPDATE public.tasks 
SET task_order = ordered_tasks.new_order
FROM ordered_tasks
WHERE public.tasks.id = ordered_tasks.id;
