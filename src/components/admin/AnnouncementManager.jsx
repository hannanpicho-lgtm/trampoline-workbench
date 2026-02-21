import { useState, useEffect } from 'react';
import { Plus, Send, Eye, Edit2, Trash2, Users, Bell, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetVIPLevels: [],
    targetUserIds: [],
    minTasksCompleted: null,
    maxTasksCompleted: null,
    priority: 'medium',
    sendNotification: true,
    expiresAt: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [announcementsData, usersData] = await Promise.all([
        base44.entities.Announcement.list('-created_date', 100),
        base44.entities.AppUser.list('-created_date', 500)
      ]);
      setAnnouncements(announcementsData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    try {
      const user = await base44.auth.me();
      const data = {
        ...formData,
        createdBy: user.email,
        status: 'draft'
      };

      if (editingAnnouncement) {
        await base44.entities.Announcement.update(editingAnnouncement.id, data);
        toast.success('Announcement updated');
      } else {
        await base44.entities.Announcement.create(data);
        toast.success('Announcement created');
      }

      loadData();
      resetForm();
    } catch (error) {
      toast.error('Failed to save announcement');
    }
  };

  const handlePublish = async (announcement) => {
    try {
      // Update announcement status
      await base44.entities.Announcement.update(announcement.id, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      // Get target users
      const targetUsers = await getTargetUsers(announcement);

      // Create user announcements
      const userAnnouncements = targetUsers.map(user => ({
        userId: user.id,
        announcementId: announcement.id
      }));

      await base44.entities.UserAnnouncement.bulkCreate(userAnnouncements);

      // Send notifications if enabled
      if (announcement.sendNotification) {
        const notifications = targetUsers.map(user => ({
          userId: user.id,
          type: 'system',
          title: announcement.title,
          message: announcement.message,
          priority: announcement.priority,
          relatedId: announcement.id,
          relatedType: 'announcement'
        }));
        await base44.entities.Notification.bulkCreate(notifications);
      }

      toast.success(`Published to ${targetUsers.length} users`);
      loadData();
    } catch (error) {
      toast.error('Failed to publish announcement');
    }
  };

  const getTargetUsers = async (announcement) => {
    let filtered = users;

    switch (announcement.targetType) {
      case 'vip_level':
        filtered = users.filter(u => 
          announcement.targetVIPLevels.includes(u.vipLevel)
        );
        break;
      case 'active_users':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = users.filter(u => 
          new Date(u.lastLogin || u.created_date) >= weekAgo
        );
        break;
      case 'inactive_users':
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        filtered = users.filter(u => 
          new Date(u.lastLogin || u.created_date) < twoWeeksAgo
        );
        break;
      case 'custom':
        if (announcement.targetUserIds?.length > 0) {
          filtered = users.filter(u => announcement.targetUserIds.includes(u.id));
        }
        if (announcement.minTasksCompleted != null) {
          filtered = filtered.filter(u => (u.tasksCompleted || 0) >= announcement.minTasksCompleted);
        }
        if (announcement.maxTasksCompleted != null) {
          filtered = filtered.filter(u => (u.tasksCompleted || 0) <= announcement.maxTasksCompleted);
        }
        break;
    }

    return filtered;
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await base44.entities.Announcement.delete(id);
      toast.success('Announcement deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetType: announcement.targetType,
      targetVIPLevels: announcement.targetVIPLevels || [],
      targetUserIds: announcement.targetUserIds || [],
      minTasksCompleted: announcement.minTasksCompleted,
      maxTasksCompleted: announcement.maxTasksCompleted,
      priority: announcement.priority,
      sendNotification: announcement.sendNotification,
      expiresAt: announcement.expiresAt || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetType: 'all',
      targetVIPLevels: [],
      targetUserIds: [],
      minTasksCompleted: null,
      maxTasksCompleted: null,
      priority: 'medium',
      sendNotification: true,
      expiresAt: ''
    });
  };

  const typeColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    urgent: 'bg-red-100 text-red-800 border-red-300'
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcement Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Send targeted messages to users</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 resize-none"
                  placeholder="Announcement message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="urgent">Urgent</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Users</option>
                  <option value="vip_level">By VIP Level</option>
                  <option value="active_users">Active Users (Last 7 days)</option>
                  <option value="inactive_users">Inactive Users (14+ days)</option>
                  <option value="custom">Custom Targeting</option>
                </select>
              </div>

              {formData.targetType === 'vip_level' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VIP Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(level => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetVIPLevels.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                targetVIPLevels: [...formData.targetVIPLevels, level]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                targetVIPLevels: formData.targetVIPLevels.filter(l => l !== level)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.targetType === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Tasks</label>
                    <input
                      type="number"
                      value={formData.minTasksCompleted || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        minTasksCompleted: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Minimum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tasks</label>
                    <input
                      type="number"
                      value={formData.maxTasksCompleted || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        maxTasksCompleted: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Maximum"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendNotification}
                  onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Send push notification to users</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingAnnouncement ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(announcement => (
          <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[announcement.type]}`}>
                    {announcement.type}
                  </span>
                  {announcement.status === 'published' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Published
                    </span>
                  )}
                  {announcement.status === 'draft' && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {announcement.targetType.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {announcement.viewCount || 0} views
                  </span>
                  {announcement.sendNotification && (
                    <span className="flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      Notifications enabled
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {announcement.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handlePublish(announcement)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Publish"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleEdit(announcement)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No announcements yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}