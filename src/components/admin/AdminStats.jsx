import { useState, useEffect } from "react";
import { Users, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingTasks: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, tasks, withdrawals] = await Promise.all([
        base44.entities.AppUser.list(),
        base44.entities.UserTask.filter({ status: "pending" }),
        base44.entities.Transaction.filter({ type: "withdrawal", status: "pending" })
      ]);

      const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

      setStats({
        totalUsers: users.length,
        totalBalance: totalBalance,
        pendingTasks: tasks.length,
        pendingWithdrawals: withdrawals.length
      });
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  };

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "bg-blue-500" },
    { icon: DollarSign, label: "Total Balance", value: `$${stats.totalBalance.toFixed(2)}`, color: "bg-green-500" },
    { icon: CheckCircle, label: "Pending Tasks", value: stats.pendingTasks, color: "bg-orange-500" },
    { icon: TrendingUp, label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "bg-purple-500" }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white/70 text-sm">{stat.label}</div>
              <div className="text-white text-2xl font-bold">{stat.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}