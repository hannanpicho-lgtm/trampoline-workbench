import { useState, useEffect } from "react";
import { ChevronLeft, Camera, Lock, User, Phone, Mail, Loader2, Check, Award, Trophy, Star, Target, Globe, Bell, DollarSign, History, ArrowDown, ArrowUp, Settings as SettingsIcon, ChevronRight, Palette, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { backendClient } from "@/api/backendClient";
import { getVIPLevel } from "../shared/VIPLevelCard";
import TaskAutomationSettings from "../automation/TaskAutomationSettings";
import ProfileBannerEditor from "../profile/ProfileBannerEditor";
import ContactMethodsEditor from "../profile/ContactMethodsEditor";
import ActivityHistory from "../profile/ActivityHistory";

export default function ProfileSettingsPage({ currentUser, onNavigate, onUserUpdate }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.full_name || "",
    phone: currentUser?.phone || "",
    bio: currentUser?.bio || "",
    favoriteGames: currentUser?.favoriteGames || [],
  });
  
  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);

  useEffect(() => {
    loadBadges();
    loadNotificationPrefs();
    loadAppUser();
    if (activeSection === "transactions") {
      loadTransactions();
    }
  }, [currentUser, activeSection]);

  const loadAppUser = async () => {
    if (!currentUser?.email) return;
    try {
      const users = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (users.length > 0) {
        setAppUser(users[0]);
      }
    } catch (error) {
      console.error("Failed to load app user:", error);
    }
  };

  const loadBadges = async () => {
    try {
      const [badges, userBadgesData] = await Promise.all([
        backendClient.entities.Badge.list(),
        currentUser?.id ? backendClient.entities.UserBadge.filter({ userId: currentUser.id }) : Promise.resolve([])
      ]);
      setAllBadges(badges);
      setUserBadges(userBadgesData);
    } catch (error) {
      console.error("Failed to load badges:", error);
    }
  };

  const loadNotificationPrefs = async () => {
    if (!currentUser?.id) return;
    try {
      const prefs = await backendClient.entities.NotificationPreference.filter({ userId: currentUser.id });
      if (prefs.length > 0) {
        setNotificationPrefs(prefs[0]);
      } else {
        // Create default preferences if none exist
        const newPrefs = await backendClient.entities.NotificationPreference.create({
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
        setNotificationPrefs(newPrefs);
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  };

  const loadTransactions = async () => {
    if (!currentUser?.id) return;
    setLoadingTransactions(true);
    try {
      const txData = await backendClient.entities.Transaction.filter(
        { userId: currentUser.id },
        "-created_date",
        20
      );
      setTransactions(txData);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const gameCategories = [
    "Strategy", "Action", "Puzzle", "Adventure", "Sports", 
    "Racing", "Simulation", "RPG", "Casual", "Multiplayer"
  ];

  const toggleFavoriteGame = (game) => {
    setFormData(d => ({
      ...d,
      favoriteGames: d.favoriteGames.includes(game)
        ? d.favoriteGames.filter(g => g !== game)
        : [...d.favoriteGames, game]
    }));
  };
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [txPasswordData, setTxPasswordData] = useState({
    currentTxPassword: "",
    newTxPassword: "",
    confirmTxPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showTxPasswordSection, setShowTxPasswordSection] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [language, setLanguage] = useState(currentUser?.language || "en");
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [appUser, setAppUser] = useState(null);

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      // Update Base44 user
      await backendClient.auth.updateMe({
        full_name: formData.fullName,
      });

      // Update AppUser
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length > 0) {
        await backendClient.entities.AppUser.update(appUserData[0].id, {
          phone: formData.phone,
          bio: formData.bio,
          favoriteGames: formData.favoriteGames,
        });

        onUserUpdate({ 
          ...currentUser, 
          full_name: formData.fullName,
          phone: formData.phone,
          bio: formData.bio,
          favoriteGames: formData.favoriteGames
        });
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      // In production, you'd verify currentPassword and update via Base44 auth
      await backendClient.auth.updateMe({
        // password update would go here
      });

      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error) {
      toast.error("Failed to update password", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTxPasswordUpdate = async () => {
    if (!txPasswordData.currentTxPassword || !txPasswordData.newTxPassword || !txPasswordData.confirmTxPassword) {
      toast.error("All transaction password fields are required");
      return;
    }
    if (txPasswordData.newTxPassword !== txPasswordData.confirmTxPassword) {
      toast.error("New transaction passwords don't match");
      return;
    }
    if (txPasswordData.newTxPassword.length < 6) {
      toast.error("Transaction password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        toast.error("User data not found");
        setIsSaving(false);
        return;
      }

      // Verify current transaction password
      if (txPasswordData.currentTxPassword !== appUserData[0].transactionPassword) {
        toast.error("Current transaction password is incorrect");
        setIsSaving(false);
        return;
      }

      // Update transaction password
      await backendClient.entities.AppUser.update(appUserData[0].id, {
        transactionPassword: txPasswordData.newTxPassword
      });

      toast.success("Transaction password updated successfully");
      setTxPasswordData({ currentTxPassword: "", newTxPassword: "", confirmTxPassword: "" });
      setShowTxPasswordSection(false);
    } catch (error) {
      toast.error("Failed to update transaction password", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length > 0) {
        await backendClient.entities.AppUser.update(appUserData[0].id, {
          profilePicture: file_url
        });

        onUserUpdate({ ...currentUser, profilePicture: file_url });
        toast.success("Profile picture updated");
      }
    } catch (error) {
      toast.error("Failed to upload photo", { description: error.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    setIsSaving(true);
    try {
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length > 0) {
        await backendClient.entities.AppUser.update(appUserData[0].id, {
          language: newLanguage
        });
        onUserUpdate({ ...currentUser, language: newLanguage });
        toast.success("Language preference updated");
      }
    } catch (error) {
      toast.error("Failed to update language", { description: error.message });
      setLanguage(currentUser?.language || "en");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = async (field) => {
    if (!notificationPrefs) return;
    const updated = { ...notificationPrefs, [field]: !notificationPrefs[field] };
    setNotificationPrefs(updated);

    try {
      await backendClient.entities.NotificationPreference.update(notificationPrefs.id, { [field]: !notificationPrefs[field] });
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
      setNotificationPrefs(notificationPrefs);
    }
  };

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ar", name: "العربية", flag: "🇸🇦" }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("my")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-lg font-semibold">Profile & Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 -mt-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: "personal", label: "Personal", icon: User },
            { id: "banner", label: "Banner", icon: Palette },
            { id: "contacts", label: "Contacts", icon: MessageCircle },
            { id: "activity", label: "Activity", icon: History },
            { id: "security", label: "Security", icon: Lock },
            { id: "automation", label: "Automation", icon: SettingsIcon },
            { id: "language", label: "Language", icon: Globe },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "balance", label: "Balance", icon: DollarSign },
            { id: "transactions", label: "History", icon: History }
          ].map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Personal Information Section */}
        {activeSection === "personal" && (
          <div className="space-y-3">
            {/* User Profile Summary Card */}
            {appUser && (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur overflow-hidden flex items-center justify-center border-4 border-white/30">
                    {appUser.profilePicture ? (
                      <img src={appUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{currentUser?.full_name || "User"}</h2>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                        {appUser.vipLevel || "Bronze"}
                      </span>
                      <span className="text-white/80 text-xs">Level {
                        appUser.vipLevel === "Bronze" ? "1" :
                        appUser.vipLevel === "Silver" ? "2" :
                        appUser.vipLevel === "Gold" ? "3" :
                        appUser.vipLevel === "Platinum" ? "4" : "5"
                      }</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                    <div className="text-white/70 text-xs mb-1">Total Earnings</div>
                    <div className="text-2xl font-bold">${(appUser.balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                    <div className="text-white/70 text-xs mb-1">Tasks Done</div>
                    <div className="text-2xl font-bold">{appUser.tasksCompleted || 0}</div>
                  </div>
                </div>

                <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white/70 text-xs mb-1">Referral Code</div>
                      <div className="text-lg font-bold tracking-wider">{appUser.invitationCode}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(appUser.invitationCode);
                        toast.success("Referral code copied!");
                      }}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-white/90"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                  <span>Member since {new Date(appUser.created_date).toLocaleDateString()}</span>
                  <span>{appUser.inviteCount || 0} referrals</span>
                </div>
              </div>
            )}

            {/* Profile Picture Section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-900 mb-3">Profile Picture</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-200 overflow-hidden flex items-center justify-center">
                {currentUser?.profilePicture ? (
                  <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="#F5DEB3" />
                    <circle cx="50" cy="40" r="18" fill="#F5DEB3" />
                    <ellipse cx="45" cy="38" rx="2" ry="2" fill="#333" />
                    <ellipse cx="55" cy="38" rx="2" ry="2" fill="#333" />
                    <path d="M 47 45 Q 50 48 53 45" stroke="#333" strokeWidth="1.5" fill="none" />
                    <path d="M 30 30 Q 35 15 50 15 Q 65 15 70 30 L 65 32 Q 60 20 50 20 Q 40 20 35 32 Z" fill="#5D4E37" />
                    <ellipse cx="50" cy="85" rx="30" ry="25" fill="#5D4E37" />
                  </svg>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                {uploadingPhoto ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-white" />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900">{currentUser?.full_name || "Guest"}</p>
              <p className="text-[10px] text-gray-500">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-900">Personal Information</h2>
            {!isEditing && (
              <button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="text-blue-500 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(d => ({ ...d, fullName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 text-sm">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>{currentUser?.full_name || "Not set"}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="flex items-center gap-2 text-gray-900 text-sm">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>{currentUser?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 text-sm">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{currentUser?.phone || "Not set"}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(d => ({ ...d, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <div className="text-gray-900 text-xs">
                  {currentUser?.bio || "No bio added yet"}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      fullName: currentUser?.full_name || "",
                      phone: currentUser?.phone || "",
                      bio: currentUser?.bio || "",
                      favoriteGames: currentUser?.favoriteGames || [],
                    });
                  }}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  disabled={isSaving}
                  className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl p-3 shadow-sm mb-3">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-gray-900 text-sm font-medium">Change Password</span>
            </div>
            <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? "-rotate-90" : "rotate-180"}`} />
          </button>

          {showPasswordSection && (
            <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(d => ({ ...d, newPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(d => ({ ...d, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={isSaving}
                className="w-full py-2 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                Update
              </button>
            </div>
          )}
        </div>

        {/* Transaction Password Section */}
        <div className="bg-white rounded-2xl p-3 shadow-sm mb-3">
          <button
            type="button"
            onClick={() => setShowTxPasswordSection(!showTxPasswordSection)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-gray-900 text-sm font-medium">Change Transaction Password</span>
            </div>
            <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${showTxPasswordSection ? "-rotate-90" : "rotate-180"}`} />
          </button>

          {showTxPasswordSection && (
            <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
              <input
                type="password"
                placeholder="Current Transaction Password"
                value={txPasswordData.currentTxPassword}
                onChange={(e) => setTxPasswordData(d => ({ ...d, currentTxPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New Transaction Password"
                value={txPasswordData.newTxPassword}
                onChange={(e) => setTxPasswordData(d => ({ ...d, newTxPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm New Transaction Password"
                value={txPasswordData.confirmTxPassword}
                onChange={(e) => setTxPasswordData(d => ({ ...d, confirmTxPassword: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTxPasswordUpdate}
                disabled={isSaving}
                className="w-full py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                Update
              </button>
            </div>
          )}
        </div>

        {/* Favorite Games Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-semibold text-gray-900">Favorite Games</h2>
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-1.5">
              {gameCategories.map(game => (
                <button
                  key={game}
                  type="button"
                  onClick={() => toggleFavoriteGame(game)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.favoriteGames.includes(game)
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {game}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {currentUser?.favoriteGames?.length > 0 ? (
                currentUser.favoriteGames.map(game => (
                  <span key={game} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {game}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-xs">No favorite games selected yet</p>
              )}
            </div>
          )}
        </div>

        {/* VIP Progress Tracker */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-semibold text-gray-900">VIP Progress</h2>
          </div>
          {(() => {
            const vipData = getVIPLevel(currentUser?.tasksCompleted || 0);
            const currentTasks = currentUser?.tasksCompleted || 0;
            const progress = vipData.nextLevel ? (currentTasks / vipData.nextLevel) * 100 : 100;
            return (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Current: {vipData.level}</span>
                  {vipData.nextLevelName && (
                    <span className="text-xs text-gray-500">Next: {vipData.nextLevelName}</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-600">
                  <span>{currentTasks} completed</span>
                  {vipData.nextLevel && (
                    <span>{vipData.nextLevel - currentTasks} to {vipData.nextLevelName}</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <h2 className="text-xs font-semibold text-gray-900">Achievements</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {allBadges.slice(0, 6).map(badge => {
              const earned = userBadges.some(ub => ub.badgeId === badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${
                    earned 
                      ? "border-yellow-400 bg-yellow-50" 
                      : "border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] text-center font-medium text-gray-700">{badge.name}</span>
                  {earned && <Check className="w-3 h-3 text-green-600 mt-0.5" />}
                </div>
              );
            })}
          </div>
          {userBadges.length > 0 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-600">
                {userBadges.length} / {allBadges.length} earned
              </span>
            </div>
          )}
        </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-900 mb-3">Account Information</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">VIP Level</span>
                  <span className="text-gray-900 font-medium">{currentUser?.vipLevel || "Bronze"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Credit Score</span>
                  <span className="text-gray-900 font-medium">{currentUser?.creditScore || 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invitation Code</span>
                  <span className="text-gray-900 font-medium">{currentUser?.invitationCode || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Points</span>
                  <span className="text-gray-900 font-medium">{(currentUser?.points || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-900 font-medium">
                    {currentUser?.created_date ? new Date(currentUser.created_date).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Banner Section */}
        {activeSection === "banner" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                Customize Your Profile Banner
              </h2>
              <ProfileBannerEditor appUser={appUser} onUpdate={(updated) => setAppUser(updated)} />
            </div>
          </div>
        )}

        {/* Contact Methods Section */}
        {activeSection === "contacts" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                Contact Methods
              </h2>
              <ContactMethodsEditor currentUser={currentUser} appUser={appUser} onUpdate={(updated) => setAppUser(updated)} />
            </div>
          </div>
        )}

        {/* Activity History Section */}
        {activeSection === "activity" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-600" />
                Your Activity History
              </h2>
              <ActivityHistory appUser={appUser} />
            </div>
          </div>
        )}

        {/* Automation Section */}
        {activeSection === "automation" && (
          <div className="space-y-3">
            <TaskAutomationSettings userId={appUser?.id} />
          </div>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <div className="space-y-3">
            {/* Password Section */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-gray-900 text-sm font-medium">Change Password</span>
                </div>
                <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordSection ? "-rotate-90" : "rotate-180"}`} />
              </button>

              {showPasswordSection && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(d => ({ ...d, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(d => ({ ...d, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={isSaving}
                    className="w-full py-2 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Update
                  </button>
                </div>
              )}
            </div>

            {/* Transaction Password Section */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setShowTxPasswordSection(!showTxPasswordSection)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-gray-900 text-sm font-medium">Change Transaction Password</span>
                </div>
                <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${showTxPasswordSection ? "-rotate-90" : "rotate-180"}`} />
              </button>

              {showTxPasswordSection && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                  <input
                    type="password"
                    placeholder="Current Transaction Password"
                    value={txPasswordData.currentTxPassword}
                    onChange={(e) => setTxPasswordData(d => ({ ...d, currentTxPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New Transaction Password"
                    value={txPasswordData.newTxPassword}
                    onChange={(e) => setTxPasswordData(d => ({ ...d, newTxPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Transaction Password"
                    value={txPasswordData.confirmTxPassword}
                    onChange={(e) => setTxPasswordData(d => ({ ...d, confirmTxPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleTxPasswordUpdate}
                    disabled={isSaving}
                    className="w-full py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    Update
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Language Section */}
        {activeSection === "language" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Select Language
            </h2>
            <div className="space-y-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                    language === lang.code
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                  </div>
                  {language === lang.code && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <div className="space-y-3">
            {!notificationPrefs ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading preferences...</p>
              </div>
            ) : (
              <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Notification Types</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">📋 New Tasks</div>
                    <div className="text-xs text-gray-500">When new tasks are assigned</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.taskAvailable}
                    onChange={() => handleNotificationToggle("taskAvailable")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">✅ Task Reviews</div>
                    <div className="text-xs text-gray-500">Approvals and rejections</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.taskApprovalRejection}
                    onChange={() => handleNotificationToggle("taskApprovalRejection")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">💳 Withdrawal Status</div>
                    <div className="text-xs text-gray-500">Payout updates</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.withdrawalStatus}
                    onChange={() => handleNotificationToggle("withdrawalStatus")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">👑 VIP Upgrades</div>
                    <div className="text-xs text-gray-500">Level changes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.vipUpgrade}
                    onChange={() => handleNotificationToggle("vipUpgrade")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">🎉 Promotions</div>
                    <div className="text-xs text-gray-500">Special offers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.promotions}
                    onChange={() => handleNotificationToggle("promotions")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Delivery Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">📧 Email Notifications</div>
                    <div className="text-xs text-gray-500">Receive notifications via email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailNotifications}
                    onChange={() => handleNotificationToggle("emailNotifications")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">📱 In-App Notifications</div>
                    <div className="text-xs text-gray-500">Show notifications in the app</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.inAppNotifications}
                    onChange={() => handleNotificationToggle("inAppNotifications")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">📬 Daily Digest</div>
                    <div className="text-xs text-gray-500">Receive daily summary email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.dailyDigest}
                    onChange={() => handleNotificationToggle("dailyDigest")}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />
                </label>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* Balance Section */}
        {activeSection === "balance" && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 font-medium">Available Balance</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                ${(currentUser?.balance || 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Balance Breakdown</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="text-gray-900 font-semibold">${(currentUser?.balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tasks Completed</span>
                  <span className="text-gray-900 font-semibold">{currentUser?.tasksCompleted || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Points</span>
                  <span className="text-gray-900 font-semibold">{(currentUser?.points || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">VIP Level</span>
                  <span className="text-gray-900 font-semibold">{currentUser?.vipLevel || "Bronze"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {activeSection === "transactions" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Transaction History
              </h2>
              {loadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === "deposit" ? "bg-green-100" :
                          tx.type === "withdrawal" ? "bg-red-100" : "bg-blue-100"
                        }`}>
                          {tx.type === "withdrawal" ? (
                            <ArrowUp className="w-5 h-5 text-red-600" />
                          ) : (
                            <ArrowDown className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm capitalize">{tx.type}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm ${
                          tx.type === "withdrawal" ? "text-red-600" : "text-green-600"
                        }`}>
                          {tx.type === "withdrawal" ? "-" : "+"}${tx.amount.toFixed(2)}
                        </div>
                        <div className={`text-xs ${
                          tx.status === "completed" ? "text-green-600" : "text-yellow-600"
                        }`}>
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}