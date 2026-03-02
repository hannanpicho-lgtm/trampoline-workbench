import { useState, useEffect } from "react";
import { Users, DollarSign, CheckCircle, BarChart3, Award, Package, Cog, Lock, RefreshCw, CreditCard, Shield, AlertTriangle, Layers, Crown, Zap, Bell, Target, MessageCircle, Share2 as Share2Icon } from "lucide-react";
import { Zap as ZapIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";
import UserManagementList from "../components/admin/UserManagementList";
import TaskApprovalList from "../components/admin/TaskApprovalList";
import WithdrawalApprovalList from "../components/admin/WithdrawalApprovalList";
import AdminStats from "../components/admin/AdminStats";
import AnalyticsReports from "../components/admin/AnalyticsReports";
import VIPAnalytics from "../components/admin/VIPAnalytics";
import ProductPerformance from "../components/admin/ProductPerformance";
import ProductManagement from "../components/admin/ProductManagement";
import BulkProductGenerator from "../components/admin/BulkProductGenerator";
import AITaskGenerator from "../components/admin/AITaskGenerator";
import IntelligentTaskAssigner from "../components/admin/IntelligentTaskAssigner";
import LoginHistory from "../components/admin/LoginHistory";
import TaskResetManager from "../components/admin/TaskResetManager";
import CommissionPayoutManager from "../components/admin/CommissionPayoutManager";
import NotificationBell from "../components/notifications/NotificationBell";
import RoleManagement from "../components/admin/RoleManagement";
import TaskAssignmentManager from "../components/admin/TaskAssignmentManager";
import TaskAssignmentConfig from "../components/admin/TaskAssignmentConfig";
import AdminAlerts from "../components/admin/AdminAlerts";
import TaskSetManager from "../components/admin/TaskSetManager";
import TaskQueueMonitor from "../components/admin/TaskQueueMonitor";
import VIP1TestRunner from "../components/admin/VIP1TestRunner";
import UserHealthCheck from "../components/admin/UserHealthCheck";
import AutoResetSettings from "../components/admin/AutoResetSettings";
import AgentCannedResponses from "../components/admin/AgentCannedResponses";
import ProactiveSupportMonitor from "../components/admin/ProactiveSupportMonitor";
import QuickTestSetup from "../components/admin/QuickTestSetup";
import VIPUpgradeManager from "../components/admin/VIPUpgradeManager";
import VIPCommissionRanges from "../components/admin/VIPCommissionRanges";
import AdvancedAnalyticsDashboard from "../components/admin/AdvancedAnalyticsDashboard";
import { useAdminPermissions } from "../components/admin/useAdminPermissions";
import AnnouncementManager from "../components/admin/AnnouncementManager";
import SubscriptionTierManager from "../components/admin/SubscriptionTierManager";
import InAppPurchaseManager from "../components/admin/InAppPurchaseManager";
import ReferralSettingsManager from "../components/admin/ReferralSettingsManager";
import InvitationCodeManager from "../components/admin/InvitationCodeManager";
import VIPLevelManager from "../components/admin/VIPLevelManager";
import NotificationManager from "../components/admin/NotificationManager";
import UserSegmentManager from "../components/admin/UserSegmentManager";
import VIPTaskAssignmentMonitor from "../components/admin/VIPTaskAssignmentMonitor";
import TransactionHistoryViewer from "../components/admin/TransactionHistoryViewer";
import SegmentAnalytics from "../components/admin/SegmentAnalytics";
import TaskCategoryManager from "../components/admin/TaskCategoryManager";
import SegmentTaskAssigner from "../components/admin/SegmentTaskAssigner";
import CustomerServiceManager from "../components/admin/CustomerServiceManager";
import AutomatedPayoutMonitor from "../components/admin/AutomatedPayoutMonitor";
import SystemHealthDashboard from "../components/admin/SystemHealthDashboard";
import AdminTrainingAccountsManager from "../components/admin/AdminTrainingAccountsManager";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const { hasPermission, hasAnyPermission, isSuperAdmin } = useAdminPermissions();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await backendClient.auth.me();
      
      // Check if user is super admin or has any admin role
      const isAdmin = user.role === "admin";
      const userRoles = !isAdmin ? await backendClient.entities.UserRole.filter({ userId: user.id }) : [];
      
      if (!isAdmin && userRoles.length === 0) {
        toast.error("Access denied", { description: "Admin access required" });
        window.location.href = "/";
        return;
      }
      
      setCurrentUser(user);
      setLoading(false);
    } catch (error) {
      toast.error("Authentication required");
      backendClient.auth.redirectToLogin();
    }
  };

  const canAccessTab = (tab) => {
    if (isSuperAdmin) return true;
    
    const tabPermissions = {
      users: ['manage_users'],
      tasks: ['approve_tasks'],
      withdrawals: ['approve_payouts'],
      payouts: ['approve_payouts', 'view_commissions'],
      products: ['manage_products'],
      analytics: ['view_analytics'],
      vip: ['view_vip_analytics'],
      roles: ['manage_roles'],
      logins: ['view_login_history'],
      automatedAssignment: ['manage_automated_assignment']
    };
    
    return !tabPermissions[tab] || hasAnyPermission(tabPermissions[tab]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-300 mt-1">Manage users, tasks, and transactions</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={currentUser?.id} />
              <button
                type="button"
                onClick={() => backendClient.auth.logout("/")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <AdminStats />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {canAccessTab("users") && (
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "users" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Users
                {activeTab === "users" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("tasks") && (
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "tasks" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Task Approvals
                {activeTab === "tasks" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("withdrawals") && (
              <button
                type="button"
                onClick={() => setActiveTab("withdrawals")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "withdrawals" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Withdrawals
                {activeTab === "withdrawals" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("payouts") && (
              <button
                type="button"
                onClick={() => setActiveTab("payouts")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "payouts" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Payouts
                {activeTab === "payouts" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("products") && (
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "products" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Products
                {activeTab === "products" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("task-config")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "task-config" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Cog className="w-4 h-4 inline mr-2" />
              Task Config
              {activeTab === "task-config" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("segment-tasks")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "segment-tasks" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Segment Tasks
              {activeTab === "segment-tasks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("task-sets")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "task-sets" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              Task Sets
              {activeTab === "task-sets" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reset")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "reset" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Resets
              {activeTab === "reset" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vip1-tests")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "vip1-tests" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              VIP1 Tests
              {activeTab === "vip1-tests" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            {canAccessTab("analytics") && (
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "analytics" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
                {activeTab === "analytics" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("vip") && (
              <button
                type="button"
                onClick={() => setActiveTab("vip")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "vip" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                VIP
                {activeTab === "vip" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            {canAccessTab("logins") && (
              <button
                type="button"
                onClick={() => setActiveTab("logins")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "logins" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Logins
                {activeTab === "logins" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "alerts" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Alerts
              {activeTab === "alerts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            {canAccessTab("roles") && (
              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "roles" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Roles
                {activeTab === "roles" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "queue" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              Task Queue
              {activeTab === "queue" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("auto-reset")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "auto-reset" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Auto-Reset
              {activeTab === "auto-reset" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("canned")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "canned" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Canned Responses
              {activeTab === "canned" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("proactive")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "proactive" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Proactive Support
              {activeTab === "proactive" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vip-upgrades")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "vip-upgrades" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              VIP Upgrades
              {activeTab === "vip-upgrades" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("commission-ranges")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "commission-ranges" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Commission Ranges
              {activeTab === "commission-ranges" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            {canAccessTab("automatedAssignment") && (
              <button
                type="button"
                onClick={() => setActiveTab("automatedAssignment")}
                className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === "automatedAssignment" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Auto-Assignment
                {activeTab === "automatedAssignment" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("announcements")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "announcements" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Announcements
              {activeTab === "announcements" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "notifications" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
              {activeTab === "notifications" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("segments")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "segments" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Segments
              {activeTab === "segments" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("segment-analytics")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "segment-analytics" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Segment Analytics
              {activeTab === "segment-analytics" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subscriptions")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "subscriptions" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Subscriptions
              {activeTab === "subscriptions" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("store")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "store" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Store
              {activeTab === "store" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("invitations")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "invitations" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Invitations
              {activeTab === "invitations" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vip-manager")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "vip-manager" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              VIP Manager
              {activeTab === "vip-manager" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("customer-service")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "customer-service" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Customer Service
              {activeTab === "customer-service" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("referral")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "referral" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Share2Icon className="w-4 h-4 inline mr-2" />
              Referral Program
              {activeTab === "referral" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vip-task-monitor")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "vip-task-monitor" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              VIP Tasks
              {activeTab === "vip-task-monitor" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "transactions" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Transactions
              {activeTab === "transactions" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("automated-payouts")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "automated-payouts" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Auto Payouts
              {activeTab === "automated-payouts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("system-health")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "system-health" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              System Health
              {activeTab === "system-health" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("training-accounts")}
              className={`py-4 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "training-accounts" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Training Accounts
              {activeTab === "training-accounts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            </div>
            </div>
            </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "users" && (
          <div className="space-y-6">
            <QuickTestSetup />
            <UserManagementList />
          </div>
        )}
        {activeTab === "tasks" && <TaskApprovalList />}
        {activeTab === "withdrawals" && <WithdrawalApprovalList />}
        {activeTab === "payouts" && <CommissionPayoutManager />}
        {activeTab === "products" && (
          <div className="space-y-6">
            <AITaskGenerator />
            <BulkProductGenerator />
            <ProductManagement />
          </div>
        )}
        {activeTab === "task-sets" && <TaskSetManager />}
        {activeTab === "reset" && (
          <div className="space-y-6">
            <IntelligentTaskAssigner />
            <TaskResetManager />
          </div>
        )}
        {activeTab === "vip1-tests" && (
          <div className="space-y-6">
            <UserHealthCheck />
            <VIP1TestRunner />
          </div>
        )}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <AdvancedAnalyticsDashboard />
            <AnalyticsReports />
          </div>
        )}
        {activeTab === "vip" && <VIPAnalytics />}
        {activeTab === "logins" && <LoginHistory />}
        {activeTab === "alerts" && <AdminAlerts />}
        {activeTab === "roles" && <RoleManagement />}
        {activeTab === "queue" && <TaskQueueMonitor />}
        {activeTab === "auto-reset" && <AutoResetSettings />}
        {activeTab === "canned" && <AgentCannedResponses />}
        {activeTab === "proactive" && <ProactiveSupportMonitor />}
        {activeTab === "vip-upgrades" && <VIPUpgradeManager />}
        {activeTab === "commission-ranges" && <VIPCommissionRanges />}
        {activeTab === "automatedAssignment" && <TaskAssignmentConfig />}
        {activeTab === "announcements" && <AnnouncementManager />}
        {activeTab === "notifications" && <NotificationManager />}
        {activeTab === "segments" && <UserSegmentManager />}
        {activeTab === "segment-analytics" && <SegmentAnalytics />}
        {activeTab === "task-config" && <TaskCategoryManager />}
        {activeTab === "segment-tasks" && <SegmentTaskAssigner />}
        {activeTab === "subscriptions" && <SubscriptionTierManager />}
        {activeTab === "store" && <InAppPurchaseManager />}
        {activeTab === "invitations" && <InvitationCodeManager />}
        {activeTab === "vip-manager" && <VIPLevelManager />}
        {activeTab === "customer-service" && <CustomerServiceManager />}
        {activeTab === "vip-task-monitor" && <VIPTaskAssignmentMonitor />}
        {activeTab === "transactions" && <TransactionHistoryViewer />}
        {activeTab === "referral" && <ReferralSettingsManager />}
        {activeTab === "automated-payouts" && <AutomatedPayoutMonitor />}
        {activeTab === "system-health" && <SystemHealthDashboard />}
        {activeTab === "training-accounts" && <AdminTrainingAccountsManager />}
        </div>
        </div>
        );
        }