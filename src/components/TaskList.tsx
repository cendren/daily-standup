

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/utils/supabaseTaskStorage';
import { Edit, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import { BlockerDialog } from './BlockerDialog';
import { TagDropdown } from './TagDropdown';
import { renderTextWithLinks } from '@/utils/linkRenderer';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  editable: boolean;
  emptyMessage: string;
  showBlockers?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  editable,
  emptyMessage,
  showBlockers = false
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
    if (editable && onUpdateTask) {
      onUpdateTask(taskId, { completed });
    } else if (onToggleTask) {
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
        <div key={task.id} className="group bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => handleToggleCompleted(task.id, checked as boolean)}
                className="w-5 h-5"
              />
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              {editingTaskId === task.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="flex-1 text-sm border-gray-300 focus:border-blue-400"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <div className="flex-shrink-0 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div 
                          className={`text-base block break-words ${
                            task.completed 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900'
                          }`}
                          style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {renderTextWithLinks(task.text)}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <TagDropdown
                          taskId={task.id}
                          currentTags={task.tags || []}
                          onUpdateTags={handleUpdateTags}
                        />
                        {showBlockers && (
                          <BlockerDialog
                            taskId={task.id}
                            currentBlocker={task.blocker}
                            onSaveBlocker={handleSaveBlocker}
                          />
                        )}
                        {editable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(task)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {onDeleteTask && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Display current tags as wrapped badges below the text */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-full">
                        {task.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            style={{ 
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              maxWidth: 'calc(100% - 0.25rem)'
                            }}
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
              )}
            </div>
          </div>
          
          {task.blocker && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{task.blocker}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

