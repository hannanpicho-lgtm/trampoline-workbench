import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Crown, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SubscriptionTierManager() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({
    tierName: "",
    description: "",
    price: 0,
    yearlyPrice: 0,
    benefits: {
      withdrawalLimit: 0,
      prioritySupport: false,
      exclusiveContent: false,
      bonusMultiplier: 1,
      freeTaskRefreshes: 0,
      reducedFees: 0
    },
    features: [],
    isActive: true,
    displayOrder: 0,
    badge: "",
    badgeColor: "blue"
  });
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SubscriptionTier.list("displayOrder");
      setTiers(data);
    } catch (error) {
      toast.error("Failed to load tiers");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setFormData({
      ...tier,
      features: tier.features || []
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.tierName || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingTier) {
        await base44.entities.SubscriptionTier.update(editingTier.id, formData);
        toast.success("Tier updated!");
      } else {
        await base44.entities.SubscriptionTier.create(formData);
        toast.success("Tier created!");
      }
      setShowForm(false);
      setEditingTier(null);
      resetForm();
      loadTiers();
    } catch (error) {
      toast.error("Failed to save tier");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this tier?")) return;

    try {
      await base44.entities.SubscriptionTier.delete(id);
      toast.success("Tier deleted");
      loadTiers();
    } catch (error) {
      toast.error("Failed to delete tier");
    }
  };

  const resetForm = () => {
    setFormData({
      tierName: "",
      description: "",
      price: 0,
      yearlyPrice: 0,
      benefits: {
        withdrawalLimit: 0,
        prioritySupport: false,
        exclusiveContent: false,
        bonusMultiplier: 1,
        freeTaskRefreshes: 0,
        reducedFees: 0
      },
      features: [],
      isActive: true,
      displayOrder: 0,
      badge: "",
      badgeColor: "blue"
    });
    setNewFeature("");
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Subscription Tiers</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map(tier => (
              <div key={tier.id} className="border border-gray-200 rounded-xl p-4 relative">
                {tier.badge && (
                  <span className={`absolute top-2 right-2 px-2 py-1 bg-${tier.badgeColor}-100 text-${tier.badgeColor}-700 text-xs font-bold rounded-lg`}>
                    {tier.badge}
                  </span>
                )}
                
                <h4 className="text-xl font-bold text-gray-900 mb-2">{tier.tierName}</h4>
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${tier.price}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  {tier.yearlyPrice && (
                    <div className="text-sm text-green-600">
                      ${tier.yearlyPrice}/year (Save ${(tier.price * 12 - tier.yearlyPrice).toFixed(2)})
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {tier.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleEdit(tier)}
                    className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tier.id)}
                    className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTier ? "Edit Tier" : "Create Tier"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTier(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tier Name*</label>
                  <input
                    type="text"
                    value={formData.tierName}
                    onChange={(e) => setFormData({...formData, tierName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Describe the tier benefits..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Price ($)*</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Price ($)</label>
                  <input
                    type="number"
                    value={formData.yearlyPrice}
                    onChange={(e) => setFormData({...formData, yearlyPrice: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({...formData, badge: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Popular, Best Value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Badge Color</label>
                  <select
                    value={formData.badgeColor}
                    onChange={(e) => setFormData({...formData, badgeColor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Limit ($)</label>
                    <input
                      type="number"
                      value={formData.benefits.withdrawalLimit}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, withdrawalLimit: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.benefits.bonusMultiplier}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, bonusMultiplier: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Task Refreshes</label>
                    <input
                      type="number"
                      value={formData.benefits.freeTaskRefreshes}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, freeTaskRefreshes: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reduced Fees (%)</label>
                    <input
                      type="number"
                      value={formData.benefits.reducedFees}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, reducedFees: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.benefits.prioritySupport}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, prioritySupport: e.target.checked}
                      })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Priority Support</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.benefits.exclusiveContent}
                      onChange={(e) => setFormData({
                        ...formData,
                        benefits: {...formData.benefits, exclusiveContent: e.target.checked}
                      })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Exclusive Content</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addFeature()}
                    placeholder="Add a feature..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="flex-1 text-sm text-gray-700">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label className="text-sm text-gray-700">Active (visible to users)</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTier(null);
                  resetForm();
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Tier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}