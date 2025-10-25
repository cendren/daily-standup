import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task, getAllTaskDates, getTasksForDate } from '@/utils/supabaseTaskStorage';
import { Calendar as CalendarIcon, CheckCircle, Circle, Eye, Download, CalendarRange, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface OverviewDialogProps {
  children: React.ReactNode;
}

type DateRangeOption = 'this-week' | 'this-month' | 'custom';

export const OverviewDialog: React.FC<OverviewDialogProps> = ({ children }) => {
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [exportRange, setExportRange] = useState<DateRangeOption>('this-week');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const { toast } = useToast();

  const loadAllTasks = async () => {
    setLoading(true);
    try {
      const dates = await getAllTaskDates();
      const tasksData: Record<string, Task[]> = {};
      
      for (const date of dates) {
        const tasks = await getTasksForDate(date);
        if (tasks.length > 0) {
          tasksData[date] = tasks;
        }
      }
      
      setTasksByDate(tasksData);
    } catch (error) {
      console.error('Error loading all tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks overview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDateRange = () => {
    const today = new Date();
    
    switch (exportRange) {
      case 'this-week':
        const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        return {
          start: format(startOfWeekDate, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'this-month':
        const startOfMonthDate = startOfMonth(today);
        return {
          start: format(startOfMonthDate, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        return {
          start: format(customStartDate, 'yyyy-MM-dd'),
          end: format(customEndDate, 'yyyy-MM-dd')
        };
      default:
        return null;
    }
  };

  const generateCSV = () => {
    const dateRange = getDateRange();
    if (!dateRange) {
      toast({
        title: "Error",
        description: "Please select a valid date range",
        variant: "destructive",
      });
      return;
    }

    const csvData = [];
    const headers = ['Date', 'Task', 'Tag', 'Task Status'];
    csvData.push(headers.join(','));

    // Filter tasks within date range
    Object.keys(tasksByDate)
      .filter(date => date >= dateRange.start && date <= dateRange.end)
      .sort()
      .forEach(date => {
        const tasks = tasksByDate[date];
        tasks.forEach(task => {
          const tags = task.tags && task.tags.length > 0 ? task.tags.join('; ') : '';
          const row = [
            date,
            `"${task.text.replace(/"/g, '""')}"`, // Escape quotes in task text
            tags ? `"${tags.replace(/"/g, '""')}"` : '', // Use tags instead of blocker
            task.completed ? 'Completed' : 'Pending'
          ];
          csvData.push(row.join(','));
        });
      });

    if (csvData.length === 1) {
      toast({
        title: "No Data",
        description: "No tasks found in the selected date range",
        variant: "destructive",
      });
      return;
    }

    // Create and download CSV file
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks-export-${dateRange.start}-to-${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Tasks have been exported to CSV",
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadAllTasks();
    }
  };

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Tasks Overview
          </DialogTitle>
        </DialogHeader>
        
        {/* CSV Export Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" />
            <h3 className="font-semibold">Export to CSV</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={exportRange === 'this-week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportRange('this-week')}
                >
                  This Week
                </Button>
                <Button
                  variant={exportRange === 'this-month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportRange('this-month')}
                >
                  This Month
                </Button>
                <Button
                  variant={exportRange === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportRange('custom')}
                >
                  Custom Range
                </Button>
              </div>

              <Button onClick={generateCSV} className="ml-auto">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {exportRange === 'custom' && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">From:</span>
                  <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "MMM dd") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          setShowStartCalendar(false);
                        }}
                        className="pointer-events-auto"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">To:</span>
                  <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "MMM dd") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          setShowEndCalendar(false);
                        }}
                        className="pointer-events-auto"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CalendarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-600">Loading your tasks...</p>
            </div>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-hidden">
            {sortedDates.map((date) => {
              const tasks = tasksByDate[date];
              const completedCount = tasks.filter(task => task.completed).length;
              const totalCount = tasks.length;
              
              return (
                <div key={date} className="border rounded-lg p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{formatDate(date)}</h3>
                    <div className="text-sm text-gray-600">
                      {completedCount}/{totalCount} completed
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-2 rounded bg-gray-50 overflow-hidden">
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className={`break-words overflow-wrap-anywhere hyphens-auto ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.text}
                          </p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {task.blocker && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-red-700 break-words overflow-wrap-anywhere hyphens-auto">
                                  Blocker: {task.blocker}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
