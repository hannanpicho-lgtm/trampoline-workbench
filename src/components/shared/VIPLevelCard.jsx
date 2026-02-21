import { Award, TrendingUp, Zap, Clock, Headphones, Lock, Gift } from "lucide-react";

const VIP_LEVELS = {
  Bronze: { 
    min: 0, max: 39, commission: 0.5, 
    color: "from-amber-700 to-amber-900", 
    icon: "🥉",
    withdrawalTime: "48-72 hours",
    supportPriority: "Standard",
    dailyTaskLimit: 40,
    exclusiveTaskAccess: false,
    bonusMultiplier: 1.0,
    benefits: [
      "0.5% commission bonus",
      "Standard support",
      "40 tasks per day",
      "48-72h withdrawal"
    ]
  },
  Silver: { 
    min: 40, max: 44, commission: 1.0, 
    color: "from-gray-400 to-gray-600", 
    icon: "🥈",
    withdrawalTime: "24-48 hours",
    supportPriority: "Priority",
    dailyTaskLimit: 45,
    exclusiveTaskAccess: false,
    bonusMultiplier: 1.2,
    benefits: [
      "1.0% commission bonus",
      "Priority support",
      "45 tasks per day",
      "24-48h withdrawal",
      "1.2x bonus multiplier"
    ]
  },
  Gold: { 
    min: 45, max: 49, commission: 1.5, 
    color: "from-yellow-400 to-yellow-600", 
    icon: "🥇",
    withdrawalTime: "12-24 hours",
    supportPriority: "High Priority",
    dailyTaskLimit: 50,
    exclusiveTaskAccess: true,
    bonusMultiplier: 1.5,
    benefits: [
      "1.5% commission bonus",
      "High priority support",
      "50 tasks per day",
      "12-24h withdrawal",
      "1.5x bonus multiplier",
      "Exclusive task access"
    ]
  },
  Platinum: { 
    min: 50, max: 54, commission: 2.0, 
    color: "from-cyan-400 to-cyan-600", 
    icon: "💎",
    withdrawalTime: "6-12 hours",
    supportPriority: "VIP Support",
    dailyTaskLimit: 55,
    exclusiveTaskAccess: true,
    bonusMultiplier: 2.0,
    benefits: [
      "2.0% commission bonus",
      "VIP dedicated support",
      "55 tasks per day",
      "6-12h withdrawal",
      "2.0x bonus multiplier",
      "Exclusive task access",
      "Premium task pool"
    ]
  },
  Diamond: { 
    min: 55, max: 999, commission: 2.5, 
    color: "from-blue-400 to-purple-600", 
    icon: "💠",
    withdrawalTime: "1-6 hours",
    supportPriority: "Concierge",
    dailyTaskLimit: 60,
    exclusiveTaskAccess: true,
    bonusMultiplier: 2.5,
    benefits: [
      "2.5% commission bonus",
      "Concierge support 24/7",
      "60 tasks per day",
      "1-6h express withdrawal",
      "2.5x bonus multiplier",
      "Exclusive task access",
      "Premium task pool",
      "Special rewards program"
    ]
  }
};

export function getVIPLevel(tasksCompleted) {
  for (const [level, data] of Object.entries(VIP_LEVELS)) {
    if (tasksCompleted >= data.min && tasksCompleted <= data.max) {
      return { level, ...data };
    }
  }
  return { level: "Bronze", ...VIP_LEVELS.Bronze };
}

export default function VIPLevelCard({ tasksCompleted = 0, vipLevel, showDetails = false, onShowBenefits }) {
  // Use vipLevel prop if provided, otherwise calculate from tasksCompleted
  const currentVIP = vipLevel && VIP_LEVELS[vipLevel] 
    ? { level: vipLevel, ...VIP_LEVELS[vipLevel] }
    : getVIPLevel(tasksCompleted);
  const nextLevel = Object.entries(VIP_LEVELS).find(([_, data]) => data.min > tasksCompleted);
  const tasksToNext = nextLevel ? nextLevel[1].min - tasksCompleted : 0;
  
  return (
    <div className={`bg-gradient-to-br ${currentVIP.color} rounded-2xl p-5 shadow-lg text-white mb-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{currentVIP.icon}</div>
          <div>
            <div className="text-sm opacity-80">VIP Level</div>
            <div className="text-2xl font-bold">{currentVIP.level}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-80">Commission Boost</div>
          <div className="text-2xl font-bold">+{currentVIP.commission}%</div>
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs opacity-80">Withdrawal</span>
            </div>
            <div className="text-sm font-semibold">{currentVIP.withdrawalTime}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Headphones className="w-4 h-4" />
              <span className="text-xs opacity-80">Support</span>
            </div>
            <div className="text-sm font-semibold">{currentVIP.supportPriority}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs opacity-80">Daily Tasks</span>
            </div>
            <div className="text-sm font-semibold">{currentVIP.dailyTaskLimit}/day</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4" />
              <span className="text-xs opacity-80">Multiplier</span>
            </div>
            <div className="text-sm font-semibold">{currentVIP.bonusMultiplier}x</div>
          </div>
        </div>
      )}

      <div className="bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
        <div 
          className="bg-white h-full rounded-full transition-all duration-500"
          style={{ 
            width: nextLevel 
              ? `${((tasksCompleted - currentVIP.min) / (currentVIP.max - currentVIP.min + 1)) * 100}%`
              : '100%'
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs opacity-90">
        <span>{tasksCompleted} tasks completed</span>
        {nextLevel && (
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {tasksToNext} to {nextLevel[0]}
          </span>
        )}
      </div>

      {onShowBenefits && (
        <button
          type="button"
          onClick={onShowBenefits}
          className="w-full mt-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
        >
          View All VIP Benefits
        </button>
      )}
    </div>
  );
}