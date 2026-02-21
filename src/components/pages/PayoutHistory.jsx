import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PayoutHistory({ currentUser }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayoutHistory();
  }, [currentUser]);

  const loadPayoutHistory = async () => {
    setLoading(true);
    try {
      if (currentUser?.id) {
        const data = await base44.entities.CommissionPayout.filter(
          { userId: currentUser.id },
          "-requestedAt",
          50
        );
        setPayouts(data);
      }
    } catch (error) {
      console.error("Failed to load payout history:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    completed: payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    processing: payouts
      .filter(p => p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'approved':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'processing':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'approved':
      case 'processing':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading payout history...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Payout History
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Completed</p>
          <p className="text-xl font-bold text-green-700 mt-1">${stats.completed.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Processing</p>
          <p className="text-xl font-bold text-blue-700 mt-1">${stats.processing.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-xs text-yellow-600 font-medium">Pending</p>
          <p className="text-xl font-bold text-yellow-700 mt-1">${stats.pending.toFixed(2)}</p>
        </div>
      </div>

      {/* Payouts List */}
      <div className="space-y-3">
        {payouts.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No payout history yet</p>
        ) : (
          payouts.map((payout) => (
            <div
              key={payout.id}
              className={`border rounded-lg p-4 ${getStatusColor(payout.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(payout.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{payout.status}</span>
                      <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                        {payout.paymentMethod?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-1">
                      Requested: {new Date(payout.requestedAt).toLocaleDateString()}
                    </p>
                    {payout.completedAt && (
                      <p className="text-xs opacity-75">
                        Completed: {new Date(payout.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${payout.amount.toFixed(2)}</div>
                  {payout.processingFee > 0 && (
                    <p className="text-xs opacity-75">Fee: ${payout.processingFee.toFixed(2)}</p>
                  )}
                </div>
              </div>
              {payout.failureReason && (
                <p className="text-xs mt-2 pt-2 border-t border-current/20">
                  <span className="font-medium">Issue:</span> {payout.failureReason}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}