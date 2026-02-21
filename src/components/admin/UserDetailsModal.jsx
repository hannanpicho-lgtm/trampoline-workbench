import { useState, useEffect } from "react";
import { X, User, Award, DollarSign, Activity, Clock, MapPin, Shield, Edit2, Flame, Target, Unlock, Crown, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AssignPremiumProduct from "./AssignPremiumProduct";

export default function UserDetailsModal({ userId, onClose, onUpdate }) {
  const [appUser, setAppUser] = useState(null);
  const [systemUser, setSystemUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showPremiumAssign, setShowPremiumAssign] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [appUserData, tasksData, transactionsData, loginData, notificationsData] = await Promise.all([
        base44.entities.AppUser.filter({ id: userId }),
        base44.entities.UserTask.filter({ userId }),
        base44.entities.Transaction.filter({ userId }),
        base44.entities.LoginHistory.filter({ userId }),
        base44.entities.Notification.filter({ userId }, '-created_date', 20)
      ]);

      if (appUserData.length > 0) {
        setAppUser(appUserData[0]);
        
        // Get system user
        const users = await base44.entities.User.list();
        const sysUser = users.find(u => u.email === appUserData[0].created_by);
        setSystemUser(sysUser);
      }

      setTasks(tasksData);
      setTransactions(transactionsData);
      setLoginHistory(loginData.slice(0, 5));
      setNotifications(notificationsData);
    } catch (error) {
      toast.error("Failed to load user data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!systemUser) return;
    
    const newStatus = systemUser.status === "suspended" ? "active" : "suspended";
    const action = newStatus === "suspended" ? "suspend" : "activate";
    
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

    try {
      await base44.entities.User.update(systemUser.id, { status: newStatus });
      toast.success(`User account ${action}d successfully`);
      setSystemUser({ ...systemUser, status: newStatus });
      onUpdate?.();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleUnfreeze = async () => {
    if (!confirm("Unfreeze this account? Balance will be neutralized to $0 and user can continue tasks.")) return;

    try {
      await base44.entities.AppUser.update(appUser.id, {
        isFrozen: false,
        frozenBalance: 0,
        balance: 0
      });

      // Auto-assign tasks after unfreeze
      try {
        await base44.functions.invoke('autoAssignTasksAfterReset', { userId: appUser.id });
      } catch (assignError) {
        console.error("Failed to auto-assign tasks:", assignError);
      }

      toast.success("Account unfrozen and neutralized - user can now submit tasks");
      loadUserData();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to unfreeze account");
    }
  };

  const handleQuickEdit = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editField) return;

    try {
      const updateData = {};
      
      if (editField === "balance") {
        updateData.balance = parseFloat(editValue) || 0;
      } else if (editField === "vipLevel") {
        updateData.vipLevel = editValue;
      } else if (editField === "creditScore") {
        updateData.creditScore = parseInt(editValue) || 100;
      } else if (editField === "tasksInCurrentSet") {
        updateData.tasksInCurrentSet = parseInt(editValue) || 0;
      }

      await base44.entities.AppUser.update(appUser.id, updateData);
      toast.success("Updated successfully");
      setShowEditModal(false);
      setEditField(null);
      loadUserData();
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-gray-500">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-gray-500">User not found</div>
        </div>
      </div>
    );
  }

  const completionRate = appUser.tasksCompleted > 0 
    ? ((tasks.filter(t => t.status === "approved").length / appUser.tasksCompleted) * 100).toFixed(1)
    : 0;

  const totalDeposits = transactions
    .filter(t => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{appUser.phone || "Unknown"}</h2>
              <p className="text-sm text-gray-500">{appUser.created_by}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPremiumAssign(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Assign Premium
            </button>
            {appUser.isFrozen && (
              <button
                type="button"
                onClick={handleUnfreeze}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Unfreeze
              </button>
            )}
            {systemUser && (
              <button
                type="button"
                onClick={handleSuspendToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  systemUser.status === "suspended"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {systemUser.status === "suspended" ? "Activate" : "Suspend"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            systemUser?.status === "suspended" 
              ? "bg-red-100 text-red-800" 
              : "bg-green-100 text-green-800"
          }`}>
            {systemUser?.status === "suspended" ? "Suspended" : "Active"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {appUser.vipLevel || "Bronze"}
          </span>
          {appUser.needsReset && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Needs Reset
            </span>
          )}
          {appUser.isFrozen && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Frozen
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {["overview", "activity", "transactions", "notifications", "login"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm capitalize transition-colors relative ${
                activeTab === tab
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 relative group ${appUser.isFrozen ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <button
                    type="button"
                    onClick={() => handleQuickEdit("balance", appUser.balance || 0)}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`w-4 h-4 ${appUser.isFrozen ? 'text-red-600' : 'text-blue-600'}`} />
                    <span className={`text-xs font-medium ${appUser.isFrozen ? 'text-red-600' : 'text-blue-600'}`}>Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${(appUser.balance || 0).toFixed(2)}</div>
                  {appUser.isFrozen && (
                    <div className="text-xs text-red-600 mt-1">Frozen: ${(appUser.frozenBalance || 0).toFixed(2)}</div>
                  )}
                </div>
                <div className="bg-green-50 rounded-xl p-4 relative group">
                  <button
                    type="button"
                    onClick={() => handleQuickEdit("tasksInCurrentSet", appUser.tasksInCurrentSet || 0)}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{appUser.tasksCompleted || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Current: {appUser.tasksInCurrentSet || 0}/40</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 relative group">
                  <button
                    type="button"
                    onClick={() => handleQuickEdit("vipLevel", appUser.vipLevel || "Bronze")}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">VIP Level</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{appUser.vipLevel || "Bronze"}</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 relative group">
                  <button
                    type="button"
                    onClick={() => handleQuickEdit("creditScore", appUser.creditScore || 100)}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">Credit</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{appUser.creditScore || 100}%</div>
                </div>
              </div>

              {/* Streak & Gamification */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">Streak Data</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Current Streak</div>
                      <div className="text-2xl font-bold text-orange-600">{appUser.currentStreak || 0} days</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Longest Streak</div>
                      <div className="text-2xl font-bold text-orange-600">{appUser.longestStreak || 0} days</div>
                    </div>
                  </div>
                  {appUser.lastTaskDate && (
                    <div className="text-xs text-gray-600 mt-2">
                      Last task: {new Date(appUser.lastTaskDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Gamification</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Total Points</div>
                      <div className="text-2xl font-bold text-blue-600">{appUser.points || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Performance</div>
                      <div className="text-sm font-bold text-blue-600 capitalize">{appUser.performanceLevel || "new"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-900 font-medium">{appUser.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900 font-medium">{appUser.created_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invitation Code:</span>
                      <span className="text-gray-900 font-medium">{appUser.invitationCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referrals:</span>
                      <span className="text-gray-900 font-medium">{appUser.inviteCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Language:</span>
                      <span className="text-gray-900 font-medium">{appUser.language || "en"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Task Sets:</span>
                      <span className="text-gray-900 font-medium">{appUser.taskSetsCompleted || 0}/2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Set:</span>
                      <span className="text-gray-900 font-medium">{appUser.tasksInCurrentSet || 0}/40</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Premium Encounters:</span>
                      <span className="text-gray-900 font-medium">{appUser.premiumEncounters || 0}/{appUser.maxPremiumPerSet || 3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="text-gray-900 font-medium">{appUser.successRate || 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completion Rate:</span>
                      <span className="text-gray-900 font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Performance:</span>
                      <span className="text-gray-900 font-medium capitalize">{appUser.performanceLevel || "new"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Deposits</div>
                    <div className="text-lg font-bold text-green-600">${totalDeposits.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Withdrawals</div>
                    <div className="text-lg font-bold text-red-600">${totalWithdrawals.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Current Balance</div>
                    <div className="text-lg font-bold text-blue-600">${(appUser.balance || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No tasks found</div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Task #{task.id.slice(-8)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.created_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">${task.commission.toFixed(2)}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === "approved" ? "bg-green-100 text-green-800" :
                          task.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          task.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No transactions found</div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 capitalize">{transaction.type}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          transaction.type === "deposit" || transaction.type === "bonus" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {transaction.type === "deposit" || transaction.type === "bonus" ? "+" : "-"}
                          ${transaction.amount.toFixed(2)}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "completed" ? "bg-green-100 text-green-800" :
                          transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Notification History</h4>
                <span className="text-sm text-gray-500">
                  {notifications.filter(n => !n.read).length} unread
                </span>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications sent to this user</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-4 ${
                      notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          notification.type === 'payout_status' ? 'bg-green-100 text-green-800' :
                          notification.type === 'task_approved' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'system' ? 'bg-gray-100 text-gray-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                        {notification.priority && (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-1">{notification.title}</h5>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(notification.created_date).toLocaleString()}</span>
                      <span>{notification.read ? 'Read' : 'Unread'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "login" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Recent Logins</h3>
              {loginHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No login history found</div>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map((login) => (
                    <div key={login.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {login.city || "Unknown"}, {login.country || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">{login.ipAddress}</div>
                      </div>
                      <div className="text-right">
                        <Clock className="w-4 h-4 text-gray-400 inline mr-1" />
                        <span className="text-xs text-gray-500">
                          {new Date(login.loginTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assign Premium Product Modal */}
        {showPremiumAssign && (
          <AssignPremiumProduct
            userId={appUser.id}
            userName={appUser.phone || appUser.created_by}
            onSuccess={() => {
              setShowPremiumAssign(false);
              loadUserData();
              onUpdate?.();
            }}
            onClose={() => setShowPremiumAssign(false)}
          />
        )}

        {/* Quick Edit Modal */}
        {showEditModal && editField && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                Edit {editField.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              
              {editField === "vipLevel" ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
              ) : (
                <input
                  type="number"
                  step={editField === "balance" ? "0.01" : "1"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditField(null);
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}