import { useState, useEffect } from 'react';
import { Crown, RefreshCw, Edit, Save, X, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';

export default function VIPLevelManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newVIPLevel, setNewVIPLevel] = useState('');
  const [boostDuration, setBoostDuration] = useState(7);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const vipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await backendClient.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await backendClient.entities.AppUser.list('-created_date', 200);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVIPLevel = async (userId, targetLevel) => {
    try {
      await backendClient.entities.AppUser.update(userId, {
        vipLevel: targetLevel
      });

      await backendClient.entities.Notification.create({
        userId: userId,
        type: 'vip_upgrade',
        title: 'VIP Level Updated! 🎉',
        message: `Your VIP level has been updated to ${targetLevel} by an administrator.`,
        priority: 'high',
        read: false
      });

      toast.success(`VIP level updated to ${targetLevel}!`);
      setEditingUser(null);
      setNewVIPLevel('');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update VIP level');
    }
  };

  const handleGrantBoost = async () => {
    if (!selectedUser || !newVIPLevel) {
      toast.error('Please select a VIP level');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + boostDuration);

      await backendClient.entities.VIPBoost.create({
        userId: selectedUser.id,
        originalLevel: selectedUser.vipLevel,
        boostedLevel: newVIPLevel,
        startDate: new Date().toISOString(),
        expiryDate: expiresAt.toISOString(),
        grantedBy: currentUser?.email || 'admin',
        reason: 'Admin granted temporary boost',
        status: 'active'
      });

      await backendClient.entities.AppUser.update(selectedUser.id, {
        vipLevel: newVIPLevel
      });

      await backendClient.entities.Notification.create({
        userId: selectedUser.id,
        type: 'vip_boost',
        title: 'Temporary VIP Boost! ⚡',
        message: `You've been granted ${newVIPLevel} level for ${boostDuration} days! Enjoy the enhanced benefits.`,
        priority: 'high',
        read: false
      });

      toast.success(`${boostDuration}-day ${newVIPLevel} boost granted!`);
      setShowBoostModal(false);
      setSelectedUser(null);
      setNewVIPLevel('');
      loadUsers();
    } catch (error) {
      toast.error('Failed to grant boost');
    }
  };

  const handleBulkUpgrade = async (fromLevel, toLevel) => {
    const eligibleUsers = users.filter(u => u.vipLevel === fromLevel);
    
    if (eligibleUsers.length === 0) {
      toast.error(`No ${fromLevel} users found`);
      return;
    }

    if (!confirm(`Upgrade ${eligibleUsers.length} ${fromLevel} users to ${toLevel}?`)) return;

    try {
      for (const user of eligibleUsers) {
        await backendClient.entities.AppUser.update(user.id, {
          vipLevel: toLevel
        });

        await backendClient.entities.Notification.create({
          userId: user.id,
          type: 'vip_upgrade',
          title: 'VIP Level Upgraded! 🎉',
          message: `Congratulations! You've been upgraded to ${toLevel} level.`,
          priority: 'high',
          read: false
        });
      }

      toast.success(`${eligibleUsers.length} users upgraded to ${toLevel}!`);
      loadUsers();
    } catch (error) {
      toast.error('Bulk upgrade failed');
    }
  };

  const filteredUsers = users.filter(user =>
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.created_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.vipLevel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vipStats = vipLevels.map(level => ({
    level,
    count: users.filter(u => u.vipLevel === level).length
  }));

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">VIP Level Management</h2>
          <p className="text-gray-600 mt-1">Manually adjust VIP levels and grant temporary boosts</p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {vipStats.map(({ level, count }) => (
          <div key={level} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{level}</div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 mt-1">{((count / users.length) * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-3">Bulk Upgrade Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleBulkUpgrade('Bronze', 'Silver')}
            className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded text-sm font-medium"
          >
            Bronze → Silver
          </button>
          <button
            type="button"
            onClick={() => handleBulkUpgrade('Silver', 'Gold')}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded text-sm font-medium"
          >
            Silver → Gold
          </button>
          <button
            type="button"
            onClick={() => handleBulkUpgrade('Gold', 'Platinum')}
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium"
          >
            Gold → Platinum
          </button>
          <button
            type="button"
            onClick={() => handleBulkUpgrade('Platinum', 'Diamond')}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium"
          >
            Platinum → Diamond
          </button>
        </div>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current VIP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.created_by}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <select
                        value={newVIPLevel}
                        onChange={(e) => setNewVIPLevel(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select level</option>
                        {vipLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.vipLevel === 'Diamond' ? 'bg-cyan-100 text-cyan-800' :
                        user.vipLevel === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                        user.vipLevel === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                        user.vipLevel === 'Silver' ? 'bg-gray-200 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        <Crown className="w-3 h-3 mr-1" />
                        {user.vipLevel || 'Bronze'}
                      </span>
                    )}
                    {user.vipBoostExpiry && new Date(user.vipBoostExpiry) > new Date() && (
                      <div className="text-xs text-purple-600 mt-1">
                        ⚡ Boosted until {new Date(user.vipBoostExpiry).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      ${(user.balance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{user.tasksCompleted || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateVIPLevel(user.id, newVIPLevel)}
                            disabled={!newVIPLevel}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(null);
                              setNewVIPLevel('');
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user.id);
                              setNewVIPLevel(user.vipLevel || 'Bronze');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit VIP Level"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewVIPLevel('');
                              setShowBoostModal(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Grant Temporary Boost"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBoostModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-600" />
              Grant Temporary VIP Boost
            </h3>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">User: {selectedUser.phone}</div>
              <div className="text-sm text-gray-600 mb-4">
                Current Level: <span className="font-semibold">{selectedUser.vipLevel}</span>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Boost to Level:</label>
              <select
                value={newVIPLevel}
                onChange={(e) => setNewVIPLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select VIP level</option>
                {vipLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days):</label>
              <input
                type="number"
                value={boostDuration}
                onChange={(e) => setBoostDuration(parseInt(e.target.value))}
                min="1"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                After {boostDuration} days, user will return to {selectedUser.vipLevel}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBoostModal(false);
                  setSelectedUser(null);
                  setNewVIPLevel('');
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantBoost}
                disabled={!newVIPLevel}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                Grant Boost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}