
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Hash, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TagDropdownProps {
  taskId: string;
  currentTags: string[];
  onUpdateTags: (taskId: string, tags: string[]) => void;
}

export const TagDropdown: React.FC<TagDropdownProps> = ({
  taskId,
  currentTags,
  onUpdateTags
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableTags();
  }, []);

  // Reload available tags when dropdown opens to ensure consistency across all instances
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadAvailableTags();
    }
  };

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('tag')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading available tags:', error);
        return;
      }

      const tags = data?.map(item => item.tag) || [];
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading available tags:', error);
    }
  };

  const saveTagToSupabase = async (tag: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user.id,
          tag: tag
        });

      if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('Error saving tag:', error);
      }
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  };

  const deleteTagFromSupabase = async (tag: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', user.id)
        .eq('tag', tag);

      if (error) {
        console.error('Error deleting tag:', error);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleAddTag = async () => {
    if (newTagInput.trim() && !currentTags.includes(newTagInput.trim())) {
      const newTags = [...currentTags, newTagInput.trim()];
      onUpdateTags(taskId, newTags);
      
      // Add to available tags in Supabase
      if (!availableTags.includes(newTagInput.trim())) {
        await saveTagToSupabase(newTagInput.trim());
        setAvailableTags([...availableTags, newTagInput.trim()]);
      }
      
      setNewTagInput('');
    }
  };

  const handleToggleTag = async (tag: string) => {
    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      newTags = [...currentTags, tag];
      // Save to available tags if not already there
      if (!availableTags.includes(tag)) {
        await saveTagToSupabase(tag);
        setAvailableTags([...availableTags, tag]);
      }
    }
    onUpdateTags(taskId, newTags);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onUpdateTags(taskId, newTags);
  };

  const handleDeleteAvailableTag = async (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle
    await deleteTagFromSupabase(tagToDelete);
    setAvailableTags(availableTags.filter(tag => tag !== tagToDelete));
    
    // Also remove from current task tags if it's there
    if (currentTags.includes(tagToDelete)) {
      const newTags = currentTags.filter(tag => tag !== tagToDelete);
      onUpdateTags(taskId, newTags);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Tag dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-6 w-6 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Hash className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-white border shadow-lg z-50">
          {/* Add new tag input */}
          <div className="p-2">
            <div className="flex gap-1">
              <Input
                placeholder="Add new tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                disabled={!newTagInput.trim() || currentTags.includes(newTagInput.trim())}
                className="h-8 w-8 p-0"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {availableTags.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-1">
                <div className="text-xs text-gray-500 px-2 py-1">Existing tags:</div>
                {availableTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className="text-sm cursor-pointer flex items-start justify-between group min-h-8"
                  >
                    <span 
                      className="flex-1 break-words pr-2" 
                      style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'break-word',
                        maxWidth: '180px'
                      }}
                    >
                      {tag}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {currentTags.includes(tag) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteAvailableTag(tag, e)}
                        className="p-0 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
