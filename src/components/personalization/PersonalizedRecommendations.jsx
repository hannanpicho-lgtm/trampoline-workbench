import { Lightbulb, AlertCircle, Gift, Zap, ArrowRight } from 'lucide-react';
import { getContentRecommendations } from './PersonalizationEngine';

const getRecommendationStyle = (type) => {
  switch (type) {
    case 'info':
      return 'from-blue-100 to-cyan-100 border-blue-300 text-blue-900';
    case 'motivation':
      return 'from-green-100 to-emerald-100 border-green-300 text-green-900';
    case 'warning':
      return 'from-amber-100 to-orange-100 border-amber-300 text-amber-900';
    case 'bonus':
      return 'from-purple-100 to-pink-100 border-purple-300 text-purple-900';
    case 'achievement':
      return 'from-yellow-100 to-orange-100 border-yellow-300 text-yellow-900';
    default:
      return 'from-gray-100 to-gray-200 border-gray-300 text-gray-900';
  }
};

const getRecommendationIcon = (type) => {
  switch (type) {
    case 'info':
      return <Lightbulb className="w-5 h-5" />;
    case 'motivation':
      return <Zap className="w-5 h-5" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5" />;
    case 'bonus':
      return <Gift className="w-5 h-5" />;
    case 'achievement':
      return <span className="text-xl">🎉</span>;
    default:
      return <Lightbulb className="w-5 h-5" />;
  }
};

export default function PersonalizedRecommendations({ appUser, onNavigate }) {
  const recommendations = getContentRecommendations(appUser);

  if (recommendations.length === 0) return null;

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-3">
      {sorted.slice(0, 3).map((rec, index) => (
        <div
          key={index}
          className={`bg-gradient-to-r ${getRecommendationStyle(
            rec.type
          )} rounded-xl p-4 border-2 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {getRecommendationIcon(rec.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
            <p className="text-xs opacity-80 mb-3">{rec.message}</p>
            <button
              type="button"
              onClick={() => {
                if (rec.action === 'Start New Task') onNavigate('starting');
                if (rec.action === 'View Tasks') onNavigate('starting');
                if (rec.action === 'View Leaderboard') onNavigate('leaderboard');
                if (rec.action === 'Share Code') onNavigate('referral');
              }}
              className="inline-flex items-center gap-2 text-xs font-medium bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              {rec.action}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}