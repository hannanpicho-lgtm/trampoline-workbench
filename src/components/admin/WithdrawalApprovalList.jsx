import { useState, useEffect } from "react";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function WithdrawalApprovalList() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const payoutsData = await base44.entities.CommissionPayout.filter({ status: "pending" }, "-priority, -created_date", 100);
      const usersData = await base44.entities.AppUser.list();
      
      setWithdrawals(payoutsData);
      setUsers(usersData);
    } catch (error) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const getUser = (userId) => users.find(u => u.id === userId);

  const handleApprove = async (withdrawal) => {
    try {
      await base44.entities.CommissionPayout.update(withdrawal.id, {
        status: "approved",
        approvedAt: new Date().toISOString()
      });

      // Notify user
      const user = getUser(withdrawal.userId);
      if (user) {
        const userAccount = await base44.entities.User.filter({ email: user.created_by });
        if (userAccount.length > 0) {
          await base44.entities.Notification.create({
            userId: userAccount[0].id,
            type: 'payout_status',
            title: '✅ Withdrawal Approved!',
            message: `Your withdrawal of $${withdrawal.amount} has been approved and is being processed.`,
            priority: 'high',
            read: false
          });
        }
      }

      toast.success("Withdrawal approved!");
      loadData();
    } catch (error) {
      toast.error("Failed to approve withdrawal");
    }
  };

  const handleReject = async (withdrawal) => {
    if (!confirm("Reject this withdrawal? The amount will be returned to user's balance.")) return;
    
    try {
      // Return amount to user's balance
      const user = getUser(withdrawal.userId);
      if (user) {
        await base44.entities.AppUser.update(user.id, {
          balance: (user.balance || 0) + withdrawal.amount
        });

        // Notify user
        const userAccount = await base44.entities.User.filter({ email: user.created_by });
        if (userAccount.length > 0) {
          await base44.entities.Notification.create({
            userId: userAccount[0].id,
            type: 'payout_status',
            title: '❌ Withdrawal Rejected',
            message: `Your withdrawal of $${withdrawal.amount} was rejected. The amount has been returned to your balance.`,
            priority: 'high',
            read: false
          });
        }
      }

      await base44.entities.CommissionPayout.update(withdrawal.id, {
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });
      
      toast.success("Withdrawal rejected and amount returned");
      loadData();
    } catch (error) {
      toast.error("Failed to reject withdrawal");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading withdrawals...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Withdrawal Approvals</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pending withdrawals</div>
        ) : (
          withdrawals.map((withdrawal) => {
            const user = getUser(withdrawal.userId);
            
            return (
              <div key={withdrawal.id} className={`p-6 ${
                user?.vipLevel === 'Diamond' || user?.vipLevel === 'Platinum' ? 'bg-purple-50 border-l-4 border-purple-500' : ''
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 text-lg">${withdrawal.amount.toFixed(2)}</div>
                        {user?.vipLevel && (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            user.vipLevel === 'Diamond' ? 'bg-cyan-100 text-cyan-800' :
                            user.vipLevel === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                            user.vipLevel === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                            user.vipLevel === 'Silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {user.vipLevel}
                          </span>
                        )}
                        {withdrawal.priority && withdrawal.priority <= 2 && (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-100 text-red-800">
                            PRIORITY
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">User: {user?.phone || "Unknown"}</div>
                      <div className="text-sm text-gray-500">Wallet: {withdrawal.walletAddress || "N/A"}</div>
                      <div className="text-sm text-gray-500">Payment Method: {withdrawal.paymentMethod || "N/A"}</div>
                      {withdrawal.estimatedProcessing && (
                        <div className="text-sm text-purple-600 font-medium">Target: {withdrawal.estimatedProcessing}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Requested: {new Date(withdrawal.created_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(withdrawal)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(withdrawal)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}