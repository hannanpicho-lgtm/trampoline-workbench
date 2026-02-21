import { useState, useEffect } from "react";
import { ChevronLeft, Crown, Check, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SubscriptionPage({ currentUser, onNavigate }) {
  const [tiers, setTiers] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState("monthly");

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tiersData, subsData] = await Promise.all([
        base44.entities.SubscriptionTier.filter({ isActive: true }, "displayOrder"),
        base44.entities.UserSubscription.filter({ userId: currentUser.id, status: "active" })
      ]);

      setTiers(tiersData);
      setUserSubscription(subsData.length > 0 ? subsData[0] : null);
    } catch (error) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId) => {
    setPurchasing(true);
    try {
      const { data } = await base44.functions.invoke('createSubscriptionCheckout', {
        tierId,
        billingCycle: selectedBilling
      });

      if (data.isIframe) {
        toast.error("Checkout only works from published app", {
          description: "Please open the app in a new tab"
        });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm px-4 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Premium Subscriptions</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-8">
        {/* Billing Toggle */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2">
            <button
              type="button"
              onClick={() => setSelectedBilling("monthly")}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                selectedBilling === "monthly" 
                  ? "bg-blue-600 text-white" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setSelectedBilling("yearly")}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors relative ${
                selectedBilling === "yearly" 
                  ? "bg-blue-600 text-white" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Current Subscription */}
        {userSubscription && (
          <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-yellow-300" />
              <h2 className="text-white text-xl font-bold">Active Subscription</h2>
            </div>
            <p className="text-white/80 text-sm">
              Renews on {new Date(userSubscription.endDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Tiers Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const price = selectedBilling === "yearly" ? tier.yearlyPrice : tier.price;
            const monthlyEquivalent = selectedBilling === "yearly" ? (tier.yearlyPrice / 12).toFixed(2) : tier.price;
            const isCurrentTier = userSubscription?.tierId === tier.id;

            return (
              <div
                key={tier.id}
                className={`bg-white/10 backdrop-blur-sm border rounded-2xl p-6 relative ${
                  tier.badge ? "border-yellow-500/50" : "border-white/20"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.tierName}</h3>
                  <p className="text-white/60 text-sm mb-4">{tier.description}</p>
                  
                  <div className="text-4xl font-bold text-white mb-1">
                    ${monthlyEquivalent}
                    <span className="text-lg font-normal text-white/60">/mo</span>
                  </div>
                  {selectedBilling === "yearly" && (
                    <p className="text-green-400 text-sm">
                      ${tier.yearlyPrice}/year • Save ${(tier.price * 12 - tier.yearlyPrice).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {tier.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={purchasing || isCurrentTier}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    isCurrentTier
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : tier.badge
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isCurrentTier ? "Current Plan" : "Subscribe Now"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mt-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-bold text-lg">Why Go Premium?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">💰 Higher Limits</h4>
              <p className="text-white/60 text-sm">Increased withdrawal limits and better earning potential</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">⚡ Priority Support</h4>
              <p className="text-white/60 text-sm">Get help faster with dedicated priority support</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">🎁 Exclusive Bonuses</h4>
              <p className="text-white/60 text-sm">Earn more with bonus multipliers and special offers</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">🔓 Exclusive Content</h4>
              <p className="text-white/60 text-sm">Access premium features and exclusive tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}