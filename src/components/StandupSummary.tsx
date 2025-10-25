
import React from 'react';
import { Card } from '@/components/ui/card';
import { Task } from '@/utils/supabaseTaskStorage';
import { CheckCircle, Circle, Target, TrendingUp } from 'lucide-react';

interface StandupSummaryProps {
  yesterdayTasks: Task[];
  todayTasks: Task[];
  yesterdayLabel: string;
}

export const StandupSummary: React.FC<StandupSummaryProps> = ({
  yesterdayTasks,
  todayTasks,
  yesterdayLabel
}) => {
  const yesterdayCompleted = yesterdayTasks.filter(task => task.completed).length;
  const yesterdayTotal = yesterdayTasks.length;
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter(task => task.completed).length;

  const completionRate = yesterdayTotal > 0 ? (yesterdayCompleted / yesterdayTotal) * 100 : 0;

  // Extract the day name from the label (e.g., "Saturday's Tasks" -> "Saturday")
  const dayName = yesterdayLabel.replace("'s Tasks", "").replace(" Tasks", "");

  return (
    <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl border-0">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Stand-up Summary</h2>
          <p className="text-indigo-100">Ready for your daily stand-up meeting</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Previous Day's Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-300" />
              <h3 className="text-lg font-semibold">{dayName}</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {yesterdayCompleted} / {yesterdayTotal}
              </div>
              <div className="text-sm text-indigo-100">
                {yesterdayTotal === 0 ? 'No tasks recorded' : `${Math.round(completionRate)}% completed`}
              </div>
              {yesterdayTotal > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Today's Plan */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-blue-300" />
              <h3 className="text-lg font-semibold">Today</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {todayCompleted} / {todayTotal}
              </div>
              <div className="text-sm text-indigo-100">
                {todayTotal === 0 ? 'No tasks planned yet' : `${todayTotal} task${todayTotal === 1 ? '' : 's'} planned`}
              </div>
              {todayTotal > 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`w-3 h-3 rounded-full ${
                        task.completed ? 'bg-green-300' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Productivity Insight */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-300" />
              <h3 className="text-lg font-semibold">Insight</h3>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-bold">
                {completionRate >= 80 ? '🔥 Excellent!' : 
                 completionRate >= 60 ? '👍 Good pace' : 
                 completionRate >= 40 ? '📈 Building momentum' : 
                 yesterdayTotal === 0 ? '🌱 Fresh start' : '💪 Keep pushing'}
              </div>
              <div className="text-sm text-indigo-100">
                {completionRate >= 80 ? 'You\'re crushing your goals!' : 
                 completionRate >= 60 ? 'Solid progress yesterday' : 
                 completionRate >= 40 ? 'Every step counts' : 
                 yesterdayTotal === 0 ? 'Ready to begin tracking' : 'Room for improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
