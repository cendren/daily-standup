
import React from 'react';
import { Button } from '@/components/ui/button';
import { Target, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const DashboardHeader: React.FC = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Target className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">Daily Stand-up</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="ml-auto"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <p className="text-lg text-gray-600">Track your daily progress and plan ahead</p>
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</span>
      </div>
    </div>
  );
};
