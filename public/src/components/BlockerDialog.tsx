
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface BlockerDialogProps {
  taskId: string;
  currentBlocker?: string;
  onSaveBlocker: (taskId: string, blocker: string) => void;
}

export const BlockerDialog: React.FC<BlockerDialogProps> = ({
  taskId,
  currentBlocker,
  onSaveBlocker
}) => {
  const [blocker, setBlocker] = useState(currentBlocker || '');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSaveBlocker(taskId, blocker);
    setOpen(false);
  };

  const handleDelete = () => {
    onSaveBlocker(taskId, '');
    setBlocker('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={`p-2 hover:bg-red-50 ${
            currentBlocker 
              ? 'text-red-600 hover:text-red-700' 
              : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Blocker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            placeholder="Describe what blocked this task..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {currentBlocker && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Blocker
              </Button>
            )}
            <Button onClick={handleSave}>
              Save Blocker
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
