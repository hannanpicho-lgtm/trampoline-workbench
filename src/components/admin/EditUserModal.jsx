import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function EditUserModal({ show, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    balance: 0,
    vipLevel: "Bronze",
    creditScore: 100,
    tasksCompleted: 0,
    tasksInCurrentSet: 0,
    taskSetsCompleted: 0,
    needsReset: false,
    isFrozen: false,
    frozenBalance: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        balance: user.balance || 0,
        vipLevel: user.vipLevel || "Bronze",
        creditScore: user.creditScore || 100,
        tasksCompleted: user.tasksCompleted || 0,
        tasksInCurrentSet: user.tasksInCurrentSet || 0,
        taskSetsCompleted: user.taskSetsCompleted || 0,
        needsReset: user.needsReset || false,
        isFrozen: user.isFrozen || false,
        frozenBalance: user.frozenBalance || 0
      });
    }
  }, [user]);

  if (!show || !user) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await base44.entities.AppUser.update(user.id, formData);
      toast.success("User updated successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Balance (USD)</label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIP Level</label>
            <select
              value={formData.vipLevel}
              onChange={(e) => setFormData({ ...formData, vipLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.creditScore}
              onChange={(e) => setFormData({ ...formData, creditScore: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed</label>
            <input
              type="number"
              value={formData.tasksCompleted}
              onChange={(e) => setFormData({ ...formData, tasksCompleted: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasks in Current Set</label>
            <input
              type="number"
              value={formData.tasksInCurrentSet}
              onChange={(e) => setFormData({ ...formData, tasksInCurrentSet: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Sets Completed</label>
            <input
              type="number"
              value={formData.taskSetsCompleted}
              onChange={(e) => setFormData({ ...formData, taskSetsCompleted: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="needsReset"
                checked={formData.needsReset}
                onChange={(e) => setFormData({ ...formData, needsReset: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="needsReset" className="text-sm font-medium text-gray-700">Needs Reset</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFrozen"
                checked={formData.isFrozen}
                onChange={(e) => setFormData({ ...formData, isFrozen: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="isFrozen" className="text-sm font-medium text-gray-700">Account Frozen</label>
            </div>
          </div>

          {formData.isFrozen && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frozen Balance</label>
              <input
                type="number"
                step="0.01"
                value={formData.frozenBalance}
                onChange={(e) => setFormData({ ...formData, frozenBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}