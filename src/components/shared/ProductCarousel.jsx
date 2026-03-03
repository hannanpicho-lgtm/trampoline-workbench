import { useEffect, useState } from "react";
import { backendClient } from "@/api/backendClient";

export default function ProductCarousel() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await backendClient.entities.Product.filter({ isActive: true }, "-created_date", 10);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="relative z-10 px-4 mb-6 overflow-hidden">
      <h3 className="text-gray-900 font-semibold mb-3 px-2">Featured Products</h3>
      <div className="relative">
        <div className="flex gap-4">
          {products.slice(0, 6).map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="h-32 bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">
                  {product.name}
                </div>
                <div className="text-sm font-bold text-green-600">
                  ${product.price.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  +${product.commission} commission
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}