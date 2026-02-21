import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, TestTube, User } from "lucide-react";

const VIP_CONFIGS = {
  "Bronze": { balance: 150, label: "VIP1", min: 100, email: "test-vip1@example.com" },
  "Silver": { balance: 1500, label: "VIP2", min: 1000, email: "test-vip2@example.com" },
  "Gold": { balance: 5000, label: "VIP3", min: 4000, email: "test-vip3@example.com" },
  "Platinum": { balance: 8500, label: "VIP4", min: 7000, email: "test-vip4@example.com" },
  "Diamond": { balance: 12000, label: "VIP5", min: 10000, email: "test-vip5@example.com" }
};

export default function QuickTestSetup() {
  const [loading, setLoading] = useState({});

  const setupTestUser = async (vipLevel) => {
    setLoading(prev => ({ ...prev, [vipLevel]: true }));
    try {
      const config = VIP_CONFIGS[vipLevel];
      
      // Check if AppUser exists
      const existingAppUsers = await base44.entities.AppUser.filter({ created_by: config.email });
      
      if (existingAppUsers.length > 0) {
        // Reset existing user
        await base44.entities.AppUser.update(existingAppUsers[0].id, {
          balance: config.balance,
          frozenBalance: 0,
          isFrozen: false,
          vipLevel: vipLevel,
          tasksCompleted: 0,
          tasksInCurrentSet: 0,
          taskSetsCompleted: 0,
          needsReset: false,
          creditScore: 100
        });

        // Delete existing tasks
        const tasks = await base44.entities.UserTask.filter({ userId: existingAppUsers[0].id });
        for (const task of tasks) {
          await base44.entities.UserTask.delete(task.id);
        }

        toast.success(`${config.label} test user reset!`, {
          description: `Balance: $${config.balance}`
        });
      } else {
        // Create new AppUser
        await base44.entities.AppUser.create({
          phone: `+123456789${Object.keys(VIP_CONFIGS).indexOf(vipLevel)}`,
          invitationCode: `TEST${config.label}`,
          balance: config.balance,
          vipLevel: vipLevel,
          tasksCompleted: 0,
          tasksInCurrentSet: 0,
          taskSetsCompleted: 0,
          needsReset: false,
          isFrozen: false,
          creditScore: 100,
          successRate: 100,
          performanceLevel: "new",
          created_by: config.email
        });

        toast.success(`${config.label} test user created!`, {
          description: `Login: ${config.email}`
        });
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [vipLevel]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Quick Test Setup - All VIP Levels</h3>
      </div>

      <div className="space-y-3">
        {Object.entries(VIP_CONFIGS).map(([level, config]) => (
          <div key={level} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                level === "Bronze" ? "bg-orange-100" :
                level === "Silver" ? "bg-gray-100" :
                level === "Gold" ? "bg-yellow-100" :
                level === "Platinum" ? "bg-purple-100" :
                "bg-blue-100"
              }`}>
                <User className={`w-5 h-5 ${
                  level === "Bronze" ? "text-orange-600" :
                  level === "Silver" ? "text-gray-600" :
                  level === "Gold" ? "text-yellow-600" :
                  level === "Platinum" ? "text-purple-600" :
                  "text-blue-600"
                }`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{config.label} - {level}</div>
                <div className="text-xs text-gray-600">{config.email}</div>
                <div className="text-xs text-gray-500">
                  Balance: ${config.balance.toLocaleString()} • Range: ${config.min}-${config.max ? `$${config.max.toLocaleString()}` : "∞"}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setupTestUser(level)}
              disabled={loading[level]}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading[level] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Setup"
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">📝 Test Flow:</p>
        <ol className="list-decimal ml-4 space-y-0.5">
          <li>Click "Setup" to create/reset test user</li>
          <li>Login with test-vipX@example.com</li>
          <li>Navigate to "Starting" page</li>
          <li>Submit tasks (Set 1: no premium products)</li>
          <li>After completing set, reset via support</li>
          <li>Set 2: premium products appear</li>
        </ol>
      </div>
    </div>
  );
}