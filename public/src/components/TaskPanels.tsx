import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskForm } from '@/components/TaskForm';
import { DraggableTaskList } from '@/components/DraggableTaskList';
import { TomorrowTaskDialog } from '@/components/TomorrowTaskDialog';
import { Task } from '@/utils/supabaseTaskStorage';
import { CheckCircle, Target, CalendarPlus, GripVertical, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskPanelsProps {
  todayTasks: Task[];
  yesterdayTasks: Task[];
  yesterdayLabel: string;
  onAddTask: (taskText: string) => void;
  onUpdateYesterdayTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteYesterdayTask: (taskId: string) => void;
  onUpdateTodayTask: (taskId: string, updates: Partial<Task>) => void;
  onToggleTodayTask: (taskId: string) => void;
  onDeleteTodayTask: (taskId: string) => void;
  onTransferTask?: (taskId: string) => void;
  onReorderTodayTasks?: (reorderedTasks: Task[]) => void;
  onReorderYesterdayTasks?: (reorderedTasks: Task[]) => void;
  onBulkTransferFromYesterday?: () => void;
}

// Simple droppable container
const DroppableContainer: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50/30' : ''
      } transition-all duration-200`}
    >
      {children}
    </div>
  );
};

export const TaskPanels: React.FC<TaskPanelsProps> = ({
  todayTasks,
  yesterdayTasks,
  yesterdayLabel,
  onAddTask,
  onUpdateYesterdayTask,
  onDeleteYesterdayTask,
  onUpdateTodayTask,
  onToggleTodayTask,
  onDeleteTodayTask,
  onTransferTask,
  onReorderTodayTasks,
  onReorderYesterdayTasks,
  onBulkTransferFromYesterday
}) => {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Simple sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    const draggedTask = [...todayTasks, ...yesterdayTasks].find(task => task.id === activeId);
    setActiveTask(draggedTask || null);
  };

  // Custom collision detection that prioritizes containers only for cross-panel transfers
  const customCollisionDetection = (args: any) => {
    const activeId = args.active?.id as string;
    if (!activeId) return closestCenter(args);
    
    // Determine which panel the dragged task is from
    const isFromToday = todayTasks.some(task => task.id === activeId);
    const isFromYesterday = yesterdayTasks.some(task => task.id === activeId);
    
    // First check if we're over a droppable container
    const containerCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter((container: any) => 
        container.id === 'yesterday-container' || container.id === 'today-container'
      )
    });
    
    // Only prioritize container collisions for cross-panel transfers
    if (containerCollisions.length > 0) {
      const targetContainer = containerCollisions[0].id;
      
      // Prioritize container collision only if moving to opposite panel
      if ((isFromToday && targetContainer === 'yesterday-container') || 
          (isFromYesterday && targetContainer === 'today-container')) {
        return containerCollisions;
      }
    }
    
    // Use default collision detection for same-panel reordering
    return closestCenter(args);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle cross-panel transfers (prioritized)
    if (overId === 'yesterday-container') {
      const isFromToday = todayTasks.some(task => task.id === activeId);
      if (isFromToday && onTransferTask) {
        onTransferTask(activeId);
      }
      return;
    }
    
    if (overId === 'today-container') {
      const isFromYesterday = yesterdayTasks.some(task => task.id === activeId);
      if (isFromYesterday && onTransferTask) {
        onTransferTask(activeId);
      }
      return;
    }

    // Handle reordering within panels
    const draggedFromToday = todayTasks.some(task => task.id === activeId);
    const draggedFromYesterday = yesterdayTasks.some(task => task.id === activeId);
    
    // Reorder within today's tasks
    if (draggedFromToday && onReorderTodayTasks) {
      const activeIndex = todayTasks.findIndex(task => task.id === activeId);
      const overIndex = todayTasks.findIndex(task => task.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const reorderedTasks = arrayMove(todayTasks, activeIndex, overIndex).map((task, index) => ({
          ...task,
          task_order: index + 1
        }));
        onReorderTodayTasks(reorderedTasks);
      }
    }
    
    // Reorder within yesterday's tasks
    if (draggedFromYesterday && onReorderYesterdayTasks) {
      const activeIndex = yesterdayTasks.findIndex(task => task.id === activeId);
      const overIndex = yesterdayTasks.findIndex(task => task.id === overId);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const reorderedTasks = arrayMove(yesterdayTasks, activeIndex, overIndex).map((task, index) => ({
          ...task,
          task_order: index + 1
        }));
        onReorderYesterdayTasks(reorderedTasks);
      }
    }
  };

  // All tasks for sortable context
  const allTasks = [...yesterdayTasks, ...todayTasks];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="relative">
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Previous Day's Tasks */}
            <DroppableContainer id="yesterday-container" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 relative">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-semibold">{yesterdayLabel}</h2>
                    <p className="text-orange-100 text-sm">Review and update what actually happened</p>
                  </div>
                </div>
                {yesterdayTasks.some(task => !task.completed) && onBulkTransferFromYesterday && (
                  <div className="absolute top-4 right-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onBulkTransferFromYesterday}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white text-xs px-2 py-1 h-7"
                      title="Transfer all incomplete tasks to today"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-6 min-h-[200px]">
                <DraggableTaskList
                  tasks={yesterdayTasks}
                  onUpdateTask={onUpdateYesterdayTask}
                  onToggleTask={(taskId) => onUpdateYesterdayTask(taskId, { completed: !yesterdayTasks.find(t => t.id === taskId)?.completed })}
                  onDeleteTask={onDeleteYesterdayTask}
                  onReorderTasks={onReorderYesterdayTasks}
                  emptyMessage="No tasks recorded. Drag tasks here or add them directly."
                  showBlockers={true}
                  editable={true}
                />
              </div>
            </DroppableContainer>

            {/* Today's Tasks */}
            <DroppableContainer id="today-container" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 relative">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-semibold">Today's Focus</h2>
                    <p className="text-blue-100 text-sm">Plan your tasks for today</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <TomorrowTaskDialog>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white text-xs px-2 py-1 h-7"
                    >
                      <CalendarPlus className="w-3 h-3 mr-1" />
                      Plan for Tomorrow
                    </Button>
                  </TomorrowTaskDialog>
                </div>
              </div>
              <div className="p-6 space-y-6 min-h-[200px]">
                <TaskForm onAddTask={onAddTask} />
                <DraggableTaskList
                  tasks={todayTasks}
                  onUpdateTask={onUpdateTodayTask}
                  onToggleTask={onToggleTodayTask}
                  onDeleteTask={onDeleteTodayTask}
                  onReorderTasks={onReorderTodayTasks}
                  emptyMessage="No tasks planned for today. Add your first task above or drag from yesterday!"
                  showBlockers={true}
                />
              </div>
            </DroppableContainer>
          </div>
        </div>
      </SortableContext>
      
      {/* Simple drag overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-lg max-w-xs">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 truncate">
                {activeTask.text.length > 30 ? `${activeTask.text.substring(0, 30)}...` : activeTask.text}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};