
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Task, createTask, getTasksForDate, updateTask, deleteTask } from '@/utils/supabaseTaskStorage';
import { useToast } from '@/hooks/use-toast';

interface TomorrowTaskDialogProps {
  children: React.ReactNode;
}

export const TomorrowTaskDialog: React.FC<TomorrowTaskDialogProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const { toast } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      loadTomorrowTasks();
    }
  }, [isOpen]);

  const loadTomorrowTasks = async () => {
    const tasks = await getTasksForDate(tomorrowDateStr);
    setTomorrowTasks(tasks);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    setIsLoading(true);
    try {
      const newTask = await createTask(taskText.trim(), tomorrowDateStr);
      if (newTask) {
        toast({
          title: "Task planned",
          description: "Your task has been planned for tomorrow",
        });
        setTaskText('');
        setTomorrowTasks(prev => [...prev, newTask]);
      } else {
        toast({
          title: "Error",
          description: "Failed to plan task",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to plan task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = async (taskId: string) => {
    if (!editText.trim()) return;

    const success = await updateTask(taskId, { text: editText.trim() });
    if (success) {
      setTomorrowTasks(prev => 
        prev.map(task => task.id === taskId ? { ...task, text: editText.trim() } : task)
      );
      setEditingTask(null);
      setEditText('');
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

  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTomorrowTasks(prev => prev.filter(task => task.id !== taskId));
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

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditText(task.text);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Plan for Tomorrow
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Add New Task - moved above planned tasks */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="What do you want to focus on tomorrow?"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!taskText.trim() || isLoading}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Tomorrow's Tasks Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-700">
                Currently Planned ({tomorrowTasks.length})
              </h3>
            </div>
            {tomorrowTasks.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tasks planned yet</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {tomorrowTasks.map((task) => (
                  <div key={task.id} className="group bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                      
                      {editingTask === task.id ? (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 text-sm border-gray-300 focus:border-blue-400"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditTask(task.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                          />
                          <div className="flex-shrink-0 flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTask(task.id)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span 
                              className="flex-1 text-base break-words word-wrap break-all text-gray-900"
                              style={{ 
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {task.text}
                            </span>
                            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(task)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
