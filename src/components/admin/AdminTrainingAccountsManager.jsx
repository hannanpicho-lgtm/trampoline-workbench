import { useState, useEffect } from 'react';
import { Loader2, Filter, Download, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';

export default function AdminTrainingAccountsManager() {
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllTrainingAccounts();
  }, [filterStatus, searchQuery]);

  const loadAllTrainingAccounts = async () => {
    setLoading(true);
    try {
      // Get all training accounts
      const allAccounts = await backendClient.trainingAccounts.listAll();

      // Get all logs
      const allLogs = await backendClient.trainingLogs.listAll();

      let filtered = allAccounts;

      // Apply status filter
      if (filterStatus !== 'all') {
        const logsForStatus = allLogs.filter(log => log.status === filterStatus);
        const accountIds = logsForStatus.map(log => log.trainingAccountId);
        filtered = filtered.filter(acc => accountIds.includes(acc.id));
      }

      // Apply search
      if (searchQuery) {
        filtered = filtered.filter(acc =>
          acc.trainingAccountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.phone?.includes(searchQuery) ||
          acc.invitationCode?.includes(searchQuery)
        );
      }

      setAccounts(filtered);
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load training accounts:', error);
      toast.error('Failed to load training accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (accountId, currentStatus) => {
    try {
      const log = logs.find(l => l.trainingAccountId === accountId);
      if (log) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await backendClient.trainingLogs.updateStatus(log.id, newStatus);
        toast.success(`Account ${newStatus}`);
        loadAllTrainingAccounts();
      }
    } catch (error) {
      toast.error('Failed to update account status');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this training account? This action cannot be undone.')) return;

    try {
      await backendClient.trainingAccounts.delete(accountId);
      const log = logs.find(l => l.trainingAccountId === accountId);
      if (log) {
        await backendClient.trainingLogs.delete(log.id);
      }
      toast.success('Account deleted');
      loadAllTrainingAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleExportData = () => {
    const data = accounts.map(account => {
      const log = logs.find(l => l.trainingAccountId === account.id);
      return {
        'Account Name': account.trainingAccountName || 'Unnamed',
        'Phone': account.phone,
        'Training Code': account.invitationCode,
        'Referrer ID': account.referredBy,
        'Status': log?.status || 'unknown',
        'Total Earnings': log?.totalEarnings || 0,
        'Total Profit Share': log?.totalSharedProfit || 0,
        'Created': log?.createdAt || 'N/A'
      };
    });

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row =>
        Object.values(row)
          .map(val => `"${val}"`)
          .join(',')
      )
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `training-accounts-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Data exported successfully');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Loading training accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Training Accounts Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage all training accounts across the platform</p>
        </div>
        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Accounts</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {logs.filter(l => l.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Profit Shared</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            ${logs.reduce((sum, l) => sum + (l.totalSharedProfit || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Account Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Training Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referrer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Earnings</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Profit Share</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.map((account) => {
                const log = logs.find(l => l.trainingAccountId === account.id);
                return (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {account.trainingAccountName || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {account.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {account.invitationCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {account.referredBy ? account.referredBy.substring(0, 8) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(log?.totalEarnings || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-purple-600">
                      ${(log?.totalSharedProfit || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {log?.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(account.id, log?.status)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={log?.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {log?.status === 'active' ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {accounts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-600">No training accounts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
