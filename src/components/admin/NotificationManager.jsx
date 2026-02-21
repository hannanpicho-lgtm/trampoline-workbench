import { useState, useEffect } from 'react';
import { Bell, Send, Users, Crown, Filter, Eye, Trash2, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterVIP, setFilterVIP] = useState('all');
  const [formData, setFormData] = useState({
    type: 'system',
    title: '',
    message: '',
    priority: 'medium',
    targetType: 'all',
    targetVIPLevels: [],
    targetUserIds: [],
    targetSegmentId: '',
    minBalance: 0,
    maxBalance: 999999,
    minTasks: 0,
    maxTasks: 999999
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notificationsData, usersData, segmentsData] = await Promise.all([
        base44.entities.Notification.list('-created_date', 200),
        base44.entities.AppUser.list('-created_date', 500),
        base44.entities.UserSegment.filter({ isActive: true })
      ]);
      setNotifications(notificationsData);
      setUsers(usersData);
      setSegments(segmentsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Segment-based targeting
    if (formData.targetType === 'segment' && formData.targetSegmentId) {
      const segment = segments.find(s => s.id === formData.targetSegmentId);
      if (segment) {
        const criteria = segment.criteria;
        filtered = filtered.filter(user => {
          if (criteria.vipLevels?.length > 0 && !criteria.vipLevels.includes(user.vipLevel)) return false;
          if (criteria.minBalance != null && (user.balance || 0) < criteria.minBalance) return false;
          if (criteria.maxBalance != null && (user.balance || 0) > criteria.maxBalance) return false;
          if (criteria.minTasks != null && (user.tasksCompleted || 0) < criteria.minTasks) return false;
          if (criteria.maxTasks != null && (user.tasksCompleted || 0) > criteria.maxTasks) return false;
          if (criteria.accountStatus === 'active' && user.isDeactivated) return false;
          if (criteria.accountStatus === 'deactivated' && !user.isDeactivated) return false;
          return true;
        });
      }
    }

    if (formData.targetType === 'vip_level' && formData.targetVIPLevels.length > 0) {
      filtered = filtered.filter(u => formData.targetVIPLevels.includes(u.vipLevel));
    }

    if (formData.targetType === 'balance_range') {
      filtered = filtered.filter(u => 
        (u.balance || 0) >= formData.minBalance && 
        (u.balance || 0) <= formData.maxBalance
      );
    }

    if (formData.targetType === 'task_range') {
      filtered = filtered.filter(u => 
        (u.tasksCompleted || 0) >= formData.minTasks && 
        (u.tasksCompleted || 0) <= formData.maxTasks
      );
    }

    if (formData.targetType === 'custom' && formData.targetUserIds.length > 0) {
      filtered = filtered.filter(u => formData.targetUserIds.includes(u.id));
    }

    return filtered;
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    const targetUsers = getFilteredUsers();
    
    if (targetUsers.length === 0) {
      toast.error('No users match the criteria');
      return;
    }

    if (!confirm(`Send notification to ${targetUsers.length} users?`)) return;

    setSending(true);
    try {
      const notificationPromises = targetUsers.map(user =>
        base44.entities.Notification.create({
          userId: user.id,
          type: formData.type,
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          read: false
        })
      );

      await Promise.all(notificationPromises);
      
      toast.success(`Notification sent to ${targetUsers.length} users!`);
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  const handleBulkDelete = async () => {
    const oldNotifications = notifications.filter(n => {
      const daysOld = (Date.now() - new Date(n.created_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 30;
    });

    if (oldNotifications.length === 0) {
      toast.info('No old notifications to delete');
      return;
    }

    if (!confirm(`Delete ${oldNotifications.length} notifications older than 30 days?`)) return;

    try {
      for (const notification of oldNotifications) {
        await base44.entities.Notification.delete(notification.id);
      }
      toast.success(`Deleted ${oldNotifications.length} notifications`);
      loadData();
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'system',
      title: '',
      message: '',
      priority: 'medium',
      targetType: 'all',
      targetVIPLevels: [],
      targetUserIds: [],
      targetSegmentId: '',
      minBalance: 0,
      maxBalance: 999999,
      minTasks: 0,
      maxTasks: 999999
    });
  };

  const vipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const targetUserCount = getFilteredUsers().length;

  // Stats
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const last24h = notifications.filter(n => 
    Date.now() - new Date(n.created_date).getTime() < 24 * 60 * 60 * 1000
  ).length;

  // Filter notifications by VIP level
  const displayNotifications = filterVIP === 'all' 
    ? notifications 
    : notifications.filter(n => {
        const user = users.find(u => u.id === n.userId);
        return user?.vipLevel === filterVIP;
      });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Manager</h2>
          <p className="text-gray-600 mt-1">Send targeted notifications to users</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Sent</div>
          <div className="text-3xl font-bold text-gray-900">{totalNotifications}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Unread</div>
          <div className="text-3xl font-bold text-blue-900">{unreadCount}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1">Last 24h</div>
          <div className="text-3xl font-bold text-green-900">{last24h}</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-sm p-4 border border-purple-200">
          <div className="text-sm text-purple-600 mb-1">Active Users</div>
          <div className="text-3xl font-bold text-purple-900">{users.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium"
          >
            Delete Old Notifications (30+ days)
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by VIP:</span>
        </div>
        <select
          value={filterVIP}
          onChange={(e) => setFilterVIP(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Levels</option>
          {vipLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          Showing {displayNotifications.length} notifications
        </span>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayNotifications.map((notification) => {
                const user = users.find(u => u.id === notification.userId);
                return (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.phone || user?.created_by || 'Unknown'}
                      </div>
                      {user?.vipLevel && (
                        <div className="text-xs text-gray-500">{user.vipLevel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{notification.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {notification.read ? (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Read
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Unread</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(notification.created_date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayNotifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No notifications found
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create Notification</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="system">System</option>
                    <option value="promotion">Promotion</option>
                    <option value="vip_upgrade">VIP Upgrade</option>
                    <option value="task_reminder">Task Reminder</option>
                    <option value="payout_status">Payout Status</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Notification message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Users</option>
                  <option value="segment">Custom Segment</option>
                  <option value="vip_level">By VIP Level</option>
                  <option value="balance_range">By Balance Range</option>
                  <option value="task_range">By Task Count</option>
                </select>
              </div>

              {formData.targetType === 'segment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Segment</label>
                  <select
                    value={formData.targetSegmentId}
                    onChange={(e) => setFormData({ ...formData, targetSegmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Select Segment --</option>
                    {segments.map(segment => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.userCount || 0} users)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.targetType === 'vip_level' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select VIP Levels</label>
                  <div className="space-y-2">
                    {vipLevels.map(level => (
                      <label key={level} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.targetVIPLevels.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, targetVIPLevels: [...formData.targetVIPLevels, level] });
                            } else {
                              setFormData({ ...formData, targetVIPLevels: formData.targetVIPLevels.filter(l => l !== level) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetType === 'balance_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Balance ($)</label>
                    <input
                      type="number"
                      value={formData.minBalance}
                      onChange={(e) => setFormData({ ...formData, minBalance: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Balance ($)</label>
                    <input
                      type="number"
                      value={formData.maxBalance}
                      onChange={(e) => setFormData({ ...formData, maxBalance: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {formData.targetType === 'task_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Tasks</label>
                    <input
                      type="number"
                      value={formData.minTasks}
                      onChange={(e) => setFormData({ ...formData, minTasks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tasks</label>
                    <input
                      type="number"
                      value={formData.maxTasks}
                      onChange={(e) => setFormData({ ...formData, maxTasks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    This will be sent to {targetUserCount} user{targetUserCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={sending || !formData.title || !formData.message}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}