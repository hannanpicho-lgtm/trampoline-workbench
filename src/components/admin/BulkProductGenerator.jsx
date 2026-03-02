import { useState } from "react";
import { Button } from "@/components/ui/button";
import { backendClient } from "@/api/backendClient";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Package, Zap, Sparkles, Eye } from "lucide-react";

const PRODUCT_CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Toys", "Food"];

const CATEGORY_IMAGES = {
  "Electronics": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  "Fashion": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop",
  "Home": "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400&h=400&fit=crop",
  "Beauty": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
  "Sports": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
  "Books": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
  "Toys": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
  "Food": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop"
};

const generateRandomProduct = (index, vipLevel) => {
  const vipPriceRanges = {
    "Bronze": { min: 10, max: 100 },
    "Silver": { min: 50, max: 500 },
    "Gold": { min: 500, max: 3500 },
    "Platinum": { min: 1000, max: 5500 },
    "Diamond": { min: 2000, max: 15000 }
  };

  const range = vipPriceRanges[vipLevel];
  const price = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
  
  return {
    name: `${category} Product ${index + 1}`,
    price: price,
    commission: price * 0.01, // Base commission, will be overridden by VIP rate
    imageUrl: CATEGORY_IMAGES[category],
    category: category,
    isActive: true,
    isPremium: false
  };
};

