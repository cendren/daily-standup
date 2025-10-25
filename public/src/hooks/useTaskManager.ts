import { useState, useEffect } from 'react';
import { Task, getTasksForDate, createTask, updateTask, deleteTask } from '@/utils/supabaseTaskStorage';
import { useToast } from '@/hooks/use-toast';

export const useTaskManager = (today: string) => {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>([]);
  const [yesterdayLabel, setYesterdayLabel] = useState('Yesterday\'s Tasks');
  const [yesterdayDate, setYesterdayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to get the appropriate previous day and label
  const getPreviousDayInfo = async () => {
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (dayOfWeek === 1) { // Monday
      // Check Sunday first
      const sunday = new Date(todayDate);
      sunday.setDate(sunday.getDate() - 1);
      const sundayDateStr = sunday.toISOString().split('T')[0];
      const sundayTasks = await getTasksForDate(sundayDateStr);
      
      if (sundayTasks.length > 0) {
        return { date: sundayDateStr, label: 'Yesterday\'s Tasks', tasks: sundayTasks };
      }

      // Check Saturday if no Sunday tasks
      const saturday = new Date(todayDate);
      saturday.setDate(saturday.getDate() - 2);
      const saturdayDateStr = saturday.toISOString().split('T')[0];
      const saturdayTasks = await getTasksForDate(saturdayDateStr);
      
      if (saturdayTasks.length > 0) {
        return { date: saturdayDateStr, label: 'Saturday\'s Tasks', tasks: saturdayTasks };
      }

      // Check Friday if no Saturday or Sunday tasks
      const friday = new Date(todayDate);
      friday.setDate(friday.getDate() - 3);
      const fridayDateStr = friday.toISOString().split('T')[0];
      const fridayTasks = await getTasksForDate(fridayDateStr);
      
      if (fridayTasks.length > 0) {
        return { date: fridayDateStr, label: 'Friday\'s Tasks', tasks: fridayTasks };
      }

      // If no tasks found in the last 3 days, search for the latest day with tasks
      return await findLatestDayWithTasks(todayDate);
    } else {
      // Tuesday onwards - check yesterday first
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split('T')[0];
      const yesterdayTasks = await getTasksForDate(yesterdayDateStr);
      
      if (yesterdayTasks.length > 0) {
        return { date: yesterdayDateStr, label: 'Yesterday\'s Tasks', tasks: yesterdayTasks };
      }

      // If no tasks yesterday, search for the latest day with tasks
      return await findLatestDayWithTasks(todayDate);
    }
  };

  // Helper function to find the latest day with tasks
  const findLatestDayWithTasks = async (fromDate: Date) => {
    // Search back up to 30 days to find the latest day with tasks
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const tasks = await getTasksForDate(checkDateStr);
      
      if (tasks.length > 0) {
        // Format the label based on how recent the date is
        const daysDiff = i;
        let label = '';
        
        if (daysDiff === 1) {
          label = 'Yesterday\'s Tasks';
        } else if (daysDiff <= 7) {
          const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
          label = `${dayName}'s Tasks`;
        } else {
          const formattedDate = checkDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          label = `${formattedDate} Tasks`;
        }
        
        return { date: checkDateStr, label, tasks };
      }
    }
    
    // If no tasks found in the last 30 days, return yesterday's date as fallback
    const yesterday = new Date(fromDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return { date: yesterdayStr, label: 'No Previous Tasks', tasks: [] };
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [todayData, previousDayInfo] = await Promise.all([
        getTasksForDate(today),
        getPreviousDayInfo()
      ]);
      
      setTodayTasks(todayData);
      setYesterdayTasks(previousDayInfo.tasks);
      setYesterdayLabel(previousDayInfo.label);
      setYesterdayDate(previousDayInfo.date);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskText: string) => {
    const newTask = await createTask(taskText, today);
    if (newTask) {
      setTodayTasks(prev => [...prev, newTask]);
      toast({
        title: "Task added",
        description: "Your task has been added successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateYesterdayTask = async (taskId: string, updates: Partial<Task>) => {
    const success = await updateTask(taskId, updates);
    if (success) {
      setYesterdayTasks(prev => 
        prev.map(task => task.id === taskId ? { ...task, ...updates } : task)
      );
      if (updates.blocker) {
        toast({
          title: "Blocker added",
          description: "Task blocker has been recorded",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteYesterdayTask = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      setYesterdayTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Task has been deleted",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTodayTask = async (taskId: string, updates: Partial<Task>) => {
    const success = await updateTask(taskId, updates);
    if (success) {
      setTodayTasks(prev => 
        prev.map(task => task.id === taskId ? { ...task, ...updates } : task)
      );
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleToggleTodayTask = async (taskId: string) => {
    const task = todayTasks.find(t => t.id === taskId);
    if (task) {
      const success = await updateTask(taskId, { completed: !task.completed });
      if (success) {
        setTodayTasks(prev => 
          prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteTodayTask = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTodayTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Your task has been deleted",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleTransferTask = async (taskId: string) => {
    console.log('handleTransferTask called with taskId:', taskId);
    // Check if task is from yesterday or today
    const yesterdayTask = yesterdayTasks.find(task => task.id === taskId);
    const todayTask = todayTasks.find(task => task.id === taskId);
    
    if (!yesterdayTask && !todayTask) {
      toast({
        title: "Error",
        description: "Task not found",
        variant: "destructive",
      });
      return;
    }

    try {
      if (yesterdayTask) {
        // Transfer from yesterday to today - only allow unfinished tasks
        if (yesterdayTask.completed) return;

        // Update the task date to today
        const updated = await updateTask(taskId, { 
          date: today,
          completed: false, // Reset completion status when transferring
          task_order: todayTasks.length + 1 // Add to end of today's list
        });

        if (updated) {
          // Remove from yesterday's tasks
          setYesterdayTasks(prev => prev.filter(task => task.id !== taskId));
          
          // Add to today's tasks
          const transferredTask = { 
            ...yesterdayTask, 
            date: today, 
            completed: false,
            task_order: todayTasks.length + 1
          };
          setTodayTasks(prev => [...prev, transferredTask]);
          
          toast({
            title: "Task transferred",
            description: "Task has been moved to today's list",
          });
        }
      } else if (todayTask) {
        // Transfer from today to yesterday
        const updated = await updateTask(taskId, { 
          date: yesterdayDate,
          task_order: yesterdayTasks.length + 1 // Add to end of yesterday's list
        });

        if (updated) {
          // Remove from today's tasks
          setTodayTasks(prev => prev.filter(task => task.id !== taskId));
          
          // Add to yesterday's tasks
          const transferredTask = { 
            ...todayTask, 
            date: yesterdayDate,
            task_order: yesterdayTasks.length + 1
          };
          setYesterdayTasks(prev => [...prev, transferredTask]);
          
          toast({
            title: "Task transferred",
            description: `Task has been moved to ${yesterdayLabel.toLowerCase()}`,
          });
        }
      }
    } catch (error) {
      console.error('Error transferring task:', error);
      toast({
        title: "Error",
        description: "Failed to transfer task",
        variant: "destructive",
      });
    }
  };

  const handleReorderTodayTasks = async (reorderedTasks: Task[]) => {
    // Update the local state immediately for better UX
    setTodayTasks(reorderedTasks);
    
    // Update each task's order in the database
    try {
      const updates = reorderedTasks.map(async (task, index) => {
        return updateTask(task.id, { task_order: index + 1 });
      });
      
      await Promise.all(updates);
      
      toast({
        title: "Tasks reordered",
        description: "Task order has been saved",
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Reload tasks to revert to database state
      loadTasks();
      toast({
        title: "Error",
        description: "Failed to save task order",
        variant: "destructive",
      });
    }
  };

  const handleReorderYesterdayTasks = async (reorderedTasks: Task[]) => {
    // Update the local state immediately for better UX
    setYesterdayTasks(reorderedTasks);
    
    // Update each task's order in the database
    try {
      const updates = reorderedTasks.map(async (task, index) => {
        return updateTask(task.id, { task_order: index + 1 });
      });
      
      await Promise.all(updates);
      
      toast({
        title: "Tasks reordered",
        description: "Task order has been saved",
      });
    } catch (error) {
      console.error('Error reordering yesterday tasks:', error);
      // Reload tasks to revert to database state
      loadTasks();
      toast({
        title: "Error",
        description: "Failed to save task order",
        variant: "destructive",
      });
    }
  };

  const handleBulkTransferFromYesterday = async () => {
    // Find all incomplete tasks from yesterday
    const incompleteTasks = yesterdayTasks.filter(task => !task.completed);
    
    if (incompleteTasks.length === 0) {
      toast({
        title: "No tasks to transfer",
        description: "All yesterday's tasks are already completed",
      });
      return;
    }

    try {
      // Transfer all incomplete tasks to today
      const updates = incompleteTasks.map(async (task, index) => {
        return updateTask(task.id, { 
          date: today,
          completed: false,
          task_order: todayTasks.length + index + 1 // Add to end of today's list
        });
      });
      
      await Promise.all(updates);
      
      // Update local state
      const transferredTasks = incompleteTasks.map((task, index) => ({
        ...task,
        date: today,
        completed: false,
        task_order: todayTasks.length + index + 1
      }));
      
      // Remove transferred tasks from yesterday
      setYesterdayTasks(prev => prev.filter(task => task.completed));
      
      // Add transferred tasks to today
      setTodayTasks(prev => [...prev, ...transferredTasks]);
      
      toast({
        title: "Tasks transferred",
        description: `${incompleteTasks.length} incomplete task${incompleteTasks.length === 1 ? '' : 's'} moved to today`,
      });
      
    } catch (error) {
      console.error('Error bulk transferring tasks:', error);
      toast({
        title: "Error",
        description: "Failed to transfer tasks",
        variant: "destructive",
      });
    }
  };

  return {
    todayTasks,
    yesterdayTasks,
    yesterdayLabel,
    yesterdayDate,
    loading,
    loadTasks,
    handleAddTask,
    handleUpdateYesterdayTask,
    handleDeleteYesterdayTask,
    handleUpdateTodayTask,
    handleToggleTodayTask,
    handleDeleteTodayTask,
    handleTransferTask,
    handleReorderTodayTasks,
    handleReorderYesterdayTasks,
    handleBulkTransferFromYesterday
  };
};
