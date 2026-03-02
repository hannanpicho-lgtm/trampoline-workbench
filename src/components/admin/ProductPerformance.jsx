import { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Package, DollarSign, TrendingUp, Award } from "lucide-react";

export default function ProductPerformance() {
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [premiumOrderStats, setPremiumOrderStats] = useState({ total: 0, completed: 0, totalCommission: 0 });

  useEffect(() => {
    loadProductAnalytics();
  }, []);

  const loadProductAnalytics = async () => {
    setLoading(true);
    try {
      const [products, tasks] = await Promise.all([
        backendClient.entities.Product.list(),
        backendClient.entities.UserTask.list()
      ]);

      // Product performance stats
      const stats = products.map(product => {
        const productTasks = tasks.filter(t => t.productId === product.id);
        const completedTasks = productTasks.filter(t => t.status === "completed" || t.status === "approved");
        const totalCommission = completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);
        const avgCommission = completedTasks.length > 0 ? totalCommission / completedTasks.length : 0;
        const completionRate = productTasks.length > 0 ? (completedTasks.length / productTasks.length * 100) : 0;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          baseCommission: product.commission,
          totalTasks: productTasks.length,
          completedTasks: completedTasks.length,
          totalCommission: totalCommission,
          avgCommission: avgCommission,
          completionRate: completionRate,
          category: product.category || "Uncategorized"
        };
      });

      setProductStats(stats);

      // Top performing products
      const top = [...stats].sort((a, b) => b.totalCommission - a.totalCommission).slice(0, 10);
      setTopProducts(top);

      // Premium order statistics
      const premiumTasks = tasks.filter(t => t.isPremiumOrder);
      const completedPremium = premiumTasks.filter(t => t.status === "completed" || t.status === "approved");
      setPremiumOrderStats({
        total: premiumTasks.length,
        completed: completedPremium.length,
        totalCommission: completedPremium.reduce((sum, t) => sum + (t.commission || 0), 0)
      });

    } catch (error) {
      console.error("Failed to load product analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading product performance...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Product Performance Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{productStats.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Premium Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{premiumOrderStats.total}</p>
              <p className="text-xs text-gray-500 mt-1">{premiumOrderStats.completed} completed</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Premium Commission</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${premiumOrderStats.totalCommission.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">from premium orders</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Completion</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(productStats.reduce((sum, p) => sum + p.completionRate, 0) / productStats.length || 0).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Products by Commission</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalCommission" fill="#3b82f6" name="Total Commission ($)" />
            <Bar dataKey="completedTasks" fill="#10b981" name="Completed Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Commission</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                    <div className="text-xs text-gray-500">{stat.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.baseCommission}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.totalTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{stat.completedTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${stat.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{stat.completionRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">${stat.totalCommission.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stat.avgCommission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}