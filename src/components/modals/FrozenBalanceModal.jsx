import { AlertTriangle, Lock, MessageCircle } from "lucide-react";

export default function FrozenBalanceModal({ 
  premiumProduct, 
  currentBalance, 
  onContactSupport,
  onClose 
}) {
  const premiumValue = premiumProduct.price;
  const frozenBalance = premiumValue + currentBalance;
  const negativeAmount = -premiumValue;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900 rounded-2xl p-6 w-full max-w-md border-2 border-amber-400 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-4">
            <Lock className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Account Frozen
        </h2>
        <p className="text-amber-100 text-center text-sm mb-6">
          Premium product submitted - Please contact support
        </p>

        {/* Premium Product Info */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
              ⭐ PREMIUM
            </span>
            <span className="text-white text-sm font-medium">{premiumProduct.name}</span>
          </div>
          {premiumProduct.bundleItems?.length > 0 && (
            <div className="text-xs text-white/70 mt-2">
              Bundle: {premiumProduct.bundleItems.join(", ")}
            </div>
          )}
        </div>

        {/* Balance Information */}
        <div className="space-y-3 mb-6">
          {/* Negative Amount */}
          <div className="bg-orange-500/30 border border-orange-400 rounded-xl p-4">
            <div className="text-orange-100 text-xs font-medium mb-1">Premium Product Value</div>
            <div className="text-3xl font-bold text-white">
              -${premiumValue.toFixed(2)}
            </div>
          </div>

          {/* Frozen Balance */}
          <div className="bg-amber-500/30 border border-amber-400 rounded-xl p-4">
            <div className="text-amber-100 text-xs font-medium mb-1">Frozen Balance</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              <Lock className="w-6 h-6" />
              ${frozenBalance.toFixed(2)}
            </div>
            <div className="text-xs text-amber-100 mt-2">
              Previous Balance (${currentBalance.toFixed(2)}) + Premium Value (${premiumValue.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-500/20 border border-yellow-400 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-100">
              <p className="font-medium mb-1">Important Notice</p>
              <p className="text-xs">
                Your account has been automatically frozen due to premium product submission. 
                Contact customer support to unfreeze your account and continue.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onContactSupport}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Customer Support
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 border-2 border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}