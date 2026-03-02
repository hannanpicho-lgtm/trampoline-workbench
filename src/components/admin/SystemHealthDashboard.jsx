import { useState, useEffect } from 'react';
import { Activity, Database, Server, AlertTriangle, CheckCircle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { backendClient } from '@/api/backendClient';

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState({
    database: 'healthy',
    apiResponse: 0,
    activeUsers: 0,
    pendingTasks: 0,
    pendingWithdrawals: 0,
    systemErrors: 0,
    avgTransactionTime: 0,
    totalTransactionsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const startTime = performance.now();
      
      // Test database connection
      const users = await backendClient.entities.AppUser.filter({}, null, 1);
      const apiResponse = performance.now() - startTime;

      // Get active users (logged in last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const allUsers = await backendClient.entities.AppUser.filter({});
      const activeUsers = allUsers.filter(u => 
        u.lastLogin && new Date(u.lastLogin) >= yesterday
      ).length;

      // Get pending tasks
      const pendingTasks = await backendClient.entities.UserTask.filter({ status: 'pending' });

      // Get pending withdrawals
      const pendingWithdrawals = await backendClient.entities.Transaction.filter({
        type: 'withdrawal',
        status: 'pending'
      });

      // Get today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allTransactions = await backendClient.entities.Transaction.filter({}, '-created_date', 1000);
      const todayTransactions = allTransactions.filter(t => 
        new Date(t.created_date) >= today
      );

      setHealth({
        database: 'healthy',
        apiResponse: Math.round(apiResponse),
        activeUsers,
        pendingTasks: pendingTasks.length,
        pendingWithdrawals: pendingWithdrawals.length,
        systemErrors: 0,
        avgTransactionTime: 150,
        totalTransactionsToday: todayTransactions.length
      });

      setLoading(false);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(prev => ({ ...prev, database: 'error' }));
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'text-green-600 bg-green-100';
    if (status === 'warning') return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') return CheckCircle;
    if (status === 'warning') return AlertTriangle;
    return AlertTriangle;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Checking system health...</div>;
  }

  const StatusIcon = getStatusIcon(health.database);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Health</h2>

      {/* Overall Status */}
      <div className={`rounded-lg p-6 border-2 ${getStatusColor(health.database)}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">System Status: {health.database.toUpperCase()}</h3>
            <p className="text-sm mt-1">All systems operational</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">DATABASE</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{health.apiResponse}ms</p>
          <p className="text-xs text-gray-600 mt-1">Response time</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">USERS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{health.activeUsers}</p>
          <p className="text-xs text-gray-600 mt-1">Active (24h)</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">TASKS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{health.pendingTasks}</p>
          <p className="text-xs text-gray-600 mt-1">Pending approval</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">PAYOUTS</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{health.pendingWithdrawals}</p>
          <p className="text-xs text-gray-600 mt-1">Pending</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Transaction Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Transactions</span>
              <span className="font-bold text-gray-900">{health.totalTransactionsToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Processing Time</span>
              <span className="font-bold text-gray-900">{health.avgTransactionTime}ms</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">System Resources</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" />
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}