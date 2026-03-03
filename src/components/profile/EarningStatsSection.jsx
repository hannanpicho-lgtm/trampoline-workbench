import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EarningStatsSection({ appUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadTaskData();
  }, [appUser?.id]);

  const loadTaskData = async () => {
    setLoading(true);
    try {
      const userTasks = await backendClient.entities.UserTask.filter(
        { userId: appUser.id },
        '-created_date',
        100
      );
      setTasks(userTasks);

      // Process data for chart
      const earningsByDate = {};
      userTasks.forEach(task => {
        const date = new Date(task.created_date).toLocaleDateString();
        earningsByDate[date] = (earningsByDate[date] || 0) + (task.commission || 0);
      });

      const sortedData = Object.entries(earningsByDate)
        .map(([date, commission]) => ({ date, commission }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 days

      setChartData(sortedData);
    } catch (error) {
      console.error('Failed to load task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'approved' || t.status === 'completed').length;
  const totalEarnings = tasks.reduce((sum, task) => sum + (task.commission || 0), 0);
  const averageEarning = completedTasks > 0 ? parseFloat((totalEarnings / completedTasks).toFixed(2)) : 0;

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Tasks Completed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Average Earning</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${averageEarning}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-600">VIP Level</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{appUser?.vipLevel || 'Bronze'}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Earnings Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="commission" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Task History */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Recent Task History</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No tasks completed yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.slice(0, 10).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {task.isPremiumOrder ? '⭐ Premium Order' : 'Task Completed'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(task.created_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${(task.commission || 0).toFixed(2)}</p>
                  <p className={`text-xs font-medium ${
                    task.status === 'approved' || task.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {task.status?.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}