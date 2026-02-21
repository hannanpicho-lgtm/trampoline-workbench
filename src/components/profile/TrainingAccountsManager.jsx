import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Loader2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CreateTrainingAccountModal from '../modals/CreateTrainingAccountModal';

export default function TrainingAccountsManager({ appUser }) {
  const [trainingAccounts, setTrainingAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    if (appUser?.id) {
      loadTrainingAccounts();
    }
  }, [appUser?.id]);

  const loadTrainingAccounts = async () => {
    setLoading(true);
    try {
      // Get all training accounts created with this referrer's code
      const accounts = await base44.entities.AppUser.filter({
        referredBy: appUser.id,
        isTrainingAccount: true
      });

      // Get training account logs
      const logsData = accounts.length > 0 
        ? await base44.entities.TrainingAccountLog.filter({
            referrerId: appUser.id
          })
        : [];

      setTrainingAccounts(accounts || []);
      setLogs(logsData || []);

      // Calculate totals
      const totalEarn = logsData.reduce((sum, log) => sum + (log.totalEarnings || 0), 0);
      const totalShare = logsData.reduce((sum, log) => sum + (log.totalSharedProfit || 0), 0);
      
      setTotalEarnings(totalEarn);
      setTotalProfit(totalShare);
    } catch (error) {
      console.error('Failed to load training accounts:', error);
      toast.error('Failed to load training accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadTrainingAccounts();
  };

  if (!appUser) {
    return <div className="text-center py-8 text-gray-500">User data not available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Training Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create training accounts and earn 20% commission from their task completions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Training Account
        </button>
      </div>

      {/* Your Referral Code */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-mono font-bold text-purple-600">
                {showCode ? appUser.invitationCode : '••••••'}
              </code>
              <button
                onClick={() => setShowCode(!showCode)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title={showCode ? 'Hide code' : 'Show code'}
              >
                {showCode ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(appUser.invitationCode);
                  toast.success('Referral code copied!');
                }}
                className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Share this code to create training accounts</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Active Accounts</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : trainingAccounts.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${loading ? '...' : totalEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Your Profit (20%)</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            ${loading ? '...' : totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Training Accounts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Training Accounts</h3>
        
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Loading training accounts...</p>
          </div>
        ) : trainingAccounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Training Accounts Yet</h4>
            <p className="text-gray-600 mb-6">
              Create your first training account to start earning commissions!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Training Account
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {trainingAccounts.map((account) => {
              const log = logs.find(l => l.trainingAccountId === account.id);
              return (
                <div
                  key={account.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {account.trainingAccountName || 'Training Account'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Phone: <code className="font-mono">{account.phone}</code>
                      </p>
                      <p className="text-sm text-gray-600">
                        Code: <code className="font-mono text-purple-600">{account.invitationCode}</code>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {log?.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Total Earnings</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${(log?.totalEarnings || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Your Share (20%)</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">
                        ${(log?.totalSharedProfit || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {log?.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTrainingAccountModal
          referrerCode={appUser.invitationCode}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
