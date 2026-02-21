import { useState, useEffect } from "react";
import { ChevronLeft, ShoppingBag, Loader2, Sparkles, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function StorePage({ currentUser, onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    loadItems();
  }, [currentUser]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.InAppPurchase.filter({ isActive: true }, "displayOrder");
      setItems(data);
    } catch (error) {
      toast.error("Failed to load store items");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    setPurchasing(true);
    try {
      const { data } = await base44.functions.invoke('createPurchaseCheckout', { itemId });

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
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      balance_bonus: "Balance Bonus",
      task_refresh: "Task Refresh",
      vip_upgrade: "VIP Upgrade",
      commission_boost: "Commission Boost",
      badge: "Badge",
      profile_theme: "Theme"
    };
    return labels[type] || type;
  };

  const filteredItems = selectedType === "all" 
    ? items 
    : items.filter(item => item.itemType === selectedType);

  const featuredItems = items.filter(item => item.isFeatured);

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
          <h1 className="text-white text-xl font-bold">Store</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-8">
        {/* Category Filter */}
        <div className="max-w-4xl mx-auto mb-8 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedType === "all" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              All Items
            </button>
            {["balance_bonus", "task_refresh", "commission_boost", "vip_upgrade"].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedType === type 
                    ? "bg-blue-600 text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Items */}
        {featuredItems.length > 0 && selectedType === "all" && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-bold text-lg">Featured Deals</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 relative"
                >
                  {item.discount > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {item.discount}% OFF
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-white text-xl font-bold mb-2">{item.itemName}</h3>
                  <p className="text-white/80 text-sm mb-4">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">
                      ${item.price}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasing}
                      className="px-6 py-3 bg-white hover:bg-gray-100 text-purple-600 rounded-xl font-bold transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Items */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-bold text-lg mb-4">All Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const finalPrice = item.discount > 0 
                ? item.price * (1 - item.discount / 100) 
                : item.price;

              return (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 relative"
                >
                  {item.discount > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        -{item.discount}%
                      </span>
                    </div>
                  )}

                  {item.imageUrl && (
                    <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
                      <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300">
                      {getTypeLabel(item.itemType)}
                    </span>
                  </div>

                  <h3 className="text-white font-bold mb-2">{item.itemName}</h3>
                  <p className="text-white/60 text-sm mb-4">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      {item.discount > 0 && (
                        <div className="text-white/40 text-sm line-through">${item.price}</div>
                      )}
                      <div className="text-2xl font-bold text-white">${finalPrice.toFixed(2)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Buy
                    </button>
                  </div>

                  {item.limitPerUser && (
                    <p className="text-white/40 text-xs mt-2">Limit: {item.limitPerUser} per user</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}