import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { backendClient } from "@/api/backendClient";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    pendingWithdrawals: 0,
    pendingAmount: 0,
    lowBalanceUsers: 0,
    highVolumeWithdrawals: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      // Get pending withdrawals
      const payouts = await backendClient.entities.CommissionPayout.filter({ status: "pending" });
      const pendingAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
      
      // Get users with low balance and incomplete withdrawals
      const appUsers = await backendClient.entities.AppUser.list("-created_date", 100);
      const lowBalanceUsers = appUsers.filter(u => u.balance < 10).length;

      // Check for high volume of withdrawals in last 24 hours
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentWithdrawals = appUsers.filter(u => {
        const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
        return lastLogin && lastLogin > oneDayAgo;
      }).length;
      const highVolume = payouts.length > 10;

      // Build alerts
      const newAlerts = [];
      
      if (payouts.length > 0) {
        newAlerts.push({
          id: "pending-withdrawals",
          type: "warning",
          icon: Clock,
          title: `${payouts.length} Pending Withdrawals`,
          message: `Total amount: $${pendingAmount.toFixed(2)}`,
          action: "Review",
          color: "yellow"
        });
      }

      if (highVolume) {
        newAlerts.push({
          id: "high-volume",
          type: "alert",
          icon: TrendingUp,
          title: "High Withdrawal Volume",
          message: `${payouts.length} pending withdrawals detected`,
          action: "Investigate",
          color: "red"
        });
      }

      if (lowBalanceUsers > 0) {
        newAlerts.push({
          id: "low-balance",
          type: "info",
          icon: DollarSign,
          title: `${lowBalanceUsers} Users with Low Balance`,
          message: "Users have balance below $10",
          action: "Review",
          color: "blue"
        });
      }

      setAlerts(newAlerts);
      setStats({
        pendingWithdrawals: payouts.length,
        pendingAmount: pendingAmount,
        lowBalanceUsers: lowBalanceUsers,
        highVolumeWithdrawals: highVolume
      });
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (color) => {
    switch (color) {
      case "red":
        return "bg-red-50 border-red-200 text-red-900";
      case "yellow":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "blue":
        return "bg-blue-50 border-blue-200 text-blue-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-600 uppercase">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pendingWithdrawals}</p>
              <p className="text-sm text-yellow-700 mt-1">${stats.pendingAmount.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className={`${stats.highVolumeWithdrawals ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} border rounded-lg p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-medium ${stats.highVolumeWithdrawals ? "text-red-600" : "text-green-600"} uppercase`}>
                {stats.highVolumeWithdrawals ? "High Volume Alert" : "Withdrawal Status"}
              </p>
              <p className={`text-2xl font-bold mt-1 ${stats.highVolumeWithdrawals ? "text-red-900" : "text-green-900"}`}>
                {stats.highVolumeWithdrawals ? "⚠️" : "✓"}
              </p>
              <p className={`text-sm mt-1 ${stats.highVolumeWithdrawals ? "text-red-700" : "text-green-700"}`}>
                {stats.highVolumeWithdrawals ? "Abnormal activity" : "Normal"}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${stats.highVolumeWithdrawals ? "text-red-600" : "text-green-600"}`} />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase">Low Balance Users</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.lowBalanceUsers}</p>
              <p className="text-sm text-blue-700 mt-1">Below $10</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Last Updated</p>
              <p className="text-sm text-gray-900 mt-1 font-mono">{new Date().toLocaleTimeString()}</p>
              <p className="text-xs text-gray-600 mt-2">Auto-refresh: 5 min</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
        {alerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-900">
            ✓ All systems normal. No critical alerts.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.color)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm opacity-90 mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 bg-white/50 hover:bg-white rounded text-sm font-medium whitespace-nowrap ml-4"
                  >
                    {alert.action}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}