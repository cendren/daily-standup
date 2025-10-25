import React, { useEffect } from 'react';
import { StandupSummary } from '@/components/StandupSummary';
import { OverviewDialog } from '@/components/OverviewDialog';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TaskPanels } from '@/components/TaskPanels';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const {
    todayTasks,
    yesterdayTasks,
    yesterdayLabel,
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
  } = useTaskManager(today);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, today]);

  if (!user) {
    return null; // Auth guard will redirect
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <DashboardHeader />

        <StandupSummary 
          yesterdayTasks={yesterdayTasks}
          todayTasks={todayTasks}
          yesterdayLabel={yesterdayLabel}
        />

        <TaskPanels
          todayTasks={todayTasks}
          yesterdayTasks={yesterdayTasks}
          yesterdayLabel={yesterdayLabel}
          onAddTask={handleAddTask}
          onUpdateYesterdayTask={handleUpdateYesterdayTask}
          onDeleteYesterdayTask={handleDeleteYesterdayTask}
          onUpdateTodayTask={handleUpdateTodayTask}
          onToggleTodayTask={handleToggleTodayTask}
          onDeleteTodayTask={handleDeleteTodayTask}
          onTransferTask={handleTransferTask}
          onReorderTodayTasks={handleReorderTodayTasks}
          onReorderYesterdayTasks={handleReorderYesterdayTasks}
          onBulkTransferFromYesterday={handleBulkTransferFromYesterday}
        />

        <div className="flex justify-center mt-12 mb-8">
          <OverviewDialog>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-300 text-gray-700 font-medium px-8 py-3"
            >
              <Eye className="w-5 h-5 mr-2" />
              Overview
            </Button>
          </OverviewDialog>
        </div>
      </div>
    </div>
  );
};

export default Index;
