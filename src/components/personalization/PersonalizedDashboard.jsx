import { TrendingUp, Target, Zap } from 'lucide-react';
import { analyzeUserBehavior } from './PersonalizationEngine';

export default function PersonalizedDashboard({ appUser, userTasks = [] }) {
  const insights = analyzeUserBehavior(appUser, userTasks);

  const getEngagementColor = (level) => {
    switch (level) {
      case 'high':
        return 'from-emerald-100 to-green-100 border-green-300';
      case 'moderate-high':
        return 'from-blue-100 to-cyan-100 border-blue-300';
      case 'moderate':
        return 'from-yellow-100 to-orange-100 border-orange-300';
      case 'low':
        return 'from-red-100 to-orange-100 border-red-300';
      default:
        return 'from-gray-100 to-gray-200 border-gray-300';
    }
  };

  const getEngagementText = (level) => {
    switch (level) {
      case 'high':
        return 'Outstanding! Keep up the great work';
      case 'moderate-high':
        return 'Great progress! You\'re on a roll';
      case 'moderate':
        return 'Good activity. Room for improvement';
      case 'low':
        return 'Time to get back on track';
      default:
        return 'Keep improving';
    }
  };

  return (
    <div className="space-y-4">
      {/* Engagement Status */}
      <div
        className={`bg-gradient-to-br ${getEngagementColor(
          insights.engagementLevel
        )} rounded-xl p-5 border-2`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase">
              Engagement Level
            </div>
            <div className="text-lg font-bold capitalize mt-1">
              {insights.engagementLevel.replace('-', ' ')}
            </div>
          </div>
          <Zap className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-xs text-gray-700">
          {getEngagementText(insights.engagementLevel)}
        </p>
      </div>

      {/* Task Completion Rate */}
      <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-5 border-2 border-purple-300">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase">
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {insights.taskCompletionRate}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>
        <div className="w-full bg-white/40 rounded-full h-2">
          <div
            className="bg-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${insights.taskCompletionRate}%` }}
          />
        </div>
      </div>

      {/* VIP Progression */}
      {insights.nextMilestone && (
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-5 border-2 border-amber-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-gray-600 uppercase">
                Path to {insights.nextMilestone.level} VIP
              </div>
              <div className="text-sm font-bold text-amber-900 mt-1">
                {insights.nextMilestone.tasksNeeded} tasks to go
              </div>
            </div>
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <div className="w-full bg-white/40 rounded-full h-2">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(insights.nextMilestone.progress, 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Suggested Focus Areas */}
      {insights.suggestedFocus.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Ways to Improve
          </h4>
          <div className="space-y-2">
            {insights.suggestedFocus.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-gray-700"
              >
                <span className="text-base leading-none">💡</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}