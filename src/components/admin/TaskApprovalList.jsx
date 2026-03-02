import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

export default function TaskApprovalList() {
  const [tasks, setTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, productsData, usersData] = await Promise.all([
        backendClient.entities.UserTask.filter({ status: "pending" }, "-created_date", 50),
        backendClient.entities.Product.list(),
        backendClient.entities.AppUser.list()
      ]);
      setTasks(tasksData);
      setProducts(productsData);
      setUsers(usersData);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (productId) => products.find(p => p.id === productId);
  const getUser = (userId) => users.find(u => u.id === userId);

  const handleApprove = async (task) => {
    try {
      await backendClient.entities.UserTask.update(task.id, {
        status: "approved",
        approvedAt: new Date().toISOString()
      });
      toast.success("Task approved!");
      loadData();
    } catch (error) {
      toast.error("Failed to approve task");
    }
  };

  const handleReject = async (task) => {
    if (!confirm("Reject this task?")) return;
    
    try {
      await backendClient.entities.UserTask.update(task.id, {
        status: "rejected"
      });
      toast.success("Task rejected");
      loadData();
    } catch (error) {
      toast.error("Failed to reject task");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Task Approvals</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pending tasks</div>
        ) : (
          tasks.map((task) => {
            const product = getProduct(task.productId);
            const user = getUser(task.userId);
            
            return (
              <div key={task.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
                      {product?.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">📦</div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{product?.name || "Unknown Product"}</div>
                      <div className="text-sm text-gray-500 mt-1">User: {user?.phone || "Unknown"}</div>
                      <div className="text-sm text-gray-500">Commission: ${task.commission?.toFixed(2) || "0.00"}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(task.created_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(task)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(task)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}