import { useState, useEffect } from "react";
import { ChevronLeft, Crown, CheckCircle, Lock, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { backendClient } from "@/api/backendClient";

const vipLevels = [
  {
    level: "Bronze",
    icon: "🥉",
    color: "from-orange-400 to-orange-600",
    minBalance: 100,
    minTasks: 0,
    benefits: [
      "0.5% commission rate",
      "20% referral commission",
      "Basic support",
      "35 tasks per set",
      "$100 minimum balance",
      "48-72h withdrawal processing",
      "5% deposit bonus on $100+"
    ],
    features: {
      commissionRate: "0.5%",
      taskLimit: 35,
      supportLevel: "Basic"
    }
  },
  {
    level: "Silver",
    icon: "🥈",
    color: "from-gray-300 to-gray-500",
    minBalance: 500,
    minTasks: 50,
    benefits: [
      "1.0% commission rate",
      "22% referral commission",
      "Priority support (faster response)",
      "40 tasks per set",
      "$150 minimum balance",
      "24-48h withdrawal processing",
      "8% deposit bonus on $100+",
      "Silver badge on profile"
    ],
    features: {
      commissionRate: "1.0%",
      taskLimit: 40,
      supportLevel: "Priority"
    }
  },
  {
    level: "Gold",
    icon: "🥇",
    color: "from-yellow-400 to-yellow-600",
    minBalance: 3500,
    minTasks: 150,
    benefits: [
      "1.5% commission rate",
      "25% referral commission",
      "High priority support 24/7",
      "45 tasks per set",
      "$200 minimum balance",
      "12-24h withdrawal processing",
      "10% deposit bonus on $100+",
      "Gold badge on profile",
      "Monthly bonus rewards"
    ],
    features: {
      commissionRate: "1.5%",
      taskLimit: 45,
      supportLevel: "Priority+"
    }
  },
  {
    level: "Platinum",
    icon: "🏆",
    color: "from-purple-400 to-purple-600",
    minBalance: 5500,
    minTasks: 300,
    benefits: [
      "2.0% commission rate",
      "28% referral commission",
      "VIP support 24/7 with dedicated agent",
      "50 tasks per set",
      "$300 minimum balance",
      "6-12h priority withdrawal",
      "15% deposit bonus on $100+",
      "Platinum badge on profile",
      "Weekly bonus rewards",
      "Dedicated account manager"
    ],
    features: {
      commissionRate: "2.0%",
      taskLimit: 50,
      supportLevel: "VIP 24/7"
    }
  },
  {
    level: "Diamond",
    icon: "💎",
    color: "from-cyan-400 to-blue-600",
    minBalance: 10000,
    minTasks: 500,
    benefits: [
      "2.5% commission rate",
      "30% referral commission",
      "Elite VIP support 24/7 with dedicated agent",
      "60 tasks per set",
      "$500 minimum balance",
      "1-6h instant withdrawal processing",
      "20% deposit bonus on $100+",
      "Diamond badge on profile",
      "Daily bonus rewards",
      "Dedicated account manager",
      "Exclusive access to premium products",
      "Special promotions and events"
    ],
    features: {
      commissionRate: "2.5%",
      taskLimit: 60,
      supportLevel: "Elite VIP 24/7"
    }
  }
];

export default function VIPPage({ currentUser, onNavigate }) {
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeRules, setUpgradeRules] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appUserData, rules] = await Promise.all([
        backendClient.entities.AppUser.filter({ created_by: currentUser.email }),
        backendClient.entities.VIPUpgradeRule.filter({ isActive: true })
      ]);

      if (appUserData.length > 0) {
        setAppUser(appUserData[0]);
      }
      setUpgradeRules(rules);
    } catch (error) {
      toast.error("Failed to load VIP data");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevelIndex = () => {
    return vipLevels.findIndex(v => v.level === (appUser?.vipLevel || "Bronze"));
  };

  const canUpgradeTo = (targetLevel) => {
    const currentIndex = getCurrentLevelIndex();
    const targetIndex = vipLevels.findIndex(v => v.level === targetLevel);
    
    if (targetIndex <= currentIndex) return { canUpgrade: false, reason: "Already at or above this level" };
    
    const target = vipLevels[targetIndex];
    const currentBalance = appUser?.balance || 0;
    const currentTasks = appUser?.tasksCompleted || 0;
    
    if (currentBalance < target.minBalance) {
      return { 
        canUpgrade: false, 
        reason: `Need $${target.minBalance} balance (current: $${currentBalance.toFixed(2)})` 
      };
    }
    
    if (currentTasks < target.minTasks) {
      return { 
        canUpgrade: false, 
        reason: `Need ${target.minTasks} completed tasks (current: ${currentTasks})` 
      };
    }
    
    const rule = upgradeRules.find(r => 
      r.fromLevel === appUser?.vipLevel && r.toLevel === targetLevel
    );
    
    if (rule && rule.upgradeFee > currentBalance) {
      return { 
        canUpgrade: false, 
        reason: `Upgrade fee: $${rule.upgradeFee} (insufficient balance)` 
      };
    }
    
    return { canUpgrade: true, rule };
  };

  const handleUpgradeRequest = async () => {
    if (!selectedUpgrade) return;
    
    setUpgrading(true);
    try {
      const rule = upgradeRules.find(r => 
        r.fromLevel === appUser.vipLevel && r.toLevel === selectedUpgrade.level
      );

      if (rule?.autoUpgrade) {
        await base44.functions.invoke('processVIPUpgrade', {
          userId: appUser.id,
          targetLevel: selectedUpgrade.level,
          currentLevel: appUser.vipLevel
        });
        
        toast.success("VIP Level Upgraded! 🎉", {
          description: `You are now ${selectedUpgrade.level}!`
        });
      } else {
        await backendClient.entities.VIPUpgradeRequest.create({
          userId: appUser.id,
          currentLevel: appUser.vipLevel,
          requestedLevel: selectedUpgrade.level,
          status: "pending",
          currentBalance: appUser.balance,
          currentTasksCompleted: appUser.tasksCompleted
        });
        
        toast.success("Upgrade request submitted!", {
          description: "An admin will review your request shortly"
        });
      }
      
      setShowUpgradeModal(false);
      setSelectedUpgrade(null);
      loadData();
    } catch (error) {
      toast.error("Upgrade failed", { description: error.message });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const currentLevelIndex = getCurrentLevelIndex();
  const currentLevel = vipLevels[currentLevelIndex];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-8">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">VIP Benefits</h1>
          <div className="w-10" />
        </div>

        <div className={`bg-gradient-to-r ${currentLevel.color} rounded-2xl p-6 shadow-lg`}>
          <div className="text-center">
            <div className="text-6xl mb-3">{currentLevel.icon}</div>
            <div className="text-white text-3xl font-bold mb-2">{currentLevel.level}</div>
            <div className="text-white/90 text-sm mb-4">Your Current VIP Level</div>
            <div className="grid grid-cols-2 gap-3 text-white/90 text-xs">
              <div className="bg-white/20 rounded-lg p-2">
                <div className="font-semibold">Balance</div>
                <div className="text-lg font-bold">${(appUser?.balance || 0).toFixed(0)}</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <div className="font-semibold">Tasks</div>
                <div className="text-lg font-bold">{appUser?.tasksCompleted || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Your Benefits
          </h3>
          <div className="space-y-2">
            {currentLevel.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Upgrade Path
          </h3>
          <div className="space-y-3">
            {vipLevels.map((level, idx) => {
              const isCurrent = idx === currentLevelIndex;
              const isPast = idx < currentLevelIndex;
              const upgradeCheck = !isCurrent && !isPast ? canUpgradeTo(level.level) : null;
              
              return (
                <div 
                  key={level.level}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${
                    isCurrent 
                      ? "border-blue-500 bg-blue-50" 
                      : isPast 
                      ? "border-green-500 bg-green-50" 
                      : upgradeCheck?.canUpgrade
                      ? "border-purple-300 bg-white hover:border-purple-500 cursor-pointer"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  onClick={() => {
                    if (upgradeCheck?.canUpgrade) {
                      setSelectedUpgrade(level);
                      setShowUpgradeModal(true);
                    }
                  }}
                >
                  <div className={`bg-gradient-to-r ${level.color} px-4 py-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{level.icon}</span>
                        <div>
                          <div className="text-white font-bold text-lg">{level.level}</div>
                          <div className="text-white/80 text-xs">
                            {level.minBalance > 0 && `$${level.minBalance}+ balance`}
                            {level.minTasks > 0 && ` • ${level.minTasks}+ tasks`}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold">
                          CURRENT
                        </div>
                      )}
                      {isPast && (
                        <CheckCircle className="w-6 h-6 text-white" />
                      )}
                      {upgradeCheck?.canUpgrade && (
                        <div className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                          UPGRADE
                        </div>
                      )}
                      {!isCurrent && !isPast && !upgradeCheck?.canUpgrade && (
                        <Lock className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Commission</div>
                        <div className="text-sm font-bold text-gray-900">{level.features.commissionRate}</div>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Tasks/Set</div>
                        <div className="text-sm font-bold text-gray-900">{level.features.taskLimit}</div>
                      </div>
                    </div>
                    
                    {!isCurrent && !isPast && upgradeCheck && !upgradeCheck.canUpgrade && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                        <Lock className="w-3 h-3 inline mr-1" />
                        {upgradeCheck.reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Features Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-2">Feature</th>
                  {vipLevels.slice(currentLevelIndex).map(level => (
                    <th key={level.level} className="text-center py-2 px-2">
                      <div className="text-lg">{level.icon}</div>
                      <div className="font-semibold">{level.level}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium">Commission Rate</td>
                  {vipLevels.slice(currentLevelIndex).map(level => (
                    <td key={level.level} className="text-center py-2 px-2 font-bold text-green-600">
                      {level.features.commissionRate}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium">Tasks per Set</td>
                  {vipLevels.slice(currentLevelIndex).map(level => (
                    <td key={level.level} className="text-center py-2 px-2">
                      {level.features.taskLimit}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium">Support Level</td>
                  {vipLevels.slice(currentLevelIndex).map(level => (
                    <td key={level.level} className="text-center py-2 px-2 text-xs">
                      {level.features.supportLevel}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showUpgradeModal && selectedUpgrade && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Upgrade to {selectedUpgrade.level}
            </h2>

            <div className={`bg-gradient-to-r ${selectedUpgrade.color} rounded-xl p-6 text-white mb-4`}>
              <div className="text-center">
                <div className="text-5xl mb-2">{selectedUpgrade.icon}</div>
                <div className="text-2xl font-bold mb-1">{selectedUpgrade.level}</div>
                <div className="text-white/90 text-sm">{selectedUpgrade.features.commissionRate} Commission Rate</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900">You'll get:</h3>
              {selectedUpgrade.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-gray-900">${(appUser?.balance || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Upgrade Fee:</span>
                <span className="font-bold text-green-600">
                  {canUpgradeTo(selectedUpgrade.level).rule?.upgradeFee || 0 > 0 
                    ? `$${canUpgradeTo(selectedUpgrade.level).rule.upgradeFee}`
                    : "FREE"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedUpgrade(null);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpgradeRequest}
                disabled={upgrading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {upgrading ? "Processing..." : "Confirm Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}