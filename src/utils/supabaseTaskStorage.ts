import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  createdAt: string;
  user_id?: string;
  blocker?: string;
  task_order?: number;
  tags?: string[];
}

export const getTasksForDate = async (date: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', date)
      .order('task_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
      return [];
    }

    return data.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      date: task.date,
      createdAt: task.created_at,
      user_id: task.user_id,
      blocker: task.blocker,
      task_order: task.task_order,
      tags: task.tags || []
    }));
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const createTask = async (taskText: string, date: string): Promise<Task | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the highest task_order for this user and date
    const { data: maxOrderData } = await supabase
      .from('tasks')
      .select('task_order')
      .eq('date', date)
      .eq('user_id', user.id)
      .order('task_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].task_order || 0) + 1 : 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        text: taskText,
        date,
        user_id: user.id,
        completed: false,
        task_order: nextOrder,
        tags: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      date: data.date,
      createdAt: data.created_at,
      user_id: data.user_id,
      blocker: data.blocker,
      task_order: data.task_order,
      tags: data.tags || []
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        text: updates.text,
        completed: updates.completed,
        blocker: updates.blocker,
        task_order: updates.task_order,
        tags: updates.tags,
        date: updates.date,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating task:', error);
    return false;
  }
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

export const getAllTaskDates = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('date')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting task dates:', error);
      return [];
    }

    const uniqueDates = [...new Set(data.map(item => item.date))];
    return uniqueDates;
  } catch (error) {
    console.error('Error getting task dates:', error);
    return [];
  }
};
