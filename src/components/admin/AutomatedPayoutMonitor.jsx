import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AutomatedPayoutMonitor() {
  const [stats, setStats] = useState({
    enabled: 0,
    pendingProcessing: 0,
    processedToday: 0,
    failedToday: 0,
    totalAmount: 0
  });
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [autoSettings, setAutoSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load auto-withdrawal settings
      const settings = await backendClient.entities.AutoWithdrawalSettings.filter({});
      setAutoSettings(settings);

      // Calculate stats
      const enabledCount = settings.filter(s => s.isEnabled).length;
      
      // Load recent automated transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const transactions = await backendClient.entities.Transaction.filter(
        { type: 'withdrawal' },
        '-created_date',
        100
      );

      const automatedTransactions = transactions.filter(t => 
        t.metadata?.automated === true || t.metadata?.automated === 'true'
      );

      const todayTransactions = automatedTransactions.filter(t => 
        new Date(t.created_date) >= today
      );

      const processedToday = todayTransactions.filter(t => t.status === 'completed').length;
      const failedToday = todayTransactions.filter(t => t.status === 'failed').length;
      const totalAmount = todayTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate pending (users who meet threshold)
      const users = await backendClient.entities.AppUser.filter({});
      const pendingCount = settings.filter(s => {
        if (!s.isEnabled) return false;
        const user = users.find(u => u.id === s.userId);
        return user && user.balance >= s.thresholdAmount;
      }).length;

      setStats({
        enabled: enabledCount,
        pendingProcessing: pendingCount,
        processedToday,
        failedToday,
        totalAmount
      });

      setRecentPayouts(automatedTransactions.slice(0, 10));

    } catch (error) {
      console.error('Failed to load payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    setProcessing(true);
    try {
      const result = await backendClient.functions.invoke('checkAutoWithdrawals', {});
      toast.success('Auto-withdrawal check completed', {
        description: `Processed: ${result.data.summary.processed}, Failed: ${result.data.summary.failed}`
      });
      loadData();
    } catch (error) {
      toast.error('Failed to trigger auto-withdrawals');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading payout monitor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Automated Payout Monitor</h2>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleManualTrigger} disabled={processing} className="bg-blue-600">
            {processing ? 'Processing...' : 'Trigger Check'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">ENABLED</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.enabled}</p>
          <p className="text-xs text-gray-600 mt-1">Active auto-withdrawals</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">PENDING</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingProcessing}</p>
          <p className="text-xs text-gray-600 mt-1">Ready to process</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-green-600">TODAY</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.processedToday}</p>
          <p className="text-xs text-gray-600 mt-1">Processed today</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-xs font-medium text-red-600">FAILED</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.failedToday}</p>
          <p className="text-xs text-gray-600 mt-1">Failed today</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">VOLUME</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.totalAmount.toFixed(0)}</p>
          <p className="text-xs text-gray-600 mt-1">Today's volume</p>
        </div>
      </div>

      {/* Recent Automated Payouts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Automated Payouts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No automated payouts yet
                  </td>
                </tr>
              ) : (
                recentPayouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payout.userId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${Math.abs(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {payout.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : payout.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          {payout.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(payout.created_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {payout.metadata?.stripeTransferId?.slice(0, 20) || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Active Auto-Withdrawal Settings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Processed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {autoSettings.filter(s => s.isEnabled).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No active auto-withdrawal settings
                  </td>
                </tr>
              ) : (
                autoSettings.filter(s => s.isEnabled).map(setting => (
                  <tr key={setting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {setting.userId.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${setting.thresholdAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {setting.frequency}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {setting.lastProcessedAt 
                        ? new Date(setting.lastProcessedAt).toLocaleString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}