import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Power, RefreshCw, AlertCircle } from "lucide-react";

export default function AutoResetSettings() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    ruleName: "",
    description: "",
    triggerType: "task_sets_completed",
    triggerValue: 2,
    resetType: "full",
    vipLevels: [],
    isActive: true,
    sendNotification: true,
    sendWarning: false,
    autoAssignTasks: false,
    notifySupport: false
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const rulesData = await base44.entities.AutoResetRule.list("-created_date");
      setRules(rulesData);
    } catch (error) {
      toast.error("Failed to load auto-reset rules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await base44.entities.AutoResetRule.update(editingRule.id, formData);
        toast.success("Rule updated successfully");
      } else {
        await base44.entities.AutoResetRule.create(formData);
        toast.success("Rule created successfully");
      }
      resetForm();
      loadRules();
    } catch (error) {
      toast.error("Failed to save rule");
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      description: rule.description || "",
      triggerType: rule.triggerType,
      triggerValue: rule.triggerValue,
      resetType: rule.resetType,
      vipLevels: rule.vipLevels || [],
      isActive: rule.isActive,
      sendNotification: rule.sendNotification,
      sendWarning: rule.sendWarning || false,
      autoAssignTasks: rule.autoAssignTasks || false,
      notifySupport: rule.notifySupport || false
    });
    setShowForm(true);
  };

  const handleDelete = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    
    try {
      await base44.entities.AutoResetRule.delete(ruleId);
      toast.success("Rule deleted successfully");
      loadRules();
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await base44.entities.AutoResetRule.update(rule.id, {
        isActive: !rule.isActive
      });
      toast.success(`Rule ${!rule.isActive ? "activated" : "deactivated"}`);
      loadRules();
    } catch (error) {
      toast.error("Failed to toggle rule");
    }
  };

  const handleManualTrigger = async (ruleId) => {
    if (!confirm("Manually trigger this rule now? This will check all users against this rule.")) return;
    
    try {
      const result = await base44.functions.invoke("autoResetProcessor", {
        ruleId,
        manualTrigger: true
      });
      toast.success(`Reset triggered! ${result.data.affectedUsers} users processed`);
      loadRules();
    } catch (error) {
      toast.error("Failed to trigger reset");
    }
  };

  const resetForm = () => {
    setFormData({
      ruleName: "",
      description: "",
      triggerType: "task_sets_completed",
      triggerValue: 2,
      resetType: "full",
      vipLevels: [],
      isActive: true,
      sendNotification: true,
      sendWarning: false,
      autoAssignTasks: false,
      notifySupport: false
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const getTriggerDescription = (rule) => {
    switch (rule.triggerType) {
      case "task_sets_completed":
        return `After ${rule.triggerValue} task sets completed`;
      case "inactivity_period":
        return `After ${rule.triggerValue} days of inactivity`;
      case "credit_score_drop":
        return `When credit score drops below ${rule.triggerValue}%`;
      case "completion_rate_low":
        return `When completion rate below ${rule.triggerValue}%`;
      case "stuck_in_set":
        return `Stuck in set for ${rule.triggerValue}+ days`;
      default:
        return "Unknown trigger";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Auto-Reset Rules</h2>
          <p className="text-sm text-gray-500 mt-1">Configure automatic task reset triggers for users</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How Auto-Reset Works</p>
          <p>Rules are checked every 15 minutes by a background process. When a rule's conditions are met, the system automatically resets the user's tasks and sends a notification if enabled.</p>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Auto-Reset Rules</h3>
          <p className="text-gray-500 mb-4">Create your first rule to automate task resets</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Create Rule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                rule.isActive ? "border-green-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{rule.ruleName}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                      {getTriggerDescription(rule)}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                      Reset: {rule.resetType}
                    </span>
                    {rule.vipLevels?.length > 0 && (
                      <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg font-medium">
                        VIP: {rule.vipLevels.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualTrigger(rule.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Trigger Now"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(rule)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={rule.isActive ? "Deactivate" : "Activate"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Users Affected</div>
                  <div className="text-lg font-bold text-gray-900">{rule.usersAffected || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Notifications</div>
                  <div className="text-sm font-medium text-gray-900">
                    {rule.sendNotification ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last Processed</div>
                  <div className="text-sm font-medium text-gray-900">
                    {rule.lastProcessed
                      ? new Date(rule.lastProcessed).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingRule ? "Edit Rule" : "Create New Rule"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                  <select
                    value={formData.triggerType}
                    onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="task_sets_completed">Task Sets Completed</option>
                    <option value="inactivity_period">Inactivity Period</option>
                    <option value="credit_score_drop">Credit Score Drop</option>
                    <option value="completion_rate_low">Completion Rate Low</option>
                    <option value="stuck_in_set">Stuck in Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Value</label>
                  <input
                    type="number"
                    value={formData.triggerValue}
                    onChange={(e) => setFormData({ ...formData, triggerValue: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Type</label>
                <select
                  value={formData.resetType}
                  onChange={(e) => setFormData({ ...formData, resetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Full Reset</option>
                  <option value="partial">Partial Reset</option>
                  <option value="soft">Soft Reset</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendNotification}
                    onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Send Notification</span>
                </label>
              </div>

              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Advanced Options</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendWarning !== false}
                    onChange={(e) => setFormData({ ...formData, sendWarning: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Send warning 24h before reset</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoAssignTasks !== false}
                    onChange={(e) => setFormData({ ...formData, autoAssignTasks: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-assign tasks after reset</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notifySupport || false}
                    onChange={(e) => setFormData({ ...formData, notifySupport: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Notify support team of resets</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}