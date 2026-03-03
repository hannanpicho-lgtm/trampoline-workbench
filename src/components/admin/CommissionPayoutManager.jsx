import { useState, useEffect } from "react";
import { DollarSign, Search, CheckCircle, AlertCircle, Clock, TrendingUp, Eye } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

export default function CommissionPayoutManager() {
  const [payouts, setPayouts] = useState([]);
  const [filteredPayouts, setFilteredPayouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, []);

  useEffect(() => {
    let filtered = payouts;
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayouts(filtered);
  }, [payouts, searchTerm, filterStatus]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const data = await backendClient.entities.CommissionPayout.list("-requestedAt", 200);
      setPayouts(data);
    } catch (error) {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async (payoutId, action, reason = null) => {
    setProcessing(payoutId);
    try {
      const response = await backendClient.functions.invoke('processCommissionPayout', {
        payoutId,
        action,
        reason
      });

      if (response.data.success) {
        toast.success(`Payout ${action}d successfully!`);
        loadPayouts();
      } else {
        toast.error("Action failed", { description: response.data.error });
      }
    } catch (error) {
      toast.error("Action failed", { description: error.message });
    } finally {
      setProcessing(null);
    }
  };

  const stats = {
    pending: payouts.filter(p => p.status === 'pending').length,
    approved: payouts.filter(p => p.status === 'approved').length,
    processing: payouts.filter(p => p.status === 'processing').length,
    completed: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalPending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <TrendingUp className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading payouts...</div>;
  }

  return (
    <>
      {/* Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payout Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">User Email</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedPayout.userEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Amount</p>
                <p className="text-lg font-semibold text-green-600 mt-1">${selectedPayout.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Status</p>
                <p className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)} capitalize`}>
                    {getStatusIcon(selectedPayout.status)}
                    {selectedPayout.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Payment Method</p>
                <p className="text-sm text-gray-900 mt-1 capitalize">{selectedPayout.paymentMethod?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Requested</p>
                <p className="text-sm text-gray-900 mt-1">{new Date(selectedPayout.requestedAt).toLocaleString()}</p>
              </div>
              {selectedPayout.transactionId && (
                <div>
                  <p className="text-xs text-gray-600 uppercase font-medium">Transaction ID</p>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{selectedPayout.transactionId}</p>
                </div>
              )}
            </div>

            {selectedPayout.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-blue-600 uppercase font-medium mb-1">Admin Notes</p>
                <p className="text-sm text-blue-900">{selectedPayout.notes}</p>
              </div>
            )}

            {selectedPayout.failureReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-red-600 uppercase font-medium mb-1">Failure Reason</p>
                <p className="text-sm text-red-900">{selectedPayout.failureReason}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Commission Payouts</h2>
          <button
            type="button"
            onClick={loadPayouts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                <p className="text-sm text-yellow-600 mt-2">${stats.totalPending.toFixed(2)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Processing</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.processing}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Completed Total</p>
                <p className="text-3xl font-bold text-green-600 mt-1">${(stats.completed / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Total Payouts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{payouts.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No payouts found
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{payout.userEmail}</div>
                          <div className="text-xs text-gray-500">{payout.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-600">${payout.amount.toFixed(2)}</div>
                        {payout.processingFee > 0 && (
                          <div className="text-xs text-gray-500">Fee: ${payout.processingFee.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)} capitalize`}>
                          {getStatusIcon(payout.status)}
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                        {payout.paymentMethod?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowDetailsModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {payout.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePayoutAction(payout.id, 'approve')}
                                disabled={processing === payout.id}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handlePayoutAction(payout.id, 'reject', reason);
                                }}
                                disabled={processing === payout.id}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {payout.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handlePayoutAction(payout.id, 'process')}
                              disabled={processing === payout.id}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Process
                            </button>
                          )}

                          {payout.status === 'processing' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePayoutAction(payout.id, 'complete')}
                                disabled={processing === payout.id}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = prompt('Failure reason:');
                                  if (reason) handlePayoutAction(payout.id, 'fail', reason);
                                }}
                                disabled={processing === payout.id}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Fail
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}