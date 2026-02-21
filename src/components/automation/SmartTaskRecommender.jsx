import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Target, Zap, Loader2 } from "lucide-react";
import { enqueueTask } from "../queue/TaskQueueManager";

export default function SmartTaskRecommender({ userId, vipLevel, onTaskSelect }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    if (userId) {
      loadRecommendations();
    }
  }, [userId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('smartTaskAssignment', {
        userId,
        limit: 5
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setUserContext(response.data.userContext);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      toast.error("Failed to load smart recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (rec) => {
    try {
      const result = await enqueueTask({
        userId,
        taskType: "standard",
        productId: rec.productId,
        vipLevel: vipLevel,
        commission: rec.product.commission,
        metadata: { aiRecommended: true, score: rec.score }
      });

      if (result.success) {
        toast.success("Task queued!", {
          description: `Priority position: #${result.position}`
        });
        if (onTaskSelect) onTaskSelect(rec.product);
      } else {
        toast.error("Failed to queue task");
      }
    } catch (error) {
      toast.error("Failed to accept recommendation");
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-purple-900 font-medium">AI analyzing best tasks for you...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900">AI-Powered Task Recommendations</h3>
        </div>
        <button
          type="button"
          onClick={loadRecommendations}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {userContext && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Success Rate</div>
            <div className="text-lg font-bold text-green-600">{userContext.successRate}%</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Avg Commission</div>
            <div className="text-lg font-bold text-blue-600">${userContext.avgCommission}</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">VIP Level</div>
            <div className="text-lg font-bold text-purple-600">{userContext.vipLevel}</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div key={rec.productId} className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                  <h4 className="font-semibold text-gray-900">{rec.product.name}</h4>
                </div>
                <div className="text-sm text-gray-600 mb-2">{rec.reasoning}</div>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-lg font-bold text-purple-900">{rec.score}</span>
                  <span className="text-xs text-gray-500">/100</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(rec.riskLevel)}`}>
                  {rec.riskLevel} risk
                </span>
                <span className="text-xs text-gray-600">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  {rec.expectedSuccess}% success
                </span>
                <span className="text-sm font-semibold text-green-600">
                  +${rec.product.commission}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAcceptRecommendation(rec)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}