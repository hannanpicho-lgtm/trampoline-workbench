import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function WithdrawModal({ show, onClose, currentUser, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [showTxPassword, setShowTxPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 50) {
      toast.error("Minimum withdrawal is $50");
      return;
    }
    if (!txPassword) {
      toast.error("Transaction password is required");
      return;
    }

    setIsLoading(true);
    try {
      // Get current user data
      const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        toast.error("User data not found");
        setIsLoading(false);
        return;
      }

      const appUser = appUserData[0];
      const withdrawAmount = parseFloat(amount);

      // VIP level minimum balance requirements
      const vipMinBalances = {
        Bronze: 100,
        Silver: 150,
        Gold: 200,
        Platinum: 300,
        Diamond: 500
      };

      const minBalance = vipMinBalances[appUser.vipLevel || 'Bronze'];
      const maxWithdrawable = (appUser.balance || 0) - minBalance;

      if (maxWithdrawable <= 0) {
        toast.error("Insufficient balance", {
          description: `You must maintain at least $${minBalance} for your ${appUser.vipLevel} level`
        });
        setIsLoading(false);
        return;
      }

      if (withdrawAmount > maxWithdrawable) {
        toast.error("Withdrawal exceeds limit", {
          description: `Maximum withdrawable: $${maxWithdrawable.toFixed(2)} (must keep $${minBalance} for ${appUser.vipLevel} level)`
        });
        setIsLoading(false);
        return;
      }

      if (withdrawAmount > (appUser.balance || 0)) {
        toast.error("Insufficient balance");
        setIsLoading(false);
        return;
      }

      // Verify transaction password
      if (txPassword !== appUser.transactionPassword) {
        toast.error("Invalid transaction password");
        setIsLoading(false);
        return;
      }

      // Check if user has completed 2 task sets
      if ((appUser.taskSetsCompleted || 0) < 2) {
        toast.error("Withdrawal not available", {
          description: "You must complete 2 sets of tasks before withdrawing"
        });
        setIsLoading(false);
        return;
      }

      const newBalance = appUser.balance - withdrawAmount;

      // VIP-based processing priority
      const vipPriority = {
        'Diamond': 1,
        'Platinum': 2,
        'Gold': 3,
        'Silver': 4,
        'Bronze': 5
      };

      const vipProcessingTime = {
        'Diamond': '1-6 hours',
        'Platinum': '6-12 hours',
        'Gold': '12-24 hours',
        'Silver': '24-48 hours',
        'Bronze': '48-72 hours'
      };

      // Create commission payout request (admin review required)
      await base44.entities.CommissionPayout.create({
        userId: appUser.id,
        userEmail: currentUser.email,
        amount: withdrawAmount,
        status: "pending",
        paymentMethod: walletAddress ? "crypto" : "bank_transfer",
        walletAddress: walletAddress || null,
        requestedAt: new Date().toISOString(),
        vipLevel: appUser.vipLevel,
        priority: vipPriority[appUser.vipLevel || 'Bronze'] || 5,
        estimatedProcessing: vipProcessingTime[appUser.vipLevel || 'Bronze']
      });

      // Update user balance
      await base44.entities.AppUser.update(appUser.id, {
        balance: newBalance
      });

      const processingTime = {
        'Diamond': '1-6 hours',
        'Platinum': '6-12 hours',
        'Gold': '12-24 hours',
        'Silver': '24-48 hours',
        'Bronze': '48-72 hours'
      }[appUser.vipLevel || 'Bronze'];

      toast.success("Withdrawal submitted!", {
        description: `${appUser.vipLevel} VIP processing: ${processingTime}`
      });

      onSuccess({ ...appUser, balance: newBalance });
      setAmount("");
      setWalletAddress("");
      setTxPassword("");
      onClose();
    } catch (error) {
      toast.error("Withdrawal failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Balance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${currentUser?.balance?.toFixed(2) || "0.00"}</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-sm text-amber-700 font-medium">Maximum Withdrawable</div>
            <div className="text-xl font-bold text-amber-900">
              ${Math.max(0, (currentUser?.balance || 0) - (
                currentUser?.vipLevel === 'Silver' ? 150 :
                currentUser?.vipLevel === 'Gold' ? 200 :
                currentUser?.vipLevel === 'Platinum' ? 300 :
                currentUser?.vipLevel === 'Diamond' ? 500 : 100
              )).toFixed(2)}
            </div>
            <div className="text-xs text-amber-600 mt-1">
              Must keep ${
                currentUser?.vipLevel === 'Silver' ? 150 :
                currentUser?.vipLevel === 'Gold' ? 200 :
                currentUser?.vipLevel === 'Platinum' ? 300 :
                currentUser?.vipLevel === 'Diamond' ? 500 : 100
              } for {currentUser?.vipLevel || 'Bronze'} level tasks
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="100.00" 
                min="10" 
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum $50 | {
                currentUser?.vipLevel === 'Diamond' ? '1-6h instant' :
                currentUser?.vipLevel === 'Platinum' ? '6-12h priority' :
                currentUser?.vipLevel === 'Gold' ? '12-24h fast' :
                currentUser?.vipLevel === 'Silver' ? '24-48h' : '48-72h'
              } processing for {currentUser?.vipLevel || 'Bronze'} VIP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet Address (Optional)</label>
            <input 
              type="text" 
              value={walletAddress} 
              onChange={(e) => setWalletAddress(e.target.value)} 
              placeholder="0x..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Password</label>
            <div className="relative">
              <input 
                type={showTxPassword ? "text" : "password"} 
                value={txPassword} 
                onChange={(e) => setTxPassword(e.target.value)} 
                placeholder="Enter transaction password" 
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500" 
              />
              <button 
                type="button" 
                onClick={() => setShowTxPassword(!showTxPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showTxPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleWithdraw} 
            disabled={isLoading || !amount || !txPassword} 
            className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? "Processing..." : `Withdraw $${amount || "0"}`}
          </button>
        </div>
      </div>
    </div>
  );
}