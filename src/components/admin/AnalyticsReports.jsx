import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, CheckCircle, TrendingUp, Calendar, Award } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalCommissions: 0,
    avgCompletionRate: 0,
  });
  const [dateRange, setDateRange] = useState("7days");
  const [activityData, setActivityData] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [users, tasks, appUsers] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.UserTask.list(),
        base44.entities.AppUser.list()
      ]);

      // Calculate stats
      const now = new Date();
      const rangeMs = dateRange === "7days" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(now.getTime() - rangeMs);

      const recentTasks = tasks.filter(t => new Date(t.created_date) >= cutoffDate);
      const completedTasks = recentTasks.filter(t => t.status === "completed" || t.status === "approved");
      const totalCommissions = completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);

      const activeUsers = appUsers.filter(u => u.lastLogin && new Date(u.lastLogin) >= cutoffDate);

      setStats({
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalTasks: recentTasks.length,
        completedTasks: completedTasks.length,
        totalCommissions: totalCommissions,
        avgCompletionRate: recentTasks.length > 0 ? (completedTasks.length / recentTasks.length * 100) : 0
      });

      // Activity over time
      const days = dateRange === "7days" ? 7 : 30;
      const activityByDay = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayTasks = tasks.filter(t => {
          const taskDate = new Date(t.created_date);
          return taskDate >= dayStart && taskDate <= dayEnd;
        });
        
        activityByDay.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tasks: dayTasks.length,
          completed: dayTasks.filter(t => t.status === "completed" || t.status === "approved").length,
          commission: dayTasks.filter(t => t.status === "completed" || t.status === "approved").reduce((sum, t) => sum + (t.commission || 0), 0)
        });
      }
      setActivityData(activityByDay);

      // Commission distribution
      const commissionByVIP = {};
      for (const task of completedTasks) {
        const user = appUsers.find(u => u.id === task.userId);
        const vip = user?.vipLevel || "Bronze";
        commissionByVIP[vip] = (commissionByVIP[vip] || 0) + (task.commission || 0);
      }
      setCommissionData(Object.entries(commissionByVIP).map(([vip, amount]) => ({ vip, amount })));

      // Task status distribution
      const statusCounts = {
        pending: tasks.filter(t => t.status === "pending").length,
        completed: tasks.filter(t => t.status === "completed").length,
        approved: tasks.filter(t => t.status === "approved").length,
        rejected: tasks.filter(t => t.status === "rejected").length
      };
      setTaskStatusData(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));

    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDateRange("7days")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === "7days" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setDateRange("30days")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === "30days" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalUsers} total</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedTasks}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalTasks} total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalCommissions.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">in period</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgCompletionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">avg success</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" name="Total Tasks" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commission Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission by VIP Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vip" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8b5cf6" name="Commission ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Commissions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Commission Payouts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="commission" fill="#f59e0b" name="Commission ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}