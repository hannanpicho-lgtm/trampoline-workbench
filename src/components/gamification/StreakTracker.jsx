import { Flame, TrendingUp } from "lucide-react";

export default function StreakTracker({ currentStreak = 0, longestStreak = 0, compact = false }) {
  const streakBonus = Math.min(currentStreak * 10, 300);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg px-3 py-2">
        <Flame className="w-5 h-5 text-orange-600" />
        <div>
          <div className="text-xs text-gray-600">Streak</div>
          <div className="text-lg font-bold text-orange-600">{currentStreak} days</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-2xl font-bold text-orange-600">{currentStreak} days</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">Daily Bonus</div>
          <div className="text-lg font-bold text-green-600">+{streakBonus} pts</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-gray-700">Longest Streak</span>
        </div>
        <span className="text-lg font-bold text-purple-600">{longestStreak} days</span>
      </div>

      <div className="mt-3 text-xs text-gray-600 text-center">
        Complete tasks daily to maintain your streak and earn bonus points!
      </div>
    </div>
  );
}