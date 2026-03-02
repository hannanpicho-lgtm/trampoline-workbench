import { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function adminHealthCheck(user, userTasks, products) {
  const tasksInSet = user.tasksInCurrentSet || 0;
  const tasksPerSet = 40;
  const tasksRemaining = tasksPerSet - tasksInSet;
  
  // Calculate total commission from assigned products
  const productCommissions = products
    .filter(p => userTasks.some(t => t.productId === p.id))
    .reduce((sum, p) => sum + p.commission, 0);

  const premiumCompleted = userTasks.some(t => t.isPremiumOrder && t.status === 'completed');

  return {
    userId: user.id,
    userEmail: user.created_by,
    vipLevel: user.vipLevel || 'Bronze',
    currentSet: `${user.taskSetsCompleted || 0}/2`,
    tasksCompleted: user.tasksCompleted || 0,
    tasksRemaining: tasksRemaining,
    totalCommission: productCommissions.toFixed(2),
    commissionValid: productCommissions >= 131 && productCommissions <= 150,
    withdrawalLocked: (user.taskSetsCompleted || 0) < 2,
    premiumProductCompleted: premiumCompleted,
    needsReset: user.needsReset || false
  };
}

export default function UserHealthCheck() {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const users = await backendClient.entities.AppUser.filter({ vipLevel: 'Bronze' });
      const allTasks = await backendClient.entities.UserTask.list();
      const products = await backendClient.entities.Product.list();

      const results = users.map(user => {
        const userTasks = allTasks.filter(t => t.userId === user.id);
        return adminHealthCheck(user, userTasks, products);
      });

      setHealthData(results);
      toast.success(`Health check complete for ${results.length} users`);
    } catch (error) {
      toast.error("Failed to run health check");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">User Health Check</h3>
          <p className="text-sm text-gray-500">VIP1 (Bronze) user status overview</p>
        </div>
        <button
          type="button"
          onClick={runHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {healthData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Set</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks Done</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Withdrawal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {healthData.map((data, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{data.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {data.vipLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{data.currentSet}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{data.tasksCompleted}</td>
                  <td className="px-4 py-3 text-gray-600">{data.tasksRemaining}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">${data.totalCommission}</td>
                  <td className="px-4 py-3">
                    {data.commissionValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {data.withdrawalLocked ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        Locked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {data.premiumProductCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {data.needsReset ? (
                      <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        Needs Reset
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {loading ? "Loading health data..." : "No users found"}
        </div>
      )}
    </div>
  );
}