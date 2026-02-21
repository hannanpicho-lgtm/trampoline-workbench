import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Award, TrendingUp, Users } from "lucide-react";

const VIP_COLORS = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#00d4ff',
  Diamond: '#b9f2ff'
};

export default function VIPAnalytics() {
  const [loading, setLoading] = useState(true);
  const [vipDistribution, setVipDistribution] = useState([]);
  const [vipProgression, setVipProgression] = useState([]);
  const [vipStats, setVipStats] = useState([]);

  useEffect(() => {
    loadVIPAnalytics();
  }, []);

  const loadVIPAnalytics = async () => {
    setLoading(true);
    try {
      const appUsers = await base44.entities.AppUser.list();

      // VIP Distribution
      const distribution = {};
      appUsers.forEach(user => {
        const vip = user.vipLevel || "Bronze";
        distribution[vip] = (distribution[vip] || 0) + 1;
      });
      setVipDistribution(Object.entries(distribution).map(([vip, count]) => ({ vip, count })));

      // VIP Stats with averages
      const stats = {};
      appUsers.forEach(user => {
        const vip = user.vipLevel || "Bronze";
        if (!stats[vip]) {
          stats[vip] = {
            vip,
            users: 0,
            totalTasks: 0,
            totalBalance: 0,
            totalPoints: 0
          };
        }
        stats[vip].users++;
        stats[vip].totalTasks += user.tasksCompleted || 0;
        stats[vip].totalBalance += user.balance || 0;
        stats[vip].totalPoints += user.points || 0;
      });

      const statsArray = Object.values(stats).map(s => ({
        vip: s.vip,
        users: s.users,
        avgTasks: (s.totalTasks / s.users).toFixed(1),
        avgBalance: (s.totalBalance / s.users).toFixed(2),
        avgPoints: (s.totalPoints / s.users).toFixed(0)
      }));
      setVipStats(statsArray);

      // VIP Progression (users close to upgrading)
      const progression = [
        { level: "Bronze → Silver", count: appUsers.filter(u => u.vipLevel === "Bronze" && u.tasksCompleted >= 15 && u.tasksCompleted < 30).length },
        { level: "Silver → Gold", count: appUsers.filter(u => u.vipLevel === "Silver" && u.tasksCompleted >= 45 && u.tasksCompleted < 60).length },
        { level: "Gold → Platinum", count: appUsers.filter(u => u.vipLevel === "Gold" && u.tasksCompleted >= 90 && u.tasksCompleted < 120).length },
        { level: "Platinum → Diamond", count: appUsers.filter(u => u.vipLevel === "Platinum" && u.tasksCompleted >= 180 && u.tasksCompleted < 240).length }
      ];
      setVipProgression(progression);

    } catch (error) {
      console.error("Failed to load VIP analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading VIP analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">VIP Level Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-sm p-6 border-2 border-yellow-200">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Total VIP Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {vipDistribution.reduce((sum, v) => sum + v.count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-sm p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Users Near Upgrade</p>
              <p className="text-3xl font-bold text-gray-900">
                {vipProgression.reduce((sum, p) => sum + p.count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Diamond VIP Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {vipDistribution.find(v => v.vip === "Diamond")?.count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIP Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">VIP Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vipDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ vip, count, percent }) => `${vip}: ${count} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {vipDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={VIP_COLORS[entry.vip] || '#999'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Users Near Upgrade */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users Close to VIP Upgrade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vipProgression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* VIP Stats Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">VIP Level Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIP Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vipStats.map((stat) => (
                <tr key={stat.vip} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: VIP_COLORS[stat.vip] + '40', color: VIP_COLORS[stat.vip] }}>
                      {stat.vip}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.avgTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.avgBalance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.avgPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}