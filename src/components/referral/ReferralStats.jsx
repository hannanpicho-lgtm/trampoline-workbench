import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReferralStats({ appUser }) {
  const [referralData, setReferralData] = useState({
    totalReferred: 0,
    activeReferred: 0,
    totalEarnings: 0,
    earnings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, [appUser?.id]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      // Get referral earnings
      const earnings = await base44.entities.ReferralEarning.filter(
        { referrerId: appUser.id },
        '-created_date',
        100
      );

      // Count referred users
      const referredUsers = await base44.entities.AppUser.filter(
        { referredBy: appUser.id }
      );

      // Calculate active referred users
      const activeReferred = referredUsers.filter(u => 
        u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      const totalEarnings = earnings.reduce((sum, e) => sum + (e.referralCommission || 0), 0);

      setReferralData({
        totalReferred: referredUsers.length,
        activeReferred,
        totalEarnings,
        earnings
      });
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading referral data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Total Referred</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{referralData.totalReferred}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Active (7 days)</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{referralData.activeReferred}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Referral Earnings</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${referralData.totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Referral Earnings List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Recent Referral Bonuses
        </h3>
        
        {referralData.earnings.length === 0 ? (
          <p className="text-gray-600 text-center py-6 bg-gray-50 rounded-lg">
            No referral earnings yet. Share your code to start earning!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {referralData.earnings.slice(0, 10).map(earning => (
              <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Referral Bonus</p>
                  <p className="text-sm text-gray-500">
                    {new Date(earning.created_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+${(earning.referralCommission || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-600">
                    {earning.status === 'paid' ? '✓ Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>How it works:</strong> When someone signs up using your referral link, you'll earn 20% of their task commissions. They also get a welcome bonus!
        </p>
      </div>
    </div>
  );
}