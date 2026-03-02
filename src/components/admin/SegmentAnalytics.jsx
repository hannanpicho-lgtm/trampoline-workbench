import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, CheckCircle, Bell, Eye, BarChart3 } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SegmentAnalytics() {
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSegment) {
      loadSegmentAnalytics();
    }
  }, [selectedSegment]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [segmentsData, usersData, notificationsData] = await Promise.all([
        backendClient.entities.UserSegment.filter({ isActive: true }),
        backendClient.entities.AppUser.list('-created_date', 1000),
        backendClient.entities.Notification.list('-created_date', 500)
      ]);
      setSegments(segmentsData);
      setUsers(usersData);
      setNotifications(notificationsData);
      if (segmentsData.length > 0 && !selectedSegment) {
        setSelectedSegment(segmentsData[0]);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSegmentAnalytics = async () => {
    try {
      const analyticsData = await backendClient.entities.SegmentAnalytics.filter(
        { segmentId: selectedSegment.id },
        '-date',
        30
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const getSegmentUsers = (segment) => {
    const criteria = segment.criteria;
    return users.filter(user => {
      if (criteria.vipLevels?.length > 0 && !criteria.vipLevels.includes(user.vipLevel)) return false;
      if (criteria.minBalance != null && (user.balance || 0) < criteria.minBalance) return false;
      if (criteria.maxBalance != null && (user.balance || 0) > criteria.maxBalance) return false;
      if (criteria.minTasks != null && (user.tasksCompleted || 0) < criteria.minTasks) return false;
      if (criteria.maxTasks != null && (user.tasksCompleted || 0) > criteria.maxTasks) return false;
      if (criteria.registeredAfter && new Date(user.created_date) < new Date(criteria.registeredAfter)) return false;
      if (criteria.registeredBefore && new Date(user.created_date) > new Date(criteria.registeredBefore)) return false;
      if (criteria.accountStatus === 'active' && user.isDeactivated) return false;
      if (criteria.accountStatus === 'deactivated' && !user.isDeactivated) return false;
      if (criteria.accountStatus === 'frozen' && !user.isFrozen) return false;

      if (criteria.activityLevel) {
        const daysSinceLogin = user.lastLogin 
          ? (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        if (criteria.activityLevel === 'active' && daysSinceLogin > 7) return false;
        if (criteria.activityLevel === 'inactive' && (daysSinceLogin <= 7 || daysSinceLogin > 30)) return false;
        if (criteria.activityLevel === 'dormant' && daysSinceLogin <= 30) return false;
      }

      return true;
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
        <p>No segments available</p>
        <p className="text-sm mt-1">Create segments first to view analytics</p>
      </div>
    );
  }

  const segmentUsers = selectedSegment ? getSegmentUsers(selectedSegment) : [];
  const segmentNotifications = selectedSegment 
    ? notifications.filter(n => segmentUsers.some(u => u.id === n.userId))
    : [];

  const totalBalance = segmentUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const avgBalance = segmentUsers.length > 0 ? totalBalance / segmentUsers.length : 0;
  const totalTasks = segmentUsers.reduce((sum, u) => sum + (u.tasksCompleted || 0), 0);
  const avgTasks = segmentUsers.length > 0 ? totalTasks / segmentUsers.length : 0;
  const activeUsers = segmentUsers.filter(u => {
    if (!u.lastLogin) return false;
    const days = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;
  const readNotifications = segmentNotifications.filter(n => n.read).length;
  const engagementRate = segmentNotifications.length > 0 
    ? (readNotifications / segmentNotifications.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Segment Analytics</h2>
        <p className="text-gray-600 mt-1">Performance metrics and engagement data</p>
      </div>

      {/* Segment Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Segment</label>
        <select
          value={selectedSegment?.id || ''}
          onChange={(e) => {
            const segment = segments.find(s => s.id === e.target.value);
            setSelectedSegment(segment);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
        >
          {segments.map(segment => (
            <option key={segment.id} value={segment.id}>
              {segment.name} ({segment.userCount || 0} users)
            </option>
          ))}
        </select>
      </div>

      {selectedSegment && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Users</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{segmentUsers.length}</div>
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {activeUsers} active (last 7 days)
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Avg Balance</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">${avgBalance.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Total: ${totalBalance.toFixed(2)}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Avg Tasks</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{avgTasks.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Total: {totalTasks}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Engagement</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{engagementRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {readNotifications}/{segmentNotifications.length} read
              </div>
            </div>
          </div>

          {/* VIP Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">VIP Level Distribution</h3>
            <div className="grid grid-cols-5 gap-4">
              {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(level => {
                const count = segmentUsers.filter(u => u.vipLevel === level).length;
                const percentage = segmentUsers.length > 0 ? (count / segmentUsers.length) * 100 : 0;
                return (
                  <div key={level} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{level}</div>
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend Chart */}
          {analytics.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Segment Trends (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="userCount" stroke="#3b82f6" name="Users" />
                  <Line type="monotone" dataKey="activeUsers" stroke="#10b981" name="Active" />
                  <Line type="monotone" dataKey="avgBalance" stroke="#f59e0b" name="Avg Balance" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* User List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Users in Segment</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {segmentUsers.slice(0, 20).map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{user.phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{user.created_by}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {user.vipLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${(user.balance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.tasksCompleted || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {segmentUsers.length > 20 && (
                <div className="text-center py-3 text-sm text-gray-500">
                  Showing 20 of {segmentUsers.length} users
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}