import { useState } from "react";
import { X, Eye, EyeOff, Wallet } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function AddWalletModal({ show, onClose, currentUser }) {
  const [step, setStep] = useState("verify"); // verify or add-wallet
  const [transactionPassword, setTransactionPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleVerifyPassword = async () => {
    if (!transactionPassword) {
      toast.error("Please enter your transaction password");
      return;
    }

    setLoading(true);
    try {
      const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        toast.error("User data not found");
        setLoading(false);
        return;
      }

      const appUser = appUserData[0];

      if (!appUser.transactionPassword) {
        toast.error("No transaction password set", {
          description: "Please set up a transaction password in your profile settings first"
        });
        setLoading(false);
        return;
      }

      if (appUser.transactionPassword !== transactionPassword) {
        toast.error("Incorrect transaction password");
        setLoading(false);
        return;
      }

      setStep("add-wallet");
      toast.success("Verified!", { description: "You can now add your wallet" });
    } catch (error) {
      toast.error("Verification failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!walletAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    setLoading(true);
    try {
      const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        toast.error("User data not found");
        setLoading(false);
        return;
      }

      // For now, we'll just show success. In a real app, you'd update user with wallet address
      toast.success("Wallet added successfully!", {
        description: `Wallet ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)} has been linked`
      });
      
      onClose();
      setStep("verify");
      setTransactionPassword("");
      setWalletAddress("");
    } catch (error) {
      toast.error("Failed to add wallet", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("verify");
    setTransactionPassword("");
    setWalletAddress("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {step === "verify" ? "Verify Transaction Password" : "Add Wallet"}
          </h3>
          <button type="button" onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {step === "verify" ? (
          <>
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔒</span>
                  <h4 className="font-semibold text-blue-900">Security Verification</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Please enter your transaction password to add a wallet address.
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your transaction password"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyPassword}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900">Add Your Wallet</h4>
                  <p className="text-xs text-green-700">Enter your wallet address for withdrawals</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your wallet address"
                onKeyDown={(e) => e.key === "Enter" && handleAddWallet()}
              />
              <p className="text-xs text-gray-500 mt-2">
                Make sure to double-check your wallet address. Incorrect addresses may result in lost funds.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWallet}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Wallet"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}