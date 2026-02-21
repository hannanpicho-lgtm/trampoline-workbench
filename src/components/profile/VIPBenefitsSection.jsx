import { Crown, Star, TrendingUp, Shield, Zap, Gift } from 'lucide-react';

const vipBenefits = {
  VIP1: {
    color: 'from-amber-600 to-amber-700',
    icon: Crown,
    benefits: [
      { icon: TrendingUp, text: 'Commission: $0.60 - $2.00 per task' },
      { icon: Star, text: '40 tasks per day' },
      { icon: Shield, text: 'Standard support' },
      { icon: Gift, text: 'Basic rewards' }
    ]
  },
  VIP2: {
    color: 'from-gray-400 to-gray-500',
    icon: Crown,
    benefits: [
      { icon: TrendingUp, text: 'Commission: $1.50 - $4.00 per task' },
      { icon: Star, text: '50 tasks per day' },
      { icon: Shield, text: 'Priority support' },
      { icon: Gift, text: 'Enhanced rewards' }
    ]
  },
  VIP3: {
    color: 'from-yellow-500 to-yellow-600',
    icon: Crown,
    benefits: [
      { icon: TrendingUp, text: 'Commission: $2.50 - $6.00 per task' },
      { icon: Star, text: '60 tasks per day' },
      { icon: Shield, text: 'VIP support 24/7' },
      { icon: Gift, text: 'Premium rewards' }
    ]
  },
  VIP4: {
    color: 'from-purple-500 to-purple-600',
    icon: Crown,
    benefits: [
      { icon: TrendingUp, text: 'Commission: $4.00 - $9.00 per task' },
      { icon: Star, text: '80 tasks per day' },
      { icon: Shield, text: 'Dedicated account manager' },
      { icon: Gift, text: 'Exclusive bonuses' }
    ]
  },
  VIP5: {
    color: 'from-blue-500 to-blue-600',
    icon: Crown,
    benefits: [
      { icon: TrendingUp, text: 'Commission: $6.00 - $15.00 per task' },
      { icon: Star, text: '100 tasks per day' },
      { icon: Shield, text: 'Concierge service' },
      { icon: Gift, text: 'Maximum rewards' }
    ]
  }
};

export default function VIPBenefitsSection({ appUser }) {
  const currentVIP = appUser?.vipLevel || 'VIP1';
  const vipConfig = vipBenefits[currentVIP] || vipBenefits.VIP1;
  const VIPIcon = vipConfig.icon;

  return (
    <div className="space-y-6">
      {/* Current VIP Status */}
      <div className={`bg-gradient-to-br ${vipConfig.color} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <VIPIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{currentVIP}</h3>
              <p className="text-white/80 text-sm">Current Level</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{appUser?.tasksCompleted || 0}</p>
            <p className="text-white/80 text-sm">Tasks Completed</p>
          </div>
        </div>
        
        {/* Progress to next level */}
        {currentVIP !== 'VIP5' && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-white/80 mb-2">Progress to next level</p>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(((appUser?.tasksCompleted || 0) % 50) * 2, 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1">
              {50 - ((appUser?.tasksCompleted || 0) % 50)} more tasks to upgrade
            </p>
          </div>
        )}
      </div>

      {/* Benefits List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vipConfig.benefits.map((benefit, idx) => {
          const BenefitIcon = benefit.icon;
          return (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${vipConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <BenefitIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-gray-700 flex-1">{benefit.text}</p>
            </div>
          );
        })}
      </div>

      {/* All VIP Levels Overview */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">All VIP Levels</h3>
        <div className="space-y-2">
          {Object.entries(vipBenefits).map(([level, config]) => {
            const isCurrentLevel = level === currentVIP;
            return (
              <div 
                key={level}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isCurrentLevel 
                    ? 'bg-gradient-to-r ' + config.color + ' text-white border-transparent shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className={`w-5 h-5 ${isCurrentLevel ? 'text-white' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${isCurrentLevel ? 'text-white' : 'text-gray-900'}`}>
                    {level}
                  </span>
                </div>
                {isCurrentLevel && (
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                    Current Level
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}