import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Home, Award, ClipboardList, User, Bell, Clock, Globe, Moon, Sun, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";

// Import page components
import LoginPage from "../components/auth/LoginPage";
import SignupPage from "../components/auth/SignupPage";
import ProfileCard from "../components/shared/ProfileCard";
import VIPLevelCard from "../components/shared/VIPLevelCard";
import NotificationBell from "../components/notifications/NotificationBell";
import MyPage from "../components/pages/MyPage";
import ProfileSettingsPage from "../components/pages/ProfileSettingsPage";
import StartingPage from "../components/pages/StartingPage";
import TaskHistoryPage from "../components/pages/TaskHistoryPage";
import RecordsPage from "../components/pages/RecordsPage";

import LotteryPage from "../components/pages/LotteryPage";
import TermsPage from "../components/pages/TermsPage";
import BonusRulesPage from "../components/pages/BonusRulesPage";
import ReferralPage from "../components/pages/ReferralPage";
import DepositModal from "../components/modals/DepositModal";
import WithdrawModal from "../components/modals/WithdrawModal";
import AddWalletModal from "../components/modals/AddWalletModal";
import VIPBenefitsModal from "../components/shared/VIPBenefitsModal";
import CustomerServiceChat from "../components/chat/CustomerServiceChat";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import NotificationCenter from "../components/notifications/NotificationCenter";
import NotificationPreferences from "../components/notifications/NotificationPreferences";
import AnnouncementBanner from "../components/announcements/AnnouncementBanner";
import SubscriptionPage from "../components/pages/SubscriptionPage";
import StorePage from "../components/pages/StorePage";
import VIPPage from "../components/pages/VIPPage";

