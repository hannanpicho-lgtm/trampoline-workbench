import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Package, Award } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function TaskSetManager() {
  const [taskSets, setTaskSets] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingSet, setEditingSet] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vipLevel: "Bronze",
    productIds: [],
    minTasks: 30,
    maxTasks: 40,
    isActive: true,
    priority: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sets, prods] = await Promise.all([
        base44.entities.TaskSet.list("-priority"),
        base44.entities.Product.filter({ isActive: true })
      ]);
      setTaskSets(sets);
      setProducts(prods);
    } catch (error) {
      toast.error("Failed to load task sets");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.vipLevel || formData.productIds.length === 0) {
        toast.error("Please fill required fields");
        return;
      }

      if (editingSet) {
        await base44.entities.TaskSet.update(editingSet.id, formData);
        toast.success("Task set updated");
      } else {
        await base44.entities.TaskSet.create(formData);
        toast.success("Task set created");
      }

      resetForm();
      loadData();
    } catch (error) {
      toast.error("Failed to save task set");
    }
  };

  const handleEdit = (set) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      description: set.description || "",
      vipLevel: set.vipLevel,
      productIds: set.productIds || [],
      minTasks: set.minTasks || 30,
      maxTasks: set.maxTasks || 40,
      isActive: set.isActive !== false,
      priority: set.priority || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task set?")) return;
    try {
      await base44.entities.TaskSet.delete(id);
      toast.success("Task set deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete task set");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      vipLevel: "Bronze",
      productIds: [],
      minTasks: 30,
      maxTasks: 40,
      isActive: true,
      priority: 0
    });
    setEditingSet(null);
    setShowForm(false);
  };

  const toggleProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const vipLevels = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const vipColors = {
    Bronze: "bg-orange-100 text-orange-800 border-orange-300",
    Silver: "bg-gray-100 text-gray-800 border-gray-300",
    Gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Platinum: "bg-blue-100 text-blue-800 border-blue-300",
    Diamond: "bg-purple-100 text-purple-800 border-purple-300"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Task Set Management</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Task Set
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingSet ? "Edit Task Set" : "Create Task Set"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Bronze Starter Set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Describe this task set..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">VIP Level *</label>
                  <select
                    value={formData.vipLevel}
                    onChange={(e) => setFormData({ ...formData, vipLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {vipLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Tasks</label>
                  <input
                    type="number"
                    value={formData.minTasks}
                    onChange={(e) => setFormData({ ...formData, minTasks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Tasks</label>
                  <input
                    type="number"
                    value={formData.maxTasks}
                    onChange={(e) => setFormData({ ...formData, maxTasks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Products * ({formData.productIds.length} selected)
                </label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {products.map(product => (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.productIds.includes(product.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            ${product.price} • Commission: ${product.commission}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.productIds.includes(product.id)}
                          readOnly
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {editingSet ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Sets List */}
      <div className="grid gap-4">
        {taskSets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No task sets created yet</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Create First Task Set
            </Button>
          </div>
        ) : (
          taskSets.map(set => (
            <div key={set.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{set.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${vipColors[set.vipLevel]}`}>
                      {set.vipLevel}
                    </span>
                    {!set.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {set.description && (
                    <p className="text-sm text-gray-600 mb-2">{set.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📦 {set.productIds?.length || 0} products</span>
                    <span>📊 {set.minTasks}-{set.maxTasks} tasks</span>
                    <span>⭐ Priority: {set.priority || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(set)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}