import { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Crown, Plus, Edit, Trash2, CheckCircle, XCircle, TrendingUp } from "lucide-react";

const VIP_LEVELS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

const VIP_BENEFITS = {
  "Bronze": "Basic tasks, 0.5% commission",
  "Silver": "More tasks, 1.0% commission",
  "Gold": "Premium tasks, 1.5% commission",
  "Platinum": "High-value tasks, 2.0% commission",
  "Diamond": "Exclusive tasks, 2.5% commission"
};

export default function VIPUpgradeManager() {
  const [rules, setRules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    fromLevel: "Bronze",
    toLevel: "Silver",
    requirementType: "both",
    minBalance: 500,
    minTasksCompleted: 30,
    upgradeFee: 0,
    autoUpgrade: false,
    isActive: true,
    description: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, requestsData] = await Promise.all([
        backendClient.entities.VIPUpgradeRule.list("-created_date"),
        backendClient.entities.VIPUpgradeRequest.list("-created_date")
      ]);
      setRules(rulesData);
      setRequests(requestsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await backendClient.entities.VIPUpgradeRule.update(editingRule.id, formData);
        toast.success("Rule updated");
      } else {
        await backendClient.entities.VIPUpgradeRule.create(formData);
        toast.success("Rule created");
      }
      resetForm();
      loadData();
    } catch (error) {
      toast.error("Failed to save rule");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm("Delete this upgrade rule?")) return;
    try {
      await backendClient.entities.VIPUpgradeRule.delete(ruleId);
      toast.success("Rule deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      await base44.functions.invoke("processVIPUpgrade", {
        requestId: request.id,
        action: "approve"
      });
      toast.success("Upgrade approved!");
      loadData();
    } catch (error) {
      toast.error("Failed to approve upgrade");
    }
  };

  const handleRejectRequest = async (request) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    
    try {
      await base44.functions.invoke("processVIPUpgrade", {
        requestId: request.id,
        action: "reject",
        reason
      });
      toast.success("Request rejected");
      loadData();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const resetForm = () => {
    setFormData({
      fromLevel: "Bronze",
      toLevel: "Silver",
      requirementType: "both",
      minBalance: 500,
      minTasksCompleted: 30,
      upgradeFee: 0,
      autoUpgrade: false,
      isActive: true,
      description: ""
    });
    setEditingRule(null);
    setShowRuleForm(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">VIP Upgrade Management</h2>
          <p className="text-sm text-gray-500 mt-1">Configure upgrade requirements and approve requests</p>
        </div>
        <button
          type="button"
          onClick={() => setShowRuleForm(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Upgrade Rule
        </button>
      </div>

      {/* Pending Requests */}
      {requests.filter(r => r.status === "pending").length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Pending Upgrade Requests
          </h3>
          <div className="space-y-3">
            {requests.filter(r => r.status === "pending").map((request) => (
              <div key={request.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{request.created_by}</span>
                      <span className="text-gray-400">→</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium">
                        {request.currentLevel}
                      </span>
                      <span className="text-gray-400">to</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                        {request.requestedLevel}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Balance: ${request.currentBalance?.toFixed(2)} • Tasks: {request.currentTasksCompleted}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(request)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Approve"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(request)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Rules */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Upgrade Rules</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {rules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No upgrade rules configured</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        {rule.fromLevel}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                        {rule.toLevel}
                      </span>
                      {!rule.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Inactive
                        </span>
                      )}
                      {rule.autoUpgrade && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Auto-upgrade
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {rule.requirementType === "balance" && (
                        <div>Min Balance: ${rule.minBalance?.toLocaleString()}</div>
                      )}
                      {rule.requirementType === "tasks_completed" && (
                        <div>Min Tasks: {rule.minTasksCompleted}</div>
                      )}
                      {rule.requirementType === "both" && (
                        <div>Min Balance: ${rule.minBalance?.toLocaleString()} • Min Tasks: {rule.minTasksCompleted}</div>
                      )}
                      {rule.requirementType === "manual_approval" && (
                        <div>Requires admin approval</div>
                      )}
                      {rule.upgradeFee > 0 && (
                        <div className="text-amber-600">Upgrade Fee: ${rule.upgradeFee}</div>
                      )}
                      {rule.description && (
                        <div className="text-gray-500 italic">{rule.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRule(rule);
                        setFormData(rule);
                        setShowRuleForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingRule ? "Edit" : "Create"} Upgrade Rule
            </h3>

            <form onSubmit={handleSubmitRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Level</label>
                  <select
                    value={formData.fromLevel}
                    onChange={(e) => setFormData({ ...formData, fromLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {VIP_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Level</label>
                  <select
                    value={formData.toLevel}
                    onChange={(e) => setFormData({ ...formData, toLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {VIP_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Type</label>
                <select
                  value={formData.requirementType}
                  onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="balance">Balance Only</option>
                  <option value="tasks_completed">Tasks Only</option>
                  <option value="both">Both Balance & Tasks</option>
                  <option value="manual_approval">Manual Approval</option>
                </select>
              </div>

              {(formData.requirementType === "balance" || formData.requirementType === "both") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Balance ($)</label>
                  <input
                    type="number"
                    value={formData.minBalance}
                    onChange={(e) => setFormData({ ...formData, minBalance: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}

              {(formData.requirementType === "tasks_completed" || formData.requirementType === "both") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Tasks Completed</label>
                  <input
                    type="number"
                    value={formData.minTasksCompleted}
                    onChange={(e) => setFormData({ ...formData, minTasksCompleted: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upgrade Fee ($)</label>
                <input
                  type="number"
                  value={formData.upgradeFee}
                  onChange={(e) => setFormData({ ...formData, upgradeFee: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Benefits)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="e.g., Unlock premium tasks, 1.5% commission rate"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.autoUpgrade}
                    onChange={(e) => setFormData({ ...formData, autoUpgrade: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-upgrade when requirements met</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
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
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  {editingRule ? "Update" : "Create"} Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}