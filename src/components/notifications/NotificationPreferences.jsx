import { useState, useEffect } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function NotificationPreferences({ currentUser, onNavigate }) {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser?.id) return;

    try {
      const data = await base44.entities.NotificationPreference.filter({ userId: currentUser.id });
      if (data.length > 0) {
        setPrefs(data[0]);
      } else {
        // Create default preferences
        const defaultPrefs = await base44.entities.NotificationPreference.create({
          userId: currentUser.id,
          emailNotifications: true,
          inAppNotifications: true,
          taskAvailable: true,
          taskApprovalRejection: true,
          withdrawalStatus: true,
          vipUpgrade: true,
          promotions: true,
          dailyDigest: false
        });
        setPrefs(defaultPrefs);
      }
    } catch (error) {
      toast.error("Failed to load preferences");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field) => {
    const updated = { ...prefs, [field]: !prefs[field] };
    setPrefs(updated);

    setSaving(true);
    try {
      await base44.entities.NotificationPreference.update(prefs.id, { [field]: !prefs[field] });
      toast.success("Preferences updated!");
    } catch (error) {
      toast.error("Failed to update preferences");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const handleQuietHoursChange = async (field, value) => {
    const updated = { ...prefs, [field]: value };
    setPrefs(updated);

    setSaving(true);
    try {
      await base44.entities.NotificationPreference.update(prefs.id, { [field]: value });
      toast.success("Quiet hours updated!");
    } catch (error) {
      toast.error("Failed to update quiet hours");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Notification Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">
        {/* Delivery Methods */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Methods</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">In-App Notifications</div>
                <div className="text-sm text-gray-500">Show alerts while using the app</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.inAppNotifications}
                onChange={() => handleToggle("inAppNotifications")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Send important updates via email</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={() => handleToggle("emailNotifications")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">📋 New Tasks Available</div>
                <div className="text-sm text-gray-500">When new tasks are assigned</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.taskAvailable}
                onChange={() => handleToggle("taskAvailable")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">✅ Task Approvals & Rejections</div>
                <div className="text-sm text-gray-500">When your tasks are reviewed</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.taskApprovalRejection}
                onChange={() => handleToggle("taskApprovalRejection")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">💳 Withdrawal Status</div>
                <div className="text-sm text-gray-500">Updates on your payout requests</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.withdrawalStatus}
                onChange={() => handleToggle("withdrawalStatus")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">👑 VIP Level Changes</div>
                <div className="text-sm text-gray-500">When you reach new VIP levels</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.vipUpgrade}
                onChange={() => handleToggle("vipUpgrade")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">🎉 Promotions & Events</div>
                <div className="text-sm text-gray-500">Special offers and campaigns</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.promotions}
                onChange={() => handleToggle("promotions")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-gray-900">📊 Daily Digest</div>
                <div className="text-sm text-gray-500">Summary of your daily activity</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.dailyDigest}
                onChange={() => handleToggle("dailyDigest")}
                disabled={saving}
                className="w-5 h-5 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h2>
          <p className="text-sm text-gray-600 mb-4">Don't send notifications during these times (optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={prefs.quietHoursStart || ""}
                onChange={(e) => handleQuietHoursChange("quietHoursStart", e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={prefs.quietHoursEnd || ""}
                onChange={(e) => handleQuietHoursChange("quietHoursEnd", e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}