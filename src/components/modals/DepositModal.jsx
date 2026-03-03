import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";

export default function DepositModal({ show, onClose, currentUser, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) {
      toast.error("Minimum deposit is $10");
      return;
    }
    if (!card.number || !card.expiry || !card.cvv) {
      toast.error("Please fill in all card details");
      return;
    }

    setIsLoading(true);
    try {
      const depositAmount = parseFloat(amount);
      
      // Get current user data
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        toast.error("User data not found");
        setIsLoading(false);
        return;
      }

      const appUser = appUserData[0];
      
      // VIP-based deposit bonuses
      const vipBonusRates = {
        'Bronze': 0.05,   // 5%
        'Silver': 0.08,   // 8%
        'Gold': 0.10,     // 10%
        'Platinum': 0.15, // 15%
        'Diamond': 0.20   // 20%
      };
      
      const bonusRate = vipBonusRates[appUser.vipLevel || 'Bronze'] || 0.05;
      const bonus = depositAmount >= 100 ? depositAmount * bonusRate : 0;
      const totalAmount = depositAmount + bonus;

      const newBalance = (appUser.balance || 0) + totalAmount;

      // Create transaction record
      await backendClient.entities.Transaction.create({
        userId: appUser.id,
        type: "deposit",
        amount: depositAmount,
        status: "completed",
        paymentMethod: "card",
        bonus: bonus,
        balanceBefore: appUser.balance || 0,
        balanceAfter: newBalance,
        metadata: {
          cardLast4: card.number.slice(-4),
          timestamp: new Date().toISOString()
        }
      });

      // Update user balance
      await backendClient.entities.AppUser.update(appUser.id, {
        balance: newBalance
      });

      // Notify referrer about deposit
      if (appUser.referredBy) {
        try {
          const [referrer] = await backendClient.entities.AppUser.filter({ id: appUser.referredBy });
          if (referrer) {
            const referrerUser = await backendClient.entities.User.filter({ email: referrer.created_by });
            if (referrerUser.length > 0) {
              await backendClient.entities.Notification.create({
                userId: referrerUser[0].id,
                type: 'referral_activity',
                title: '💵 Referral Made a Deposit!',
                message: `Your referral (${appUser.phone}) deposited $${depositAmount}!`,
                priority: 'low',
                read: false
              });
            }
          }
        } catch (notifError) {
          console.error('Failed to notify referrer:', notifError);
        }
      }

      toast.success("Deposit successful!", {
        description: bonus > 0 ? `Bonus: +$${bonus.toFixed(2)}` : `New balance: $${newBalance.toFixed(2)}`
      });

      onSuccess({ ...appUser, balance: newBalance });
      setAmount("");
      setCard({ number: "", expiry: "", cvv: "" });
      onClose();
    } catch (error) {
      toast.error("Deposit failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Deposit Funds</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
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
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum $10 | Your {currentUser?.vipLevel || 'Bronze'} VIP bonus: {
                currentUser?.vipLevel === 'Diamond' ? '20%' :
                currentUser?.vipLevel === 'Platinum' ? '15%' :
                currentUser?.vipLevel === 'Gold' ? '10%' :
                currentUser?.vipLevel === 'Silver' ? '8%' : '5%'
              } on $100+
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
            <input 
              type="text" 
              value={card.number} 
              onChange={(e) => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g, "").slice(0, 16) }))} 
              placeholder="4242 4242 4242 4242" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
              <input 
                type="text" 
                value={card.expiry} 
                onChange={(e) => setCard(c => ({ ...c, expiry: e.target.value }))} 
                placeholder="MM/YY" 
                maxLength={5} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
              <input 
                type="password" 
                value={card.cvv} 
                onChange={(e) => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} 
                placeholder="123" 
                maxLength={4} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleDeposit} 
            disabled={isLoading} 
            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? "Processing..." : `Deposit $${amount || "0"}`}
          </button>
          
          <p className="text-xs text-center text-gray-500">Secure payment processing</p>
        </div>
      </div>
    </div>
  );
}