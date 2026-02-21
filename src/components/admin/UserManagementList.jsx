import React, { useState, useEffect } from "react";
import { Search, Edit, RefreshCw, ChevronDown, Eye, Filter, X, Download, CheckSquare, Square, Trash2, Users as UsersIcon, ArrowUpDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import EditUserModal from "./EditUserModal";
import UserRoleAssignment from "./UserRoleAssignment";
import UserDetailsModal from "./UserDetailsModal";

export default function UserManagementList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [filterVipLevel, setFilterVipLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortField, setSortField] = useState("created_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => 
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.invitationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply VIP level filter
    if (filterVipLevel !== "all") {
      filtered = filtered.filter(user => (user.vipLevel || "Bronze") === filterVipLevel);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "needs_reset") {
        filtered = filtered.filter(user => user.needsReset);
      } else if (filterStatus === "active") {
        filtered = filtered.filter(user => !user.isDeactivated && !user.needsReset);
      } else if (filterStatus === "deactivated") {
        filtered = filtered.filter(user => user.isDeactivated);
      } else if (filterStatus === "frozen") {
        filtered = filtered.filter(user => user.isFrozen);
      }
    }

    // Apply date range filter
    let matchesDate = true;
    if (dateFrom) {
      filtered = filtered.filter(user => new Date(user.created_date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(user => new Date(user.created_date) <= new Date(dateTo + 'T23:59:59'));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "balance" || sortField === "tasksCompleted" || sortField === "creditScore") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users, filterVipLevel, filterStatus, sortField, sortDirection]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await base44.entities.AppUser.list("-created_date", 500);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleResetTasks = async (user) => {
    if (!confirm(`Reset tasks for user ${user.phone}?`)) return;

    try {
      await base44.functions.invoke('resetUserTasks', {
        userId: user.id,
        resetType: 'full'
      });
      toast.success("Tasks reset successfully!");
      loadUsers();
    } catch (error) {
      toast.error("Failed to reset tasks");
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setFilterVipLevel("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkReset = async () => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    if (!confirm(`Reset tasks for ${selectedUsers.length} users?`)) return;

    try {
      for (const userId of selectedUsers) {
        await base44.functions.invoke('resetUserTasks', {
          userId,
          resetType: 'full'
        });
      }
      toast.success(`Tasks reset for ${selectedUsers.length} users!`);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      toast.error("Failed to reset tasks");
    }
  };

  const handleBulkVIPUpdate = async (newLevel) => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    if (!confirm(`Update ${selectedUsers.length} users to ${newLevel} VIP?`)) return;

    try {
      for (const userId of selectedUsers) {
        await base44.entities.AppUser.update(userId, { vipLevel: newLevel });
      }
      toast.success(`Updated ${selectedUsers.length} users to ${newLevel}!`);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      toast.error("Failed to update VIP levels");
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

    try {
      await base44.entities.AppUser.update(userId, {
        isDeactivated: !currentStatus
      });
      toast.success(`User ${action}d successfully`);
      loadUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    if (!confirm('Send password reset email to this user?')) return;

    try {
      await base44.functions.invoke('sendPasswordReset', { email: userEmail });
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error('Failed to send password reset email');
    }
  };

  const handleExportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      Phone: user.phone || "",
      Email: user.created_by,
      VIPLevel: user.vipLevel || "Bronze",
      Balance: user.balance || 0,
      TasksCompleted: user.tasksCompleted || 0,
      CreditScore: user.creditScore || 100,
      InvitationCode: user.invitationCode,
      CreatedDate: new Date(user.created_date).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Users exported successfully");
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading users...</div>;
  }

  return (
    <>
      <EditUserModal 
        show={showEditModal}
        user={selectedUser}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />
      
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onUpdate={loadUsers}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {/* Header Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <span className="text-sm text-gray-500">({filteredUsers.length} users)</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Bulk Actions ({selectedUsers.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleExportUsers}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={loadUsers}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="p-4 bg-purple-50 border-b border-purple-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-purple-900">{selectedUsers.length} users selected:</span>
              <button
                type="button"
                onClick={handleBulkReset}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
              >
                Reset Tasks
              </button>
              <button
                type="button"
                onClick={() => handleBulkVIPUpdate("Silver")}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
              >
                Set to Silver
              </button>
              <button
                type="button"
                onClick={() => handleBulkVIPUpdate("Gold")}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
              >
                Set to Gold
              </button>
              <button
                type="button"
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-medium ml-auto"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone, email, or invitation code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                showFilters ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">VIP Level</label>
                <select
                  value={filterVipLevel}
                  onChange={(e) => setFilterVipLevel(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                  <option value="needs_reset">Needs Reset</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="created_date">Join Date</option>
                  <option value="balance">Balance</option>
                  <option value="tasksCompleted">Tasks</option>
                  <option value="creditScore">Credit Score</option>
                  <option value="vipLevel">VIP Level</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">Order</label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {(filterVipLevel !== "all" || filterStatus !== "all" || searchTerm || dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 mt-auto"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}

              <div className="ml-auto mt-auto">
                <span className="text-sm text-gray-600">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("created_date")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    User
                    {sortField === "created_date" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("vipLevel")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    VIP Level
                    {sortField === "vipLevel" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("balance")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    Balance
                    {sortField === "balance" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("tasksCompleted")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    Tasks
                    {sortField === "tasksCompleted" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("creditScore")}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700"
                  >
                    Credit
                    {sortField === "creditScore" && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleUserSelection(user.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {selectedUsers.includes(user.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedUserId === user.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.phone || "N/A"}</div>
                      <div className="text-sm text-gray-500">{user.created_by}</div>
                      <div className="text-xs text-gray-400">Code: {user.invitationCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.vipLevel || "Bronze"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${(user.balance || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{user.tasksCompleted || 0} completed</div>
                    <div className="text-xs text-gray-500">{user.tasksInCurrentSet || 0}/35 in set</div>
                    {user.needsReset && (
                      <span className="text-xs text-orange-600 font-medium">Needs Reset</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${user.creditScore || 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{user.creditScore || 100}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isDeactivated ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Deactivated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(user)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.needsReset && (
                        <button
                          type="button"
                          onClick={() => handleResetTasks(user)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Reset Tasks"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user.id, user.isDeactivated)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isDeactivated 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={user.isDeactivated ? "Activate Account" : "Deactivate Account"}
                      >
                        {user.isDeactivated ? '✓' : '✕'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(user.id, user.created_by)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-bold"
                        title="Send Password Reset Email"
                      >
                        🔑
                      </button>
                    </div>
                  </td>
                  </tr>
                  {expandedUserId === user.id && (
                   <tr className="bg-gray-50 border-b border-gray-200">
                     <td colSpan={7} className="px-6 py-4">
                       <UserRoleAssignment userId={user.id} userEmail={user.created_by} />
                     </td>
                   </tr>
                  )}
                  </React.Fragment>
                  ))}
                  </tbody>
                  </table>
                  </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </>
  );
}