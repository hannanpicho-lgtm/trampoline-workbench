import { useState, useEffect } from "react";
import { ChevronLeft, Trash2, Mail, Smartphone, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNotifications } from "./useNotifications";

export default function NotificationCenter({ currentUser, onNavigate }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(currentUser?.id);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = filterType === "all" || n.type === filterType;
    const readMatch = filterRead === "all" || (filterRead === "unread" ? !n.read : n.read);
    return typeMatch && readMatch;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task_approved":
        return "✅";
      case "task_available":
        return "📋";
      case "withdrawal_status":
        return "💳";
      case "vip_upgrade":
        return "👑";
      case "promotion":
        return "🎉";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "task_approved":
        return "bg-green-50 border-green-200";
      case "task_available":
        return "bg-blue-50 border-blue-200";
      case "withdrawal_status":
        return "bg-purple-50 border-purple-200";
      case "vip_upgrade":
        return "bg-amber-50 border-amber-200";
      case "promotion":
        return "bg-pink-50 border-pink-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Notifications</h1>
          <div className="w-10" />
        </div>

        {/* Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm">Unread Notifications</div>
              <div className="text-white text-2xl font-bold">{unreadCount}</div>
            </div>
            <div className="text-4xl">🔔</div>
          </div>
        </div>

        {/* Mark All As Read */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="task_available">New Tasks</option>
              <option value="task_approved">Task Approvals</option>
              <option value="withdrawal_status">Withdrawals</option>
              <option value="vip_upgrade">VIP Upgrades</option>
              <option value="promotion">Promotions</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 pb-8 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📭</div>
            <div className="text-gray-500">No notifications</div>
            <div className="text-gray-400 text-sm mt-1">
              {filterType !== "all" || filterRead !== "all" ? "Try adjusting your filters" : "You're all caught up!"}
            </div>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                getNotificationColor(notification.type)
              } ${!notification.read ? "ring-2 ring-blue-400" : ""}`}
            >
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                    </div>
                    {notification.priority && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{new Date(notification.created_date).toLocaleDateString()}</span>
                    {!notification.read && <span className="bg-blue-500 w-2 h-2 rounded-full" />}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}