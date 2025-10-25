import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/utils/supabaseTaskStorage';
import { Edit, Check, X, Trash2, AlertTriangle, GripVertical } from 'lucide-react';
import { BlockerDialog } from './BlockerDialog';
import { TagDropdown } from './TagDropdown';
import { renderTextWithLinks } from '@/utils/linkRenderer';

interface SortableTaskItemProps {
  task: Task;
  isEditing: boolean;
  editingText: string;
  onStartEdit: (task: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingTextChange: (text: string) => void;
  onToggleCompleted: (taskId: string, completed: boolean) => void;
  onSaveBlocker: (taskId: string, blocker: string) => void;
  onUpdateTags: (taskId: string, tags: string[]) => void;
  onDeleteTask?: (taskId: string) => void;
  showBlockers?: boolean;
  editable?: boolean;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  isEditing,
  editingText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
  onToggleCompleted,
  onSaveBlocker,
  onUpdateTags,
  onDeleteTask,
  showBlockers = false,
  editable = true
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group bg-gray-50 rounded-lg border border-gray-200 
        ${isDragging ? 'opacity-50' : 'hover:border-gray-300'}
        transition-all duration-150
      `}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 -m-1 rounded hover:bg-gray-200"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onToggleCompleted(task.id, checked as boolean)}
            className="w-5 h-5"
          />
        </div>
        
        {/* Content */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Input
              value={editingText}
              onChange={(e) => onEditingTextChange(e.target.value)}
              className="flex-1 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={onSaveEdit} className="p-2">
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} className="p-2">
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div 
                    className={`text-base break-words ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {renderTextWithLinks(task.text)}
                  </div>
                </div>
                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <TagDropdown
                  taskId={task.id}
                  currentTags={task.tags || []}
                  onUpdateTags={onUpdateTags}
                />
                {showBlockers && (
                  <BlockerDialog
                    taskId={task.id}
                    currentBlocker={task.blocker}
                    onSaveBlocker={onSaveBlocker}
                  />
                )}
                {editable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStartEdit(task)}
                    className="p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDeleteTask && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Blocker Display */}
            {task.blocker && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700 break-words">{task.blocker}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface DraggableTaskListProps {
  tasks: Task[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onReorderTasks?: (reorderedTasks: Task[]) => void;
  emptyMessage: string;
  showBlockers?: boolean;
  editable?: boolean;
}

export const DraggableTaskList: React.FC<DraggableTaskListProps> = ({
  tasks,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  emptyMessage,
  showBlockers = false,
  editable = true
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const handleSaveEdit = () => {
    if (editingTaskId && onUpdateTask && editingText.trim()) {
      onUpdateTask(editingTaskId, { text: editingText.trim() });
      setEditingTaskId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const handleToggleCompleted = (taskId: string, completed: boolean) => {
    if (onToggleTask) {
      onToggleTask(taskId);
    }
  };

  const handleSaveBlocker = (taskId: string, blocker: string) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { blocker });
    }
  };

  const handleUpdateTags = (taskId: string, tags: string[]) => {
    if (onUpdateTask) {
      onUpdateTask(taskId, { tags });
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <SortableTaskItem
          key={task.id}
          task={task}
          isEditing={editingTaskId === task.id}
          editingText={editingText}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onEditingTextChange={setEditingText}
          onToggleCompleted={handleToggleCompleted}
          onSaveBlocker={handleSaveBlocker}
          onUpdateTags={handleUpdateTags}
          onDeleteTask={onDeleteTask}
          showBlockers={showBlockers}
          editable={editable}
        />
      ))}
    </div>
  );
};