export default function BulkProductGenerator() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(1000);
  const [mode, setMode] = useState("quick"); // "quick" or "ai"
  const [aiGenerating, setAiGenerating] = useState(false);
  const [template, setTemplate] = useState({
    baseProduct: "Electronics",
    category: "Electronics",
    priceMin: 10,
    priceMax: 100,
    description: "High-quality electronic device",
    variations: 20
  });
  const [generatedProducts, setGeneratedProducts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const generateProducts = async () => {
    if (count < 1 || count > 50000) {
      toast.error("Count must be between 1 and 50,000");
      return;
    }

    setLoading(true);
    try {
      const batchSize = 100; // Create in batches
      const totalBatches = Math.ceil(count / batchSize);
      let created = 0;

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchProducts = [];
        const productsInBatch = Math.min(batchSize, count - created);
        
        for (let i = 0; i < productsInBatch; i++) {
          const productIndex = created + i;
          // Distribute products across VIP levels
          const vipLevels = ["Bronze", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
          const vipLevel = vipLevels[productIndex % vipLevels.length];
          batchProducts.push(generateRandomProduct(productIndex, vipLevel));
        }

        await backendClient.entities.Product.bulkCreate(batchProducts);
        created += productsInBatch;
        
        toast.success(`Created ${created} / ${count} products...`, { duration: 1000 });
      }

      toast.success(`✅ Successfully created ${count} products!`);
    } catch (error) {
      console.error("Bulk creation error:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    setAiGenerating(true);
    try {
      const prompt = `Generate ${template.variations} unique product variations based on:
- Base Product: ${template.baseProduct}
- Category: ${template.category}
- Price Range: $${template.priceMin}-$${template.priceMax}
- Base Description: ${template.description}

For each product, create:
1. A unique, realistic product name (not just numbered)
2. A compelling 1-2 sentence description
3. Vary the price within the range

Return ONLY valid JSON array format, no markdown or explanation.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" }
                }
              }
            }
          }
        }
      });

      const products = result.products.map(p => ({
        ...p,
        category: template.category,
        commission: p.price * 0.01,
        imageUrl: CATEGORY_IMAGES[template.category],
        isActive: true,
        isPremium: false
      }));

      setGeneratedProducts(products);
      setShowPreview(true);
      toast.success(`Generated ${products.length} unique products!`);
    } catch (error) {
      toast.error(`AI generation failed: ${error.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const createGeneratedProducts = async () => {
    setLoading(true);
    try {
      const batchSize = 100;
      let created = 0;

      for (let i = 0; i < generatedProducts.length; i += batchSize) {
        const batch = generatedProducts.slice(i, i + batchSize);
        await backendClient.entities.Product.bulkCreate(batch);
        created += batch.length;
        toast.success(`Created ${created} / ${generatedProducts.length}...`, { duration: 1000 });
      }

      toast.success(`✅ Created ${generatedProducts.length} products!`);
      setGeneratedProducts([]);
      setShowPreview(false);
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm("⚠️ Delete ALL products? This cannot be undone!")) return;

    setLoading(true);
    try {
      const products = await backendClient.entities.Product.list("-created_date", 10000);
      
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await Promise.all(batch.map(p => backendClient.entities.Product.delete(p.id)));
        toast.success(`Deleted ${Math.min(i + batchSize, products.length)} / ${products.length}...`, { duration: 500 });
      }

      toast.success(`✅ Deleted all ${products.length} products`);
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Bulk Product Generator</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
              mode === "quick" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Quick Generate
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1 ${
              mode === "ai" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </button>
        </div>
      </div>

      <div className="space-y-4">{mode === "quick" ? (
        // Quick Generation Mode
        <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Products to Generate
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            min="1"
            max="50000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max: 50,000 products. Products distributed across all VIP levels.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={generateProducts}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate {count.toLocaleString()} Products
              </>
            )}
          </Button>

          <Button
            onClick={deleteAllProducts}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Delete All
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">📦 Product Distribution:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Bronze (VIP1): $10-$100 products</li>
            <li>Silver (VIP2): $50-$500 products</li>
            <li>Gold (VIP3): $500-$3,500 products</li>
            <li>Platinum (VIP4): $1,000-$5,500 products</li>
            <li>Diamond (VIP5): $2,000-$15,000 products</li>
          </ul>
        </div>
        </>
        ) : (
        // AI Generation Mode
        <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Product</label>
            <input
              type="text"
              value={template.baseProduct}
              onChange={(e) => setTemplate({ ...template, baseProduct: e.target.value })}
              placeholder="e.g., Smartphone, Laptop, Watch"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              disabled={aiGenerating || loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={template.category}
              onChange={(e) => setTemplate({ ...template, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              disabled={aiGenerating || loading}
            >
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Price ($)</label>
            <input
              type="number"
              value={template.priceMin}
              onChange={(e) => setTemplate({ ...template, priceMin: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              disabled={aiGenerating || loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price ($)</label>
            <input
              type="number"
              value={template.priceMax}
              onChange={(e) => setTemplate({ ...template, priceMax: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              disabled={aiGenerating || loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Base Description</label>
          <textarea
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            placeholder="Brief description for AI to use as base..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            rows={2}
            disabled={aiGenerating || loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variations to Generate</label>
          <input
            type="number"
            value={template.variations}
            onChange={(e) => setTemplate({ ...template, variations: parseInt(e.target.value) || 1 })}
            min="1"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            disabled={aiGenerating || loading}
          />
          <p className="text-xs text-gray-500 mt-1">Max: 100 variations per generation</p>
        </div>

        <Button
          onClick={generateWithAI}
          disabled={aiGenerating || loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              AI Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </>
          )}
        </Button>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
          <p className="font-medium mb-1">✨ AI Generation:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Creates unique, realistic product names and descriptions</li>
            <li>Varies prices within your specified range</li>
            <li>Preview before creating products in database</li>
            <li>Generates creative variations based on your template</li>
          </ul>
        </div>
        </>
        )}
        </div>

        {/* Preview Modal */}
        {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Preview Generated Products</h3>
                  <p className="text-sm text-gray-500 mt-1">{generatedProducts.length} products ready to create</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4">
                {generatedProducts.map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            Commission: ${product.commission.toFixed(2)}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={() => {
                  setGeneratedProducts([]);
                  setShowPreview(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createGeneratedProducts}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create {generatedProducts.length} Products
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
        </div>
        );
        }