import React from "react";
import { CheckCircle, Gift, TrendingUp, Zap } from "lucide-react";
import { formatRewardsSummary } from "./RewardsCalculator";

export default function RewardsDisplay({ rewards, onClose }) {
  const rewardItems = formatRewardsSummary(rewards);

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Success Header */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Task Completed! 🎉</h2>
          <p className="text-sm text-gray-600">Rewards added to your account</p>
        </div>

        {/* Total Reward */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3 mb-3">
          <div className="text-center">
            <div className="text-xs text-green-700 font-medium mb-1">Total Earnings</div>
            <div className="text-3xl font-bold text-green-600">
              ${rewards.totalReward.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="space-y-2 mb-3">
          {rewardItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Special Boosts */}
        {rewards.boosts.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-purple-900">Special Bonuses</h3>
            </div>
            {rewards.boosts.map((boost, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-purple-700 text-xs">{boost.label}</span>
                <span className="text-purple-900 font-bold text-xs">{boost.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          Continue to Next Task
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">Next task will start automatically in 3s</p>
      </div>
    </div>
  );
}