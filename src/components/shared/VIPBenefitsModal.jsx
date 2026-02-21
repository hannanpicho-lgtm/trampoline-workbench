import { X, Award, Zap, Clock, Headphones, Lock, Gift, TrendingUp, DollarSign } from "lucide-react";

const VIP_TIERS = {
  Bronze: {
    icon: "🥉",
    color: "from-amber-700 to-amber-900",
    borderColor: "border-amber-600",
    benefits: {
      commission: "0.5%",
      referral: "20%",
      withdrawal: "48-72h",
      support: "Standard (24h response)",
      depositBonus: "5%",
      tasks: "35/set",
      multiplier: "1.0x",
      exclusive: false,
      depositRange: "100-499"
    }
  },
  Silver: {
    icon: "🥈",
    color: "from-gray-400 to-gray-600",
    borderColor: "border-gray-500",
    benefits: {
      commission: "1.0%",
      referral: "22%",
      withdrawal: "24-48h",
      support: "Priority (8h response)",
      depositBonus: "8%",
      tasks: "40/set",
      multiplier: "1.2x",
      exclusive: false,
      depositRange: "500-3499"
    }
  },
  Gold: {
    icon: "🥇",
    color: "from-yellow-400 to-yellow-600",
    borderColor: "border-yellow-500",
    benefits: {
      commission: "1.5%",
      referral: "25%",
      withdrawal: "12-24h",
      support: "High Priority 24/7 (4h response)",
      depositBonus: "10%",
      tasks: "45/set",
      multiplier: "1.5x",
      exclusive: true,
      depositRange: "3500-5499"
    }
  },
  Platinum: {
    icon: "💎",
    color: "from-purple-400 to-purple-600",
    borderColor: "border-purple-500",
    benefits: {
      commission: "2.0%",
      referral: "28%",
      withdrawal: "6-12h Priority",
      support: "VIP 24/7 + Dedicated Agent (2h response)",
      depositBonus: "15%",
      tasks: "50/set",
      multiplier: "2.0x",
      exclusive: true,
      depositRange: "5500-9999"
    }
  },
  Diamond: {
    icon: "💠",
    color: "from-cyan-400 to-blue-600",
    borderColor: "border-blue-500",
    benefits: {
      commission: "2.5%",
      referral: "30%",
      withdrawal: "1-6h Instant",
      support: "Elite VIP 24/7 + Dedicated Manager (1h response)",
      depositBonus: "20%",
      tasks: "60/set",
      multiplier: "2.5x",
      exclusive: true,
      depositRange: "10000+"
    }
  }
};

export default function VIPBenefitsModal({ show, onClose, currentLevel = "Bronze" }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">VIP Benefits</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Benefits Overview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">How VIP Levels Work</h3>
            <p className="text-gray-700 text-sm">
              Complete tasks to increase your VIP level and unlock exclusive benefits. Each level provides enhanced commission rates, 
              faster withdrawals, priority support, and more!
            </p>
          </div>

          {/* VIP Tiers Grid */}
          <div className="grid gap-4">
            {Object.entries(VIP_TIERS).map(([tier, data]) => (
              <div
                key={tier}
                className={`border-2 ${data.borderColor} rounded-xl p-5 ${
                  currentLevel === tier ? "bg-gradient-to-r " + data.color + " text-white shadow-lg" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{data.icon}</div>
                    <div>
                      <div className={`text-xl font-bold ${currentLevel === tier ? "text-white" : "text-gray-900"}`}>
                        {tier}
                      </div>
                      {currentLevel === tier && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Current Level</span>
                      )}
                    </div>
                  </div>
                  {data.benefits.exclusive && (
                    <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      Exclusive
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`${currentLevel === tier ? "text-white/90" : "text-gray-600"}`}>
                    <div className="opacity-80 mb-0.5">Task Commission</div>
                    <div className="font-bold">{data.benefits.commission}</div>
                  </div>
                  <div className={`${currentLevel === tier ? "text-white/90" : "text-gray-600"}`}>
                    <div className="opacity-80 mb-0.5">Referral Bonus</div>
                    <div className="font-bold">{data.benefits.referral}</div>
                  </div>
                  <div className={`${currentLevel === tier ? "text-white/90" : "text-gray-600"}`}>
                    <div className="opacity-80 mb-0.5">Withdrawal Time</div>
                    <div className="font-bold">{data.benefits.withdrawal}</div>
                  </div>
                  <div className={`${currentLevel === tier ? "text-white/90" : "text-gray-600"}`}>
                    <div className="opacity-80 mb-0.5">Deposit Bonus</div>
                    <div className="font-bold">{data.benefits.depositBonus}</div>
                  </div>
                  <div className={`${currentLevel === tier ? "text-white/90" : "text-gray-600"} col-span-2`}>
                    <div className="opacity-80 mb-0.5">Support Level</div>
                    <div className="font-bold text-[11px] leading-tight">{data.benefits.support}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Task Requirements */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Level Requirements
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Bronze:</span>
                <span className="font-medium">0-39 tasks</span>
              </div>
              <div className="flex justify-between">
                <span>Silver:</span>
                <span className="font-medium">40-44 tasks</span>
              </div>
              <div className="flex justify-between">
                <span>Gold:</span>
                <span className="font-medium">45-49 tasks</span>
              </div>
              <div className="flex justify-between">
                <span>Platinum:</span>
                <span className="font-medium">50-54 tasks</span>
              </div>
              <div className="flex justify-between">
                <span>Diamond:</span>
                <span className="font-medium">55+ tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}