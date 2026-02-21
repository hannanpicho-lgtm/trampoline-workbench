import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, DollarSign, Activity, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrainingAccountAnalytics({ appUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [chartData, setChartData] = useState([]);
  const [accountPerformance, setAccountPerformance] = useState([]);

  useEffect(() => {
    if (appUser?.id) {
      loadAnalytics();
    }
  }, [appUser?.id, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get all training accounts
      const trainingAccounts = await base44.entities.AppUser.filter({
        referredBy: appUser.id,
        isTrainingAccount: true
      });

      if (trainingAccounts.length === 0) {
        setAnalytics({
          totalAccounts: 0,
          activeAccounts: 0,
          totalEarnings: 0,
          totalProfitShare: 0,
          averageEarningsPerAccount: 0,
          averageProfitSharePerAccount: 0
        });
        setLoading(false);
        return;
      }

      // Get training logs
      const logs = await base44.entities.TrainingAccountLog.filter({
        referrerId: appUser.id
      });

      // Get transactions for profit shares
      const transactions = await base44.entities.Transaction.filter({
        userId: appUser.id,
        type: 'training_profit_share'
      });

      // Calculate analytics
      const totalEarnings = logs.reduce((sum, log) => sum + (log.totalEarnings || 0), 0);
      const totalProfitShare = logs.reduce((sum, log) => sum + (log.totalSharedProfit || 0), 0);
      const activeAccounts = logs.filter(log => log.status === 'active').length;

      setAnalytics({
        totalAccounts: trainingAccounts.length,
        activeAccounts: activeAccounts,
        totalEarnings: totalEarnings,
        totalProfitShare: totalProfitShare,
        averageEarningsPerAccount: trainingAccounts.length > 0 ? totalEarnings / trainingAccounts.length : 0,
        averageProfitSharePerAccount: trainingAccounts.length > 0 ? totalProfitShare / trainingAccounts.length : 0
      });

      // Generate chart data from transactions
      if (transactions.length > 0) {
        const dateMap = {};
        transactions.forEach(tx => {
          const date = new Date(tx.created_date).toLocaleDateString();
          dateMap[date] = (dateMap[date] || 0) + tx.amount;
        });

        const sortedData = Object.entries(dateMap)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-15); // Last 15 days

        setChartData(sortedData);
      }

      // Account performance
      const performance = logs
        .map(log => ({
          name: log.accountName || 'Unnamed',
          earnings: log.totalEarnings || 0,
          profitShare: log.totalSharedProfit || 0,
          status: log.status
        }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10);

      setAccountPerformance(performance);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Loading analytics...</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Training Account Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">Total Accounts</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics?.totalAccounts || 0}</p>
          <p className="text-xs text-blue-600 mt-1">{analytics?.activeAccounts || 0} active</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold text-green-900">${(analytics?.totalEarnings || 0).toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-purple-700 font-medium">Your Profit (20%)</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">${(analytics?.totalProfitShare || 0).toFixed(2)}</p>
          <p className="text-xs text-purple-600 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">Avg/Account</span>
          </div>
          <p className="text-3xl font-bold text-orange-900">${(analytics?.averageProfitSharePerAccount || 0).toFixed(2)}</p>
          <p className="text-xs text-orange-600 mt-1">20% share</p>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Profit Share Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
                name="Profit Share"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Account Performance */}
      {accountPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Top Training Accounts</h4>
          <div className="space-y-3">
            {accountPerformance.map((account, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-sm text-gray-600">
                    Earnings: ${account.earnings.toFixed(2)} | Your profit: ${account.profitShare.toFixed(2)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  account.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {account.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics?.totalAccounts === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No training account data yet. Create your first training account to see analytics!</p>
        </div>
      )}
    </div>
  );
}
