import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Package, Upload, Crown } from "lucide-react";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    commission: "",
    imageUrl: "",
    category: "",
    isActive: true,
    isPremium: false,
    bundleItems: []
  });
  const [bundleInput, setBundleInput] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await backendClient.entities.Product.list();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.commission) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        commission: parseFloat(formData.commission),
        imageUrl: formData.imageUrl || null,
        category: formData.category || "General",
        isActive: formData.isActive,
        isPremium: formData.isPremium,
        bundleItems: formData.bundleItems || []
      };

      if (editingProduct) {
        await backendClient.entities.Product.update(editingProduct.id, productData);
        toast.success("Product updated successfully");
      } else {
        await backendClient.entities.Product.create(productData);
        toast.success("Product created successfully");
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        commission: "",
        imageUrl: "",
        category: "",
        isActive: true,
        isPremium: false,
        bundleItems: []
      });
      setBundleInput("");
      loadProducts();
    } catch (error) {
      toast.error("Failed to save product", { description: error.message });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      commission: product.commission.toString(),
      imageUrl: product.imageUrl || "",
      category: product.category || "",
      isActive: product.isActive,
      isPremium: product.isPremium || false,
      bundleItems: product.bundleItems || []
    });
    setBundleInput((product.bundleItems || []).join(", "));
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await backendClient.entities.Product.delete(productId);
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await backendClient.entities.Product.update(product.id, {
        isActive: !product.isActive
      });
      toast.success(`Product ${!product.isActive ? "activated" : "deactivated"}`);
      loadProducts();
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, imageUrl: result.file_url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete ALL products without images? This cannot be undone!")) return;
              const loadingToast = toast.loading("Deleting products without images...");
              try {
                const allProducts = await backendClient.entities.Product.list("-created_date", 10000);
                const productsToDelete = allProducts.filter(p => !p.imageUrl || p.imageUrl.trim() === '');
                
                for (const product of productsToDelete) {
                  await backendClient.entities.Product.delete(product.id);
                }
                
                toast.success(`Deleted ${productsToDelete.length} products without images`, { id: loadingToast });
                loadProducts();
              } catch (error) {
                toast.error("Failed to delete products", { id: loadingToast });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5" />
            Delete Products Without Images
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: "",
                price: "",
                commission: "",
                imageUrl: "",
                category: "",
                isActive: true,
                isPremium: false,
                bundleItems: []
              });
              setBundleInput("");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className={`bg-white rounded-lg shadow-sm overflow-hidden border-2 ${product.isActive ? 'border-green-200' : 'border-gray-200'}`}>
            <div className="h-48 bg-gray-100 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  {product.isPremium && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                        ⭐ PREMIUM
                      </span>
                      <span className="text-xs text-orange-600 font-medium">10x Commission</span>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {product.category || "General"}
                {product.bundleItems?.length > 0 && (
                  <span className="ml-2 text-xs text-purple-600">• {product.bundleItems.length} items bundled</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-600">Price</div>
                  <div className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Commission</div>
                  <div className="text-lg font-bold text-green-600">${product.commission}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(product)}
                    className={`flex-1 px-3 py-2 rounded-lg ${product.isActive ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {!product.isPremium && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Convert "${product.name}" to Premium? Commission will be 10x higher.`)) return;
                      try {
                        await backendClient.entities.Product.update(product.id, {
                          isPremium: true,
                          commission: product.commission * 10
                        });
                        toast.success("Product converted to Premium!");
                        loadProducts();
                      } catch (error) {
                        toast.error("Failed to convert product");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 font-medium text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    Make Premium (10x)
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No products yet. Add your first product!</p>
        </div>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Premium Laptop"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="99.99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold mr-2">⭐ PREMIUM</span>
                    Premium Bundle (10x Commission)
                  </label>
                </div>
                {formData.isPremium && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Items (1-3 items)</label>
                    <input
                      type="text"
                      value={bundleInput}
                      onChange={(e) => {
                        setBundleInput(e.target.value);
                        const items = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        setFormData(prev => ({ ...prev, bundleItems: items }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., Laptop, Mouse, Keyboard"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate items with commas. Max 3 items.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                  <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active (available for tasks)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? "Update" : "Create"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}