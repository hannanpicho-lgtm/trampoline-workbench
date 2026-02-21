import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Settings, Save, Plus, Trash2, Play, Pause, RefreshCw, Zap, Clock, Users, TrendingUp } from "lucide-react";

export default function TaskAssignmentConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [runningAssignment, setRunningAssignment] = useState(false);
  const [assignmentStats, setAssignmentStats] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.TaskAssignmentConfig.list();
      setConfigs(data);
    } catch (error) {
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config) => {
    try {
      if (config.id) {
        await base44.entities.TaskAssignmentConfig.update(config.id, config);
        toast.success("Configuration updated");
      } else {
        await base44.entities.TaskAssignmentConfig.create(config);
        toast.success("Configuration created");
      }
      setShowForm(false);
      setEditingConfig(null);
      loadConfigs();
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this configuration?")) return;
    try {
      await base44.entities.TaskAssignmentConfig.delete(id);
      toast.success("Configuration deleted");
      loadConfigs();
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await base44.entities.TaskAssignmentConfig.update(config.id, {
        isActive: !config.isActive
      });
      toast.success(config.isActive ? "Configuration disabled" : "Configuration enabled");
      loadConfigs();
    } catch (error) {
      toast.error("Failed to toggle configuration");
    }
  };

  const handleRunAssignment = async () => {
    setRunningAssignment(true);
    try {
      const result = await base44.functions.invoke("automatedTaskAssignment");
      setAssignmentStats(result.data);
      toast.success(`Assigned tasks to ${result.data.usersAssigned} users`);
      loadConfigs();
    } catch (error) {
      toast.error("Failed to run automated assignment");
    } finally {
      setRunningAssignment(false);
    }
  };

  const defaultConfig = {
    configName: "",
    vipLevel: "Bronze",
    tasksPerAssignment: 5,
    maxPendingTasks: 10,
    taskExpirationHours: 24,
    autoReassignOnRejection: true,
    difficultyWeighting: { easy: 40, medium: 35, hard: 20, expert: 5 },
    prioritizeActiveUsers: true,
    balanceBasedAssignment: true,
    userCapacityMultiplier: 1.0,
    isActive: true
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Automated Task Assignment</h2>
              <p className="text-sm text-gray-500">Configure intelligent task distribution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAssignment}
              disabled={runningAssignment}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {runningAssignment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Assignment Now
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingConfig(defaultConfig);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Configuration
            </button>
          </div>
        </div>

        {assignmentStats && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div>
              <div className="text-xs text-green-700 font-medium mb-1">Users Assigned</div>
              <div className="text-2xl font-bold text-green-900">{assignmentStats.usersAssigned}</div>
            </div>
            <div>
              <div className="text-xs text-green-700 font-medium mb-1">Tasks Assigned</div>
              <div className="text-2xl font-bold text-green-900">{assignmentStats.tasksAssigned}</div>
            </div>
            <div>
              <div className="text-xs text-green-700 font-medium mb-1">Expired Reassigned</div>
              <div className="text-2xl font-bold text-orange-900">{assignmentStats.expiredReassigned || 0}</div>
            </div>
            <div>
              <div className="text-xs text-green-700 font-medium mb-1">Rejected Reassigned</div>
              <div className="text-2xl font-bold text-red-900">{assignmentStats.rejectedReassigned || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Configurations List */}
      <div className="grid gap-4">
        {configs.map(config => (
          <div key={config.id} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  config.isActive ? "bg-green-100" : "bg-gray-100"
                }`}>
                  <Zap className={`w-5 h-5 ${config.isActive ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{config.configName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {config.vipLevel}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      config.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {config.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(config)}
                  className={`p-2 rounded-lg transition-colors ${
                    config.isActive 
                      ? "text-orange-600 hover:bg-orange-50" 
                      : "text-green-600 hover:bg-green-50"
                  }`}
                  title={config.isActive ? "Disable" : "Enable"}
                >
                  {config.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingConfig(config);
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(config.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Tasks/Assignment</div>
                  <div className="text-sm font-semibold text-gray-900">{config.tasksPerAssignment}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Max Pending</div>
                  <div className="text-sm font-semibold text-gray-900">{config.maxPendingTasks}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Expiration</div>
                  <div className="text-sm font-semibold text-gray-900">{config.taskExpirationHours}h</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Capacity</div>
                  <div className="text-sm font-semibold text-gray-900">{config.userCapacityMultiplier}x</div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs">
              <span className={`flex items-center gap-1 ${config.autoReassignOnRejection ? "text-green-600" : "text-gray-400"}`}>
                {config.autoReassignOnRejection ? "✓" : "✗"} Auto-reassign rejected
              </span>
              <span className={`flex items-center gap-1 ${config.prioritizeActiveUsers ? "text-green-600" : "text-gray-400"}`}>
                {config.prioritizeActiveUsers ? "✓" : "✗"} Prioritize active users
              </span>
              <span className={`flex items-center gap-1 ${config.balanceBasedAssignment ? "text-green-600" : "text-gray-400"}`}>
                {config.balanceBasedAssignment ? "✓" : "✗"} Balance-based
              </span>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No configurations yet</p>
            <button
              type="button"
              onClick={() => {
                setEditingConfig(defaultConfig);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Create First Configuration
            </button>
          </div>
        )}
      </div>

      {/* Configuration Form Modal */}
      {showForm && editingConfig && (
        <ConfigForm
          config={editingConfig}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

function ConfigForm({ config, onSave, onClose }) {
  const [formData, setFormData] = useState(config);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {config.id ? "Edit Configuration" : "New Configuration"}
          </h3>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
              <input
                type="text"
                value={formData.configName}
                onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bronze Auto-Assignment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VIP Level</label>
              <select
                value={formData.vipLevel}
                onChange={(e) => setFormData({ ...formData, vipLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
                <option value="Diamond">Diamond</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Per Assignment</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.tasksPerAssignment}
                onChange={(e) => setFormData({ ...formData, tasksPerAssignment: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Pending Tasks</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.maxPendingTasks}
                onChange={(e) => setFormData({ ...formData, maxPendingTasks: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration (hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={formData.taskExpirationHours}
                onChange={(e) => setFormData({ ...formData, taskExpirationHours: parseInt(e.target.value) || 24 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Capacity Multiplier</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="3.0"
              value={formData.userCapacityMultiplier}
              onChange={(e) => setFormData({ ...formData, userCapacityMultiplier: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">1.0 = normal, 1.5 = 50% more capacity</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoReassignOnRejection}
                onChange={(e) => setFormData({ ...formData, autoReassignOnRejection: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Auto-reassign rejected tasks</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.prioritizeActiveUsers}
                onChange={(e) => setFormData({ ...formData, prioritizeActiveUsers: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Prioritize active users</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.balanceBasedAssignment}
                onChange={(e) => setFormData({ ...formData, balanceBasedAssignment: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Consider balance for eligibility</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Active configuration</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}