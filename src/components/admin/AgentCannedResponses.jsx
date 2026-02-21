import { useState, useEffect } from "react";
import { MessageSquare, Plus, Edit2, Trash2, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const DEFAULT_RESPONSES = [
  { category: "Reset Request", text: "I've reset your task counter. You can now continue with your next set of tasks. Good luck!" },
  { category: "Account Frozen", text: "Your account has been unfrozen and neutralized. You can now continue submitting tasks normally." },
  { category: "Balance Inquiry", text: "Your current balance is available in the 'My' section. For withdrawals, please complete both task sets first." },
  { category: "VIP Upgrade", text: "To upgrade your VIP level, you need to complete more tasks and maintain the required balance threshold." },
  { category: "Withdrawal Request", text: "Please complete both task sets before requesting a withdrawal. Ensure you have set up your transaction password." },
  { category: "Technical Issue", text: "I understand you're experiencing technical difficulties. Can you please provide more details or a screenshot?" },
  { category: "Working Hours", text: "Our platform operates from 9:00 AM to 11:00 PM Eastern Time (ET). We're here to assist you during these hours." },
  { category: "Premium Product", text: "Premium products offer 10x commission but will freeze your account temporarily. Contact support to unfreeze after submission." }
];

export default function AgentCannedResponses() {
  const [responses, setResponses] = useState(DEFAULT_RESPONSES);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ category: "", text: "" });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard");
  };

  const handleAdd = () => {
    if (!formData.category.trim() || !formData.text.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setResponses([...responses, formData]);
    setFormData({ category: "", text: "" });
    setShowAddModal(false);
    toast.success("Canned response added");
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(responses[index]);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!formData.category.trim() || !formData.text.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const updated = [...responses];
    updated[editingIndex] = formData;
    setResponses(updated);
    setFormData({ category: "", text: "" });
    setEditingIndex(null);
    setShowAddModal(false);
    toast.success("Response updated");
  };

  const handleDelete = (index) => {
    if (!confirm("Delete this canned response?")) return;
    setResponses(responses.filter((_, i) => i !== index));
    toast.success("Response deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Canned Responses</h2>
          <p className="text-sm text-gray-500 mt-1">Quick responses for common customer inquiries</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData({ category: "", text: "" });
            setEditingIndex(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Response
        </button>
      </div>

      <div className="grid gap-4">
        {responses.map((response, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{response.category}</h3>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{response.text}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(response.text)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(index)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {responses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No canned responses yet. Add your first one!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingIndex !== null ? "Edit Response" : "Add Canned Response"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Reset Request"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the response message..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingIndex(null);
                  setFormData({ category: "", text: "" });
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingIndex !== null ? handleUpdate : handleAdd}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {editingIndex !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}