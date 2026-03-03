import { useState, useEffect } from "react";
import { Search, Plus, Trash2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

export default function TaskAssignmentManager() {
  const [users, setUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, typesData, productsData, assignmentsData] = await Promise.all([
        backendClient.entities.AppUser.list("-created_date", 100),
        backendClient.entities.TaskType.filter({ isActive: true }),
        backendClient.entities.Product.filter({ isActive: true }),
        backendClient.entities.TaskAssignment.list("-created_date", 50)
      ]);
      setUsers(usersData);
      setTaskTypes(typesData);
      setProducts(productsData);
      setAssignments(assignmentsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedUser || !selectedTaskType || !selectedProduct) {
      toast.error("Please select all fields");
      return;
    }

    setAssigning(true);
    try {
      const dueAt = new Date(Date.now() + selectedTaskType.timeLimit * 60 * 60 * 1000).toISOString();

      // Create task offer
      const taskOffer = await backendClient.entities.TaskOffer.create({
        userId: selectedUser.id,
        productId: selectedProduct.id,
        status: "pending",
        expiresAt: dueAt,
        vipLevel: selectedUser.vipLevel
      });

      // Create task assignment
      await backendClient.entities.TaskAssignment.create({
        userId: selectedUser.id,
        taskOfferId: taskOffer.id,
        productId: selectedProduct.id,
        taskTypeId: selectedTaskType.id,
        assignmentType: "manual",
        assignedBy: (await backendClient.auth.me()).email,
        assignedAt: new Date().toISOString(),
        dueAt,
        status: "assigned",
        userVIPLevel: selectedUser.vipLevel,
        baseCommission: selectedTaskType.baseCommission,
        notes: "Manually assigned by admin"
      });

      toast.success("Task assigned successfully!");
      setShowAssignForm(false);
      setSelectedUser(null);
      setSelectedTaskType(null);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      toast.error("Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!confirm("Cancel this assignment?")) return;

    try {
      await backendClient.entities.TaskAssignment.update(assignmentId, {
        status: "cancelled"
      });
      toast.success("Assignment cancelled");
      loadData();
    } catch (error) {
      toast.error("Failed to cancel assignment");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "submitted":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredUsers = users.filter(u =>
    u.phone?.includes(searchTerm) || u.created_by?.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Manual Assignment Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Manually Assign Task</h3>
        {!showAssignForm ? (
          <button
            type="button"
            onClick={() => setShowAssignForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        ) : (
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
               <input
                 type="text"
                 placeholder="Search by phone or email..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
               <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  setSelectedUser(user);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select user...</option>
                {filteredUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.phone} - {u.vipLevel} ({u.tasksCompleted} tasks)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
              <select
                value={selectedTaskType?.id || ""}
                onChange={(e) => {
                  const type = taskTypes.find(t => t.id === e.target.value);
                  setSelectedTaskType(type);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select task type...</option>
                {taskTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.difficulty}) - ${t.baseCommission}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={selectedProduct?.id || ""}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleManualAssign}
                disabled={assigning || !selectedUser || !selectedTaskType || !selectedProduct}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {assigning ? "Assigning..." : "Assign Task"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedUser(null);
                  setSelectedTaskType(null);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Assignments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">User</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Task Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Commission</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Due</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.filter(a => ['assigned', 'in_progress', 'submitted'].includes(a.status)).map(assignment => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {users.find(u => u.id === assignment.userId)?.phone || "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    {taskTypes.find(t => t.id === assignment.taskTypeId)?.name || "N/A"}
                  </td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {getStatusIcon(assignment.status)}
                    <span className="capitalize">{assignment.status}</span>
                  </td>
                  <td className="px-4 py-2 font-semibold">${assignment.baseCommission}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    {assignment.status !== 'submitted' && (
                      <button
                        type="button"
                        onClick={() => handleCancelAssignment(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}