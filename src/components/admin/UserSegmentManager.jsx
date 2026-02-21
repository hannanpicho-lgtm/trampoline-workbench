import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, RefreshCw, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserSegmentManager() {
  const [segments, setSegments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      vipLevels: [],
      minBalance: null,
      maxBalance: null,
      minTasks: null,
      maxTasks: null,
      registeredAfter: '',
      registeredBefore: '',
      lastActiveAfter: '',
      activityLevel: '',
      minCreditScore: null,
      hasReferrals: null,
      accountStatus: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [segmentsData, usersData] = await Promise.all([
        base44.entities.UserSegment.list('-created_date'),
        base44.entities.AppUser.list('-created_date', 1000)
      ]);
      setSegments(segmentsData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSegmentUsers = (criteria) => {
    return users.filter(user => {
      // VIP Level
      if (criteria.vipLevels?.length > 0 && !criteria.vipLevels.includes(user.vipLevel)) {
        return false;
      }

      // Balance range
      if (criteria.minBalance != null && (user.balance || 0) < criteria.minBalance) return false;
      if (criteria.maxBalance != null && (user.balance || 0) > criteria.maxBalance) return false;

      // Task range
      if (criteria.minTasks != null && (user.tasksCompleted || 0) < criteria.minTasks) return false;
      if (criteria.maxTasks != null && (user.tasksCompleted || 0) > criteria.maxTasks) return false;

      // Registration date
      if (criteria.registeredAfter && new Date(user.created_date) < new Date(criteria.registeredAfter)) return false;
      if (criteria.registeredBefore && new Date(user.created_date) > new Date(criteria.registeredBefore)) return false;

      // Activity level
      if (criteria.activityLevel) {
        const daysSinceLogin = user.lastLogin 
          ? (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        
        if (criteria.activityLevel === 'active' && daysSinceLogin > 7) return false;
        if (criteria.activityLevel === 'inactive' && (daysSinceLogin <= 7 || daysSinceLogin > 30)) return false;
        if (criteria.activityLevel === 'dormant' && daysSinceLogin <= 30) return false;
      }

      // Last active after
      if (criteria.lastActiveAfter && user.lastLogin) {
        if (new Date(user.lastLogin) < new Date(criteria.lastActiveAfter)) return false;
      }

      // Credit score
      if (criteria.minCreditScore != null && (user.creditScore || 100) < criteria.minCreditScore) return false;

      // Has referrals
      if (criteria.hasReferrals != null) {
        if (criteria.hasReferrals && (user.inviteCount || 0) === 0) return false;
        if (!criteria.hasReferrals && (user.inviteCount || 0) > 0) return false;
      }

      // Account status
      if (criteria.accountStatus === 'active' && user.isDeactivated) return false;
      if (criteria.accountStatus === 'deactivated' && !user.isDeactivated) return false;
      if (criteria.accountStatus === 'frozen' && !user.isFrozen) return false;

      return true;
    });
  };

  const handleSaveSegment = async () => {
    if (!formData.name) {
      toast.error('Segment name is required');
      return;
    }

    const matchingUsers = calculateSegmentUsers(formData.criteria);

    try {
      const segmentData = {
        ...formData,
        userCount: matchingUsers.length,
        lastCalculated: new Date().toISOString()
      };

      if (editingSegment) {
        await base44.entities.UserSegment.update(editingSegment.id, segmentData);
        toast.success('Segment updated successfully');
      } else {
        await base44.entities.UserSegment.create(segmentData);
        toast.success(`Segment created with ${matchingUsers.length} users`);
      }

      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save segment');
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!confirm('Delete this segment?')) return;

    try {
      await base44.entities.UserSegment.delete(segmentId);
      toast.success('Segment deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete segment');
    }
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: segment.criteria
    });
    setShowForm(true);
  };

  const handleRecalculate = async (segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    const matchingUsers = calculateSegmentUsers(segment.criteria);

    try {
      await base44.entities.UserSegment.update(segmentId, {
        userCount: matchingUsers.length,
        lastCalculated: new Date().toISOString()
      });
      toast.success(`Recalculated: ${matchingUsers.length} users`);
      loadData();
    } catch (error) {
      toast.error('Failed to recalculate');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {
        vipLevels: [],
        minBalance: null,
        maxBalance: null,
        minTasks: null,
        maxTasks: null,
        registeredAfter: '',
        registeredBefore: '',
        lastActiveAfter: '',
        activityLevel: '',
        minCreditScore: null,
        hasReferrals: null,
        accountStatus: ''
      }
    });
    setEditingSegment(null);
    setShowForm(false);
  };

  const toggleVIPLevel = (level) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        vipLevels: prev.criteria.vipLevels.includes(level)
          ? prev.criteria.vipLevels.filter(l => l !== level)
          : [...prev.criteria.vipLevels, level]
      }
    }));
  };

  const currentMatchCount = calculateSegmentUsers(formData.criteria).length;

  if (loading) {
    return <div className="text-center py-12">Loading segments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Segmentation</h2>
          <p className="text-gray-600 mt-1">Create and manage user segments for targeted campaigns</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {segments.map(segment => {
          const matchingUsers = calculateSegmentUsers(segment.criteria);
          return (
            <div key={segment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{segment.name}</h3>
                  {segment.description && (
                    <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleRecalculate(segment.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Recalculate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditSegment(segment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSegment(segment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{matchingUsers.length}</span>
                <span className="text-sm text-gray-500">users</span>
              </div>

              {/* Criteria Summary */}
              <div className="space-y-1 text-xs">
                {segment.criteria.vipLevels?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {segment.criteria.vipLevels.map(level => (
                      <span key={level} className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {level}
                      </span>
                    ))}
                  </div>
                )}
                {(segment.criteria.minBalance != null || segment.criteria.maxBalance != null) && (
                  <div className="text-gray-600">
                    Balance: ${segment.criteria.minBalance || 0} - ${segment.criteria.maxBalance || '∞'}
                  </div>
                )}
                {(segment.criteria.minTasks != null || segment.criteria.maxTasks != null) && (
                  <div className="text-gray-600">
                    Tasks: {segment.criteria.minTasks || 0} - {segment.criteria.maxTasks || '∞'}
                  </div>
                )}
                {segment.criteria.activityLevel && (
                  <div className="text-gray-600">Activity: {segment.criteria.activityLevel}</div>
                )}
              </div>

              {segment.lastCalculated && (
                <div className="text-xs text-gray-400 mt-3">
                  Updated: {new Date(segment.lastCalculated).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {segments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No segments created yet</p>
          <p className="text-sm mt-1">Create your first segment to target specific user groups</p>
        </div>
      )}

      {/* Create/Edit Segment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingSegment ? 'Edit Segment' : 'Create Segment'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., High-Value Users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 resize-none"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Segmentation Criteria</h4>

                {/* VIP Levels */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">VIP Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => toggleVIPLevel(level)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          formData.criteria.vipLevels.includes(level)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance Range */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Balance ($)</label>
                    <input
                      type="number"
                      value={formData.criteria.minBalance || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, minBalance: e.target.value ? parseFloat(e.target.value) : null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Balance ($)</label>
                    <input
                      type="number"
                      value={formData.criteria.maxBalance || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, maxBalance: e.target.value ? parseFloat(e.target.value) : null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Task Range */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Tasks</label>
                    <input
                      type="number"
                      value={formData.criteria.minTasks || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, minTasks: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tasks</label>
                    <input
                      type="number"
                      value={formData.criteria.maxTasks || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, maxTasks: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  <select
                    value={formData.criteria.activityLevel || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteria: { ...formData.criteria, activityLevel: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Any</option>
                    <option value="active">Active (last 7 days)</option>
                    <option value="inactive">Inactive (7-30 days)</option>
                    <option value="dormant">Dormant (30+ days)</option>
                  </select>
                </div>

                {/* Registration Date Range */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registered After</label>
                    <input
                      type="date"
                      value={formData.criteria.registeredAfter || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, registeredAfter: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registered Before</label>
                    <input
                      type="date"
                      value={formData.criteria.registeredBefore || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, registeredBefore: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Credit Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.criteria.minCreditScore || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, minCreditScore: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                    <select
                      value={formData.criteria.accountStatus || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        criteria: { ...formData.criteria, accountStatus: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Any</option>
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivated</option>
                      <option value="frozen">Frozen</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Current Match: {currentMatchCount} users
                  </div>
                  <div className="text-xs text-blue-700">
                    {((currentMatchCount / users.length) * 100).toFixed(1)}% of total users
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSegment}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {editingSegment ? 'Update Segment' : 'Create Segment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}