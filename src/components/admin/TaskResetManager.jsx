import { useState, useEffect } from "react";
import { RefreshCw, Search, CheckCircle, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TaskResetManager() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState("full");

  useEffect(() => {
    loadUsersNeedingReset();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.created_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.invitationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsersNeedingReset = async () => {
    setLoading(true);
    try {
      const usersData = await backendClient.entities.AppUser.list("-created_date", 200);
      // Filter to show users either needing reset or close to task limit
      const filtered = usersData.filter(u => 
        u.needsReset || (u.tasksInCurrentSet >= 35)
      );
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleResetTasks = async () => {
    if (!selectedUser) return;

    setResetting(selectedUser.id);
    try {
      const response = await base44.functions.invoke('resetUserTasks', {
        userId: selectedUser.id,
        resetType: resetType
      });

      if (response.data.success) {
        // Auto-assign tasks after reset
        try {
          await base44.functions.invoke('autoAssignTasksAfterReset', { userId: selectedUser.id });
        } catch (assignError) {
          console.error("Failed to auto-assign tasks:", assignError);
        }

        toast.success("Tasks reset successfully!", {
          description: `${selectedUser.phone} - ${resetType} reset with new tasks assigned`
        });
        setShowResetModal(false);
        setSelectedUser(null);
        setResetType("full");
        loadUsersNeedingReset();
      } else {
        toast.error("Reset failed", { description: response.data.error });
      }
    } catch (error) {
      toast.error("Reset failed", { description: error.message });
    } finally {
      setResetting(null);
    }
  };

  const getResetTypeDescription = (type) => {
    switch (type) {
      case "full":
        return "Clear current set (0/40), increment sets completed, clear reset flag";
      case "partial":
        return "Only clear 'needs reset' flag, keep current progress";
      case "custom":
        return "Manually set task counts and flags";
      default:
        return "";
    }
  };

  const stats = {
    needsReset: users.filter(u => u.needsReset).length,
    almostFull: users.filter(u => !u.needsReset && u.tasksInCurrentSet >= 35).length,
    completed2Sets: users.filter(u => u.taskSetsCompleted >= 2).length
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading users...</div>;
  }

  return (
    <>
      {/* Reset Confirmation Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset User Tasks</h3>
            <p className="text-sm text-gray-600 mb-4">
              User: <span className="font-semibold">{selectedUser.phone}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-medium mb-2">Reset Type</p>
              <div className="space-y-2">
                {["full", "partial", "custom"].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value={type}
                      checked={resetType === type}
                      onChange={(e) => setResetType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{type} Reset</div>
                      <div className="text-xs text-gray-600">{getResetTypeDescription(type)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Current Status:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Tasks in set: {selectedUser.tasksInCurrentSet}/40</li>
                    <li>Sets completed: {selectedUser.taskSetsCompleted}/2</li>
                    <li>Needs reset: {selectedUser.needsReset ? "Yes" : "No"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                  setResetType("full");
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetTasks}
                disabled={resetting === selectedUser.id}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {resetting === selectedUser.id ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Task Reset Manager</h2>
          <button
            type="button"
            onClick={loadUsersNeedingReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Needs Reset</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.needsReset}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Almost Full</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.almostFull}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Completed 2 Sets</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completed2Sets}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks In Set</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sets Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users requiring reset
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.phone || "N/A"}</div>
                          <div className="text-xs text-gray-500">{user.created_by}</div>
                          <div className="text-xs text-gray-400">Code: {user.invitationCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                user.tasksInCurrentSet >= 35
                                  ? "bg-red-500"
                                  : user.tasksInCurrentSet >= 25
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${(user.tasksInCurrentSet / 40) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {user.tasksInCurrentSet}/40
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.taskSetsCompleted || 0} / 2
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.needsReset && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3" />
                              Needs Reset
                            </span>
                          )}
                          {user.tasksInCurrentSet >= 35 && !user.needsReset && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3" />
                              Nearly Full
                            </span>
                          )}
                          {user.taskSetsCompleted >= 2 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                              <TrendingUp className="w-3 h-3" />
                              Max Reached
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetModal(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Reset Types Explained:</p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <span className="font-medium">Full Reset:</span> Clears current set, increments sets completed (used when user completes 40 tasks)
            </li>
            <li>
              <span className="font-medium">Partial Reset:</span> Only clears "needs reset" flag without affecting task counts
            </li>
            <li>
              <span className="font-medium">Custom Reset:</span> Manually set specific task counts (use when corrections are needed)
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}