const translations = {
  en: { signIn: "Sign in", signUp: "Sign up", verifyEmail: "Verify Your Email", verificationSent: "We sent a code to", enterCode: "Enter code", verify: "Verify", resendCode: "Resend code", useBiometric: "Use biometric", alreadyHaveAccount: "Already have an account?", changeLanguage: "Change Language" },
  es: { signIn: "Iniciar sesión", signUp: "Registrarse", verifyEmail: "Verifica tu Correo", verificationSent: "Enviamos un código a", enterCode: "Ingresa el código", verify: "Verificar", resendCode: "Reenviar", useBiometric: "Usar biométrico", alreadyHaveAccount: "¿Ya tienes cuenta?", changeLanguage: "Cambiar Idioma" },
  zh: { signIn: "登录", signUp: "注册", verifyEmail: "验证邮箱", verificationSent: "我们发送了验证码到", enterCode: "输入验证码", verify: "验证", resendCode: "重发", useBiometric: "使用生物识别", alreadyHaveAccount: "已有账户?", changeLanguage: "更改语言" },
  ar: { signIn: "تسجيل الدخول", signUp: "إنشاء حساب", verifyEmail: "تحقق من بريدك", verificationSent: "أرسلنا رمزًا إلى", enterCode: "أدخل الرمز", verify: "تحقق", resendCode: "إعادة إرسال", useBiometric: "استخدام البيومترية", alreadyHaveAccount: "لديك حساب؟", changeLanguage: "تغيير اللغة" },
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [language, setLanguage] = useState("en");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showVIPBenefitsModal, setShowVIPBenefitsModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productOffset, setProductOffset] = useState(0);

  // Session management
  const SESSION_TIMEOUT = 5 * 60; // 5 minutes
  const WARNING_TIME = 60; // Show warning 60 seconds before logout
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const sessionTimerRef = useRef(null);
  const lastActivityRef = useRef(0);

  const t = translations[language];

  // Initialize
  const [showNewUserBonus, setShowNewUserBonus] = useState(false);

  useEffect(() => {
    setIsClient(true);
    lastActivityRef.current = Date.now();
    
    // Check if user is already logged in
    checkAuth();
  }, []);

  // Rotate featured products every 5 seconds
  useEffect(() => {
    if (allProducts.length <= 6) return;
    
    const interval = setInterval(() => {
      setProductOffset((prev) => {
        const newOffset = (prev + 6) % allProducts.length;
        const endSlice = newOffset + 6;
        
        if (endSlice > allProducts.length) {
          setFeaturedProducts([...allProducts.slice(newOffset), ...allProducts.slice(0, 6 - (allProducts.length - newOffset))]);
        } else {
          setFeaturedProducts(allProducts.slice(newOffset, endSlice));
        }
        
        return newOffset;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [allProducts]);

  const trackUserLogin = async () => {
    try {
      // Call the trackLogin backend function with device info
      await backendClient.functions.invoke('trackLogin', {
        ipAddress: null, // Will be captured from request headers
        deviceInfo: navigator.userAgent || 'Unknown'
      });
    } catch (error) {
      console.error("Failed to track login:", error);
    }
  };

  const checkAuth = async () => {
    try {
      const user = await backendClient.auth.me();
      if (user) {
        // Check if this is a new login by checking localStorage flag
        const lastTrackedLogin = localStorage.getItem('lastTrackedLogin');
        const now = Date.now();
        
        // Track login if it's been more than 1 hour or never tracked
        if (!lastTrackedLogin || (now - parseInt(lastTrackedLogin)) > 3600000) {
          trackUserLogin();
          localStorage.setItem('lastTrackedLogin', now.toString());
        }

        // Fetch additional user data from AppUser entity
        const appUserData = await backendClient.entities.AppUser.filter({ created_by: user.email });
        if (appUserData.length > 0) {
          // Check if this is a new user (first login in last minute)
          const lastLogin = appUserData[0].lastLogin;
          const isNewUser = !lastLogin || (Date.now() - new Date(lastLogin).getTime() < 60000);

          // Update last login
          await backendClient.entities.AppUser.update(appUserData[0].id, {
            lastLogin: new Date().toISOString()
          });
          setCurrentUser({ ...user, ...appUserData[0] });

          // Show new user bonus flash if first time
          if (isNewUser && appUserData[0].balance >= 20) {
            setShowNewUserBonus(true);
            setTimeout(() => setShowNewUserBonus(false), 5000);
          }
        } else {
          setCurrentUser(user);
        }
        
        // Load featured products
        const products = await backendClient.entities.Product.filter({ isActive: true }, "-created_date", 50);
        setAllProducts(products);
        setFeaturedProducts(products.slice(0, 6));
        
        setIsLoggedIn(true);
        setActivePage("home");
        resetSessionTimer();
      }
    } catch (error) {
      // User not logged in
      setActivePage("login");
    }
  };

  // Reset session timer
  const resetSessionTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionTimeLeft(SESSION_TIMEOUT);
    setShowSessionWarning(false);
  }, [SESSION_TIMEOUT]);

  // Handle session logout
  const handleSessionLogout = useCallback(() => {
    backendClient.auth.logout(window.location.pathname);
    setIsLoggedIn(false);
    setShowSessionWarning(false);
    setCurrentUser(null);
    setActivePage("login");
    toast.info("Session expired", { description: "You have been logged out due to inactivity" });
  }, []);

  // Session timer effect
  useEffect(() => {
    if (!isLoggedIn || !isClient) return;

    sessionTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = SESSION_TIMEOUT - elapsed;

      if (remaining <= 0) {
        handleSessionLogout();
      } else {
        setSessionTimeLeft(remaining);
        if (remaining <= WARNING_TIME && !showSessionWarning) {
          setShowSessionWarning(true);
        }
      }
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isLoggedIn, isClient, showSessionWarning, handleSessionLogout, SESSION_TIMEOUT, WARNING_TIME]);

  // Activity detection
  useEffect(() => {
    if (!isLoggedIn || !isClient) return;

    const handleActivity = () => {
      if (!showSessionWarning) {
        resetSessionTimer();
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isLoggedIn, isClient, showSessionWarning, resetSessionTimer]);

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle login
  const handleLogin = async (username, password, rememberMe) => {
    try {
      // Use Base44's direct email/password authentication
      const { data, error } = await backendClient.auth.signInWithPassword({
        email: username,
        password: password
      });
      
      if (error) throw error;
      
      // Successful login - reload to trigger auth check
      window.location.reload();
    } catch (error) {
      toast.error("Login failed", { description: error.message || "Invalid credentials" });
    }
  };

  // Handle signup complete
  const handleSignupComplete = (email, invitationCode) => {
    setPendingEmail(email);
    toast.success("Please check your email to verify your account");
    setActivePage("login");
  };

  // Update user data after deposit/withdraw
  const handleTransactionSuccess = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
  };

  // Update user data after profile edit
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Extend session
  const extendSession = () => {
    resetSessionTimer();
    toast.success("Session extended!", { description: "Your session has been extended by 5 minutes" });
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Session Warning Modal
  const SessionWarningModal = () => showSessionWarning ? (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Expiring</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your session will expire due to inactivity
          </p>
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 rounded-full px-4 py-2 mb-6">
            <Clock className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600 font-mono">
              {formatTime(sessionTimeLeft)}
            </span>
          </div>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={handleSessionLogout}
              className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={extendSession}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Language Modal
  const LanguageModal = () => showLanguageModal ? (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLanguageModal(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.changeLanguage}</h3>
        <div className="space-y-2">
          {[["en", "English"], ["es", "Español"], ["zh", "中文"], ["ar", "العربية"]].map(([code, name]) => (
            <button key={code} type="button" onClick={() => { setLanguage(code); setShowLanguageModal(false); }} className={`w-full p-3 rounded-xl text-left flex items-center justify-between ${language === code ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              {name}
              {language === code && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  // Home Page
  const HomePage = () => (
    <>
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center bg-black/30">
          <span className="text-red-500 font-bold text-lg">t</span>
        </div>
        <div className="text-white">
          <NotificationBell userId={currentUser?.id} />
        </div>
      </div>

      {/* Announcements */}
      <AnnouncementBanner userId={currentUser?.id} />

      {/* Working Hours Notice */}
      <div className="relative z-10 px-4 mb-4">
        <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm overflow-hidden">
          <Bell className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="animate-scroll whitespace-nowrap text-sm text-gray-800 font-medium">
              The platform's official working hours are 9:00 AM to 11:00 PM Eastern Time (ET). &nbsp;&nbsp;&nbsp;&nbsp; The platform's official working hours are 9:00 AM to 11:00 PM Eastern Time (ET).
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="relative z-10 px-4 mb-4">
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-3xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-200 overflow-hidden">
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
              <div>
                <div className="text-white text-xl font-bold">{currentUser?.full_name || "User"}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/80 text-xs">Credit Score:</span>
                  <div className="flex-1 bg-white/30 rounded-full h-2 w-20">
                    <div className="bg-white h-full rounded-full" style={{ width: `${currentUser?.creditScore || 100}%` }} />
                  </div>
                  <span className="text-white text-xs font-bold">{currentUser?.creditScore || 100}%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/80 text-xs">Invitation Code:</span>
                  <span className="text-white font-mono text-sm">{currentUser?.invitationCode || "N/A"}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser?.invitationCode || "");
                      toast.success("Code copied!");
                    }}
                    className="text-white/80 hover:text-white"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-300" />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/80 text-sm">Total balance</span>
              <button type="button" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? "👁️" : "🙈"}
              </button>
            </div>
            <div className="text-white text-4xl font-bold">
              {showBalance ? `${(currentUser?.balance || 0).toFixed(2)} USD` : "••••••"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage("starting")}
            className="w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-black/80 transition-colors"
          >
            Start
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative z-10 flex justify-around px-12 mb-6">
        <button type="button" onClick={() => setActivePage("subscription")} className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <span className="text-2xl">👑</span>
        </button>
        <button type="button" onClick={() => setActivePage("store")} className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <span className="text-2xl">🛒</span>
        </button>
        <button type="button" onClick={() => setShowWithdrawModal(true)} className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <span className="text-2xl">💳</span>
        </button>
        <button type="button" onClick={() => setShowDepositModal(true)} className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
          <span className="text-2xl">💰</span>
        </button>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="relative z-10 px-4 mb-6">
            <h3 className="text-gray-900 font-semibold mb-3">Featured Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.slice(0, 4).map((product, idx) => (
                <div key={`${product.id}-${idx}`} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</div>
                    <div className="text-sm font-bold text-green-600">${product.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">+${product.commission} commission</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Carousel */}
      <div className="relative z-10 px-4 mb-6">
        <div className="bg-pink-50 rounded-2xl p-6">
          <div className="grid grid-cols-4 gap-4">
            <button type="button" className="flex flex-col items-center gap-2" onClick={() => setActivePage("lottery")}>
              <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎰</span>
              </div>
              <span className="text-xs text-gray-900 font-medium">Lottery</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-2" onClick={() => setActivePage("bonus-rules")}>
              <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <span className="text-xs text-gray-900 font-medium">Bonus Rules</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-2" onClick={() => setActivePage("terms")}>
              <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <span className="text-xs text-gray-900 font-medium">T & C</span>
            </button>

          </div>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-gray-800 rounded-full" />
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Banner Image */}
      <div className="relative z-10 px-4 mb-8">
        <div className="rounded-2xl overflow-hidden h-52 bg-gradient-to-br from-blue-100 to-purple-100">
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop" 
            alt="Team collaboration" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </>
  );

  // Render based on page
  const renderPage = () => {
    switch (activePage) {
      case "login":
        return (
          <LoginPage
            onNavigate={setActivePage}
            onLogin={handleLogin}
            translations={t}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setShowLanguageModal={setShowLanguageModal}
          />
        );
      case "signup":
        return (
          <SignupPage
            onNavigate={setActivePage}
            onSignupComplete={handleSignupComplete}
            translations={t}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setShowLanguageModal={setShowLanguageModal}
          />
        );
      case "home":
        return <HomePage />;
      case "my":
        return (
          <MyPage
            currentUser={currentUser}
            showBalance={showBalance}
            setShowBalance={setShowBalance}
            onNavigate={setActivePage}
            onDepositClick={() => setShowDepositModal(true)}
            onWithdrawClick={() => setShowWithdrawModal(true)}
            onAddWalletClick={() => setShowAddWalletModal(true)}
            onTransactionClick={() => setActivePage("records")}
          />
        );
      case "profile":
        return (
          <ProfileSettingsPage
            currentUser={currentUser}
            onNavigate={setActivePage}
            onUserUpdate={handleUserUpdate}
          />
        );
      case "starting":
        return (
          <StartingPage
            currentUser={currentUser}
            onNavigate={(page, options) => {
              if (page === "chat" && options?.initialRequest) {
                sessionStorage.setItem('chatInitialRequest', options.initialRequest);
              }
              setActivePage(page);
            }}
          />
        );
      case "records":
        return (
          <RecordsPage
            currentUser={currentUser}
            onNavigate={setActivePage}
          />
        );

      case "lottery":
        return (
          <LotteryPage
            currentUser={currentUser}
            onNavigate={setActivePage}
          />
        );
      case "terms":
        return (
          <TermsPage
            onNavigate={setActivePage}
          />
        );
      case "bonus-rules":
        return (
          <BonusRulesPage
            onNavigate={setActivePage}
          />
        );
      case "referral":
         return (
           <ReferralPage
             currentUser={currentUser}
             onNavigate={setActivePage}
           />
         );
      case "notifications":
        return (
          <NotificationCenter currentUser={currentUser} onNavigate={setActivePage} />
        );
      case "notification-settings":
        return (
          <NotificationPreferences currentUser={currentUser} onNavigate={setActivePage} />
        );
      case "subscription":
        return (
          <SubscriptionPage currentUser={currentUser} onNavigate={setActivePage} />
        );
      case "store":
        return (
          <StorePage currentUser={currentUser} onNavigate={setActivePage} />
        );
      case "vip":
        return (
          <VIPPage currentUser={currentUser} onNavigate={setActivePage} />
        );
      case "leaderboard":
        const Leaderboard = React.lazy(() => import('./Leaderboard'));
        return (
          <React.Suspense fallback={<div className="text-white text-center p-8">Loading...</div>}>
            <Leaderboard />
          </React.Suspense>
        );
       default:
          return <div className="text-white text-center p-8">Page under construction</div>;
       }
       };

  // Auth pages have their own layout
  if (["login", "signup", "email-verification", "forgot-password"].includes(activePage)) {
    return (
      <div className="max-w-md mx-auto">
        <LanguageModal />
        {renderPage()}
      </div>
    );
  }

  // Profile settings and starting pages have their own layout
  if (["profile", "starting", "records", "lottery", "terms", "bonus-rules", "referral", "notifications", "notification-settings", "subscription", "store", "vip"].includes(activePage)) {
    return (
      <div className="max-w-md mx-auto">
        <SessionWarningModal />
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] max-w-md mx-auto relative pb-24">
      <SessionWarningModal />
      <LanguageModal />
      <DepositModal 
        show={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        currentUser={currentUser}
        onSuccess={handleTransactionSuccess}
      />
      <WithdrawModal 
        show={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        currentUser={currentUser}
        onSuccess={handleTransactionSuccess}
      />
      <AddWalletModal 
        show={showAddWalletModal}
        onClose={() => setShowAddWalletModal(false)}
        currentUser={currentUser}
      />
      <VIPBenefitsModal 
        show={showVIPBenefitsModal}
        onClose={() => setShowVIPBenefitsModal(false)}
        currentLevel={currentUser?.vipLevel || "Bronze"}
      />
      
      <div className={`absolute top-0 left-0 right-0 ${["my", "notification-settings"].includes(activePage) ? "h-64" : "h-64"} rounded-b-3xl bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] z-0`} />

      {renderPage()}

      {isLoggedIn && currentUser && (
        <FloatingChatButton currentUser={currentUser} />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 max-w-md mx-auto">
        <div className="flex justify-around py-2">
          <button type="button" onClick={() => setActivePage("home")} className={`flex flex-col items-center gap-1 ${activePage === "home" ? "text-red-600" : "text-gray-900"}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold">Home</span>
          </button>

          <button type="button" onClick={() => setActivePage("starting")} className={`flex flex-col items-center gap-1 ${activePage === "starting" ? "text-red-600" : "text-gray-900"}`}>
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-semibold">Starting</span>
          </button>
          <button type="button" onClick={() => setActivePage("records")} className={`flex flex-col items-center gap-1 ${activePage === "records" ? "text-red-600" : "text-gray-900"}`}>
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-semibold">Records</span>
          </button>
          <button type="button" onClick={() => setActivePage("my")} className={`flex flex-col items-center gap-1 ${activePage === "my" ? "text-red-600" : "text-gray-900"}`}>
                    <User className="w-6 h-6" />
                    <span className="text-xs font-semibold">My</span>
                  </button>
                </div>
              </nav>
            </div>
          );
          }