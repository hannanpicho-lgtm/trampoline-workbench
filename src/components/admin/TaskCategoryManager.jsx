import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';

export default function TaskCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showPriorityForm, setShowPriorityForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPriority, setEditingPriority] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '📋',
    displayOrder: 0
  });

  const [priorityForm, setPriorityForm] = useState({
    name: '',
    level: 1,
    color: '#6b7280',
    multiplier: 1.0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, prioritiesData] = await Promise.all([
        backendClient.entities.TaskCategory.list('displayOrder'),
        backendClient.entities.TaskPriority.list('level')
      ]);
      setCategories(categoriesData);
      setPriorities(prioritiesData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await backendClient.entities.TaskCategory.update(editingCategory.id, categoryForm);
        toast.success('Category updated');
      } else {
        await backendClient.entities.TaskCategory.create(categoryForm);
        toast.success('Category created');
      }
      resetCategoryForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleSavePriority = async () => {
    if (!priorityForm.name) {
      toast.error('Priority name is required');
      return;
    }

    try {
      if (editingPriority) {
        await backendClient.entities.TaskPriority.update(editingPriority.id, priorityForm);
        toast.success('Priority updated');
      } else {
        await backendClient.entities.TaskPriority.create(priorityForm);
        toast.success('Priority created');
      }
      resetPriorityForm();
      loadData();
    } catch (error) {
      toast.error('Failed to save priority');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await backendClient.entities.TaskCategory.delete(id);
      toast.success('Category deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleDeletePriority = async (id) => {
    if (!confirm('Delete this priority?')) return;
    try {
      await backendClient.entities.TaskPriority.delete(id);
      toast.success('Priority deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete priority');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', color: '#3b82f6', icon: '📋', displayOrder: 0 });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetPriorityForm = () => {
    setPriorityForm({ name: '', level: 1, color: '#6b7280', multiplier: 1.0 });
    setEditingPriority(null);
    setShowPriorityForm(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Task Categories & Priorities</h2>
        <p className="text-gray-600 mt-1">Configure task organization and priority levels</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{cat.name}</div>
                  {cat.description && <div className="text-sm text-gray-600">{cat.description}</div>}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryForm(cat);
                      setShowCategoryForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Priorities</h3>
            <button
              type="button"
              onClick={() => setShowPriorityForm(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Priority
            </button>
          </div>

          <div className="space-y-2">
            {priorities.map(pri => (
              <div key={pri.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pri.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{pri.name}</div>
                  <div className="text-sm text-gray-600">
                    Level: {pri.level} • {pri.multiplier}x commission
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriority(pri);
                      setPriorityForm(pri);
                      setShowPriorityForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePriority(pri.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingCategory ? 'Edit' : 'New'} Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-full h-10 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={resetCategoryForm}
                className="flex-1 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Form Modal */}
      {showPriorityForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingPriority ? 'Edit' : 'New'} Priority</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={priorityForm.name}
                  onChange={(e) => setPriorityForm({ ...priorityForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Level *</label>
                  <input
                    type="number"
                    value={priorityForm.level}
                    onChange={(e) => setPriorityForm({ ...priorityForm, level: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={priorityForm.multiplier}
                    onChange={(e) => setPriorityForm({ ...priorityForm, multiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  value={priorityForm.color}
                  onChange={(e) => setPriorityForm({ ...priorityForm, color: e.target.value })}
                  className="w-full h-10 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={resetPriorityForm}
                className="flex-1 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePriority}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}