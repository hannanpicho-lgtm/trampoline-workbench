import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, BarChart3, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ReferralSettingsManager() {
  const [settings, setSettings] = useState({
    referrerBonus: 20,
    referrerBonusType: 'percentage',
    refereeBonus: 5,
    refereeBonusType: 'fixed',
    minTasksForBonus: 1,
    bonusExpiryDays: 30,
    enableReferralProgram: true,
    maxRefereesPerUser: null
  });

  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalBonusesAwarded: 0,
    averageConversion: 0,
    topReferrers: []
  });

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    setStatsLoading(true);
    try {
      const [earnings, users] = await Promise.all([
        base44.entities.ReferralEarning.list('-created_date', 1000),
        base44.entities.AppUser.list()
      ]);

      const totalReferrals = users.filter(u => u.referredBy).length;
      const totalBonuses = earnings.reduce((sum, e) => sum + (e.referralCommission || 0), 0);
      
      // Top referrers
      const referrerMap = {};
      earnings.forEach(earning => {
        referrerMap[earning.referrerId] = (referrerMap[earning.referrerId] || 0) + earning.referralCommission;
      });

      const topReferrers = Object.entries(referrerMap)
        .map(([id, total]) => {
          const user = users.find(u => u.id === id);
          return { id, user, total };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setReferralStats({
        totalReferrals,
        totalBonusesAwarded: totalBonuses,
        averageConversion: totalReferrals > 0 ? parseFloat(((totalReferrals / users.length) * 100).toFixed(1)) : 0,
        topReferrers
      });
    } catch (error) {
      toast.error('Failed to load referral stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.entities.AppSettings.update('referral_settings', {
        value: settings
      });
      toast.success('Referral settings updated');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Referral Program Settings
        </h2>
        <button
          type="button"
          onClick={loadReferralStats}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards */}
      {!statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats.averageConversion}%</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Bonuses Paid</p>
            <p className="text-2xl font-bold text-gray-900">${referralStats.totalBonusesAwarded.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Top Referrers</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats.topReferrers.length}</p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bonus Configuration</h3>
        </div>

        {/* Enable/Disable */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableReferralProgram}
              onChange={(e) => handleChange('enableReferralProgram', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-gray-900 font-medium">Enable Referral Program</span>
          </label>
        </div>

        {/* Referrer Bonus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Referrer Bonus Amount</label>
            <input
              type="number"
              value={settings.referrerBonus}
              onChange={(e) => handleChange('referrerBonus', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Referrer Bonus Type</label>
            <select
              value={settings.referrerBonusType}
              onChange={(e) => handleChange('referrerBonusType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
        </div>

        {/* Referee Bonus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Referee Welcome Bonus</label>
            <input
              type="number"
              value={settings.refereeBonus}
              onChange={(e) => handleChange('refereeBonus', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Referee Bonus Type</label>
            <select
              value={settings.refereeBonusType}
              onChange={(e) => handleChange('refereeBonusType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="fixed">Fixed Amount ($)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Min Tasks for Bonus</label>
            <input
              type="number"
              value={settings.minTasksForBonus}
              onChange={(e) => handleChange('minTasksForBonus', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Tasks referee must complete to trigger bonus</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Bonus Expiry (Days)</label>
            <input
              type="number"
              value={settings.bonusExpiryDays}
              onChange={(e) => handleChange('bonusExpiryDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Days before bonus expires</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Max Referees Per User</label>
          <input
            type="number"
            value={settings.maxRefereesPerUser || ''}
            onChange={(e) => handleChange('maxRefereesPerUser', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty for unlimited"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">Optional limit on number of referees per user</p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      {/* Top Referrers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Top Referrers
        </h3>
        
        {referralStats.topReferrers.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No referrals yet</p>
        ) : (
          <div className="space-y-2">
            {referralStats.topReferrers.map((referrer, idx) => (
              <div key={referrer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{referrer.user?.phone || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">{referrer.user?.created_by}</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">${referrer.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}