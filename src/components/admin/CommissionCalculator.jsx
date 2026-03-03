import { useState } from "react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";
import { Calculator, TrendingUp, Package, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIP_LEVELS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

export default function CommissionCalculator() {
  const [calculating, setCalculating] = useState(false);
  const [vipLevel, setVipLevel] = useState("Bronze");
  const [setNumber, setSetNumber] = useState(1);
  const [result, setResult] = useState(null);

  const calculate = async () => {
    setCalculating(true);
    try {
      const response = await backendClient.functions.invoke('intelligentProductSelector', {
        vipLevel,
        setNumber: parseInt(setNumber)
      });

      setResult(response.data);
      toast.success("Calculation complete!");
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Commission Calculator</h3>
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">VIP Level</label>
            <select
              value={vipLevel}
              onChange={(e) => setVipLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {VIP_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Set</label>
            <select
              value={String(setNumber)}
              onChange={(e) => setSetNumber(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Set 1 (No Premium)</option>
              <option value="2">Set 2 (With Premium)</option>
            </select>
          </div>
        </div>

        <Button
          onClick={calculate}
          disabled={calculating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {calculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Product Distribution
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-500">Target Range</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ${result.targetRange.min.toFixed(0)} - ${result.targetRange.max.toFixed(0)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-500">Actual Commission</span>
              </div>
              <p className={`text-lg font-bold ${
                result.withinRange ? 'text-green-600' : 'text-orange-600'
              }`}>
                ${result.actualCommission.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-500">Products Selected</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {result.statistics.totalProducts}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-gray-500">Variance</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {result.variance}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          {result.withinRange ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-green-900">Commission Target Achieved!</p>
                <p className="text-sm text-green-700">
                  Product selection successfully meets the target commission range for {result.vipLevel}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-xl">!</span>
              </div>
              <div>
                <p className="font-semibold text-orange-900">Outside Target Range</p>
                <p className="text-sm text-orange-700">
                  Commission is {result.actualCommission < result.targetRange.min ? 'below' : 'above'} target range. 
                  Consider adjusting product prices or commission rates.
                </p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Product Distribution Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Average Product Price:</span>
                <p className="font-semibold text-gray-900">${result.statistics.avgProductPrice}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Commission:</span>
                <p className="font-semibold text-gray-900">${result.statistics.totalCommission}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Price Range:</span>
                <p className="font-semibold text-gray-900">
                  ${result.statistics.minProductPrice} - ${result.statistics.maxProductPrice}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Premium Products:</span>
                <p className="font-semibold text-gray-900">{result.statistics.premiumCount}</p>
              </div>
            </div>
          </div>

          {/* Product Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Selected Products Preview</h4>
              <p className="text-xs text-gray-500 mt-1">First 10 products shown</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {result.products.slice(0, 10).map((product, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {product.category}
                      </span>
                      {product.isPremium && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                    <p className="text-xs text-green-600">+${product.commission.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}