
import React from 'react';
import { Target } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <Target className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-lg text-gray-600">Loading your tasks...</p>
      </div>
    </div>
  );
};
