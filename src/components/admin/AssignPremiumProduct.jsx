import { useState, useEffect } from "react";
import { Crown, AlertTriangle } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

export default function AssignPremiumProduct({ userId, userName, onSuccess, onClose }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [taskPosition, setTaskPosition] = useState(40);
  const [loading, setLoading] = useState(false);
  const [makePremium, setMakePremium] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await backendClient.entities.Product.filter({ isActive: true });
      setProducts(productsData);
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const handleAssign = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    setLoading(true);
    try {
      const product = products.find(p => p.id === selectedProduct);
      
      // If product is not premium but admin wants to make it premium for this task
      let finalProduct = product;
      if (makePremium && !product.isPremium) {
        await backendClient.entities.Product.update(product.id, {
          isPremium: true,
          commission: product.commission * 10
        });
        finalProduct = { ...product, isPremium: true, commission: product.commission * 10 };
        toast.success("Product converted to premium!");
      }

      // Create pending task at specific position
      await backendClient.entities.UserTask.create({
        userId: userId,
        productId: finalProduct.id,
        commission: finalProduct.commission,
        status: "pending",
        submittedAt: null
      });

      toast.success(`Premium product queued at task position ${taskPosition} for ${userName}`);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error("Failed to assign product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900">Assign Premium Product</h3>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">User: {userName}</p>
              <p>This will queue a premium product for the user. When they submit it, their account will be frozen.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.isPremium ? "⭐" : ""} - ${product.price} (${product.commission} commission)
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && !products.find(p => p.id === selectedProduct)?.isPremium && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="makePremium"
                checked={makePremium}
                onChange={(e) => setMakePremium(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="makePremium" className="text-sm text-gray-700">
                Convert to Premium (10x commission)
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Position (1-40)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={taskPosition}
              onChange={(e) => setTaskPosition(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              The task number at which this premium product should appear (e.g., 40 for last task)
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || !selectedProduct}
            className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Assigning..." : (
              <>
                <Crown className="w-4 h-4" />
                Assign Premium
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}