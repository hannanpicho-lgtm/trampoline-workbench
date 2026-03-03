import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";
import { Crown, TrendingUp, CheckCircle, X, Sparkles } from "lucide-react";

const VIP_BENEFITS = {
  "Bronze": ["Basic tasks", "0.5% commission", "30-40 tasks/set"],
  "Silver": ["More tasks", "1.0% commission", "40-50 tasks/set", "Higher limits"],
  "Gold": ["Premium tasks", "1.5% commission", "50-60 tasks/set", "Priority support"],
  "Platinum": ["High-value tasks", "2.0% commission", "60-70 tasks/set", "Exclusive access"],
  "Diamond": ["Elite tasks", "2.5% commission", "70-80 tasks/set", "VIP treatment"]
};

export default function VIPUpgradePrompt({ currentUser, appUser, onUpgradeRequested }) {
  const [availableUpgrades, setAvailableUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);

  useEffect(() => {
    if (appUser) {
      checkAvailableUpgrades();
    }
  }, [appUser]);

  const checkAvailableUpgrades = async () => {
    setLoading(true);
    try {
      const rules = await backendClient.entities.VIPUpgradeRule.filter({
        fromLevel: appUser.vipLevel,
        isActive: true
      });

      const eligible = rules.filter(rule => {
        if (rule.requirementType === "manual_approval") return true;
        if (rule.requirementType === "balance") {
          return appUser.balance >= rule.minBalance;
        }
        if (rule.requirementType === "tasks_completed") {
          return appUser.tasksCompleted >= rule.minTasksCompleted;
        }
        if (rule.requirementType === "both") {
          return appUser.balance >= rule.minBalance && appUser.tasksCompleted >= rule.minTasksCompleted;
        }
        return false;
      });

      setAvailableUpgrades(eligible);
    } catch (error) {
      console.error("Failed to check upgrades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async (rule) => {
    try {
      // Check if already pending request
      const existingRequests = await backendClient.entities.VIPUpgradeRequest.filter({
        userId: appUser.id,
        status: "pending"
      });

      if (existingRequests.length > 0) {
        toast.error("You already have a pending upgrade request");
        return;
      }

      if (rule.autoUpgrade && rule.requirementType !== "manual_approval") {
        // Auto-upgrade
        await base44.functions.invoke("processVIPUpgrade", {
          userId: appUser.id,
          targetLevel: rule.toLevel,
          ruleId: rule.id,
          autoUpgrade: true
        });
        toast.success("🎉 Upgraded to " + rule.toLevel + "!");
        setShowUpgradeModal(false);
        if (onUpgradeRequested) onUpgradeRequested();
      } else {
        // Create upgrade request
        await backendClient.entities.VIPUpgradeRequest.create({
          userId: appUser.id,
          currentLevel: appUser.vipLevel,
          requestedLevel: rule.toLevel,
          status: "pending",
          currentBalance: appUser.balance,
          currentTasksCompleted: appUser.tasksCompleted
        });
        toast.success("Upgrade request submitted!");
        setShowUpgradeModal(false);
        if (onUpgradeRequested) onUpgradeRequested();
      }
    } catch (error) {
      toast.error("Failed to request upgrade");
    }
  };

  if (loading || availableUpgrades.length === 0) return null;

  return (
    <>
      {/* Upgrade Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6" />
              <h3 className="text-xl font-bold">VIP Upgrade Available!</h3>
            </div>
            <p className="text-purple-100 mb-4">
              You're eligible to upgrade to {availableUpgrades[0].toLevel}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedUpgrade(availableUpgrades[0]);
                setShowUpgradeModal(true);
              }}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              View Upgrade Options
            </button>
          </div>
          <Sparkles className="w-12 h-12 text-purple-200" />
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUpgrade && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upgrade to {selectedUpgrade.toLevel}</h3>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current vs New */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Current</div>
                <div className="text-lg font-bold text-gray-900 mb-2">{appUser.vipLevel}</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {VIP_BENEFITS[appUser.vipLevel]?.map((benefit, i) => (
                    <li key={i}>• {benefit}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="text-xs text-purple-600 mb-1">Upgrade to</div>
                <div className="text-lg font-bold text-purple-900 mb-2">{selectedUpgrade.toLevel}</div>
                <ul className="text-xs text-purple-700 space-y-1">
                  {VIP_BENEFITS[selectedUpgrade.toLevel]?.map((benefit, i) => (
                    <li key={i}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="text-sm font-medium text-blue-900 mb-2">Requirements</div>
              <div className="space-y-2 text-sm text-blue-800">
                {selectedUpgrade.requirementType === "balance" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Balance: ${appUser.balance?.toFixed(2)} / ${selectedUpgrade.minBalance}
                  </div>
                )}
                {selectedUpgrade.requirementType === "tasks_completed" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Tasks: {appUser.tasksCompleted} / {selectedUpgrade.minTasksCompleted}
                  </div>
                )}
                {selectedUpgrade.requirementType === "both" && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Balance: ${appUser.balance?.toFixed(2)} / ${selectedUpgrade.minBalance}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Tasks: {appUser.tasksCompleted} / {selectedUpgrade.minTasksCompleted}
                    </div>
                  </>
                )}
                {selectedUpgrade.requirementType === "manual_approval" && (
                  <div className="text-blue-800">Requires admin approval</div>
                )}
                {selectedUpgrade.upgradeFee > 0 && (
                  <div className="text-amber-700 font-medium">
                    Upgrade Fee: ${selectedUpgrade.upgradeFee}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedUpgrade.description && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="text-sm text-purple-900">{selectedUpgrade.description}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRequestUpgrade(selectedUpgrade)}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium"
              >
                {selectedUpgrade.autoUpgrade ? "Upgrade Now" : "Request Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}