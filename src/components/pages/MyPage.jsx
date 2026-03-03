import { useState, useEffect } from "react";
import { Settings, TrendingUp, ArrowDown, ArrowUp, Star, Award, Trophy, Users } from "lucide-react";
import ProfileCard from "../shared/ProfileCard";
import VIPLevelCard from "../shared/VIPLevelCard";
import VIPBenefitsModal from "../shared/VIPBenefitsModal";
import BadgesDisplay from "../gamification/BadgesDisplay";
import StreakTracker from "../gamification/StreakTracker";
import PayoutHistory from "./PayoutHistory";
import PersonalizedDashboard from "../personalization/PersonalizedDashboard";
import VIPUpgradePrompt from "../vip/VIPUpgradePrompt";
import { backendClient } from "@/api/backendClient";

export default function MyPage({ 
  currentUser, 
  showBalance, 
  setShowBalance, 
  onNavigate,
  onDepositClick,
  onWithdrawClick,
  onAddWalletClick,
  onTransactionClick 
}) {
  const [activeTab, setActiveTab] = useState("today");
  const [transactions, setTransactions] = useState([]);
  const [showVIPBenefits, setShowVIPBenefits] = useState(false);
  const [appUser, setAppUser] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadTransactions();
    }
  }, [currentUser]);

  const loadTransactions = async () => {
    try {
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length > 0) {
        setAppUser(appUserData[0]);
        const txData = await backendClient.entities.Transaction.filter(
          { userId: appUserData[0].id },
          "-created_date",
          5
        );
        setTransactions(txData);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  return (
    <>
      <VIPBenefitsModal 
        show={showVIPBenefits} 
        onClose={() => setShowVIPBenefits(false)} 
        currentLevel={currentUser?.vipLevel || "Bronze"}
      />
      
      <div className="relative z-10 px-4 pt-8">
        <ProfileCard 
            user={currentUser}
            showBalance={showBalance}
            setShowBalance={setShowBalance}
            showWalletActions={true}
            onDepositClick={onDepositClick}
            onWithdrawClick={onWithdrawClick}
            onAddWalletClick={onAddWalletClick}
            onTransactionClick={onTransactionClick}
            onNavigate={onNavigate}
          />
      </div>

      {appUser && (
        <div className="relative z-10 px-4 mt-4">
          <VIPUpgradePrompt 
            currentUser={currentUser}
            appUser={appUser}
            onUpgradeRequested={() => onNavigate("vip")}
          />
        </div>
      )}

      <div className="relative z-10 px-4 mt-4">
        <VIPLevelCard 
          tasksCompleted={currentUser?.tasksCompleted || 0}
          vipLevel={currentUser?.vipLevel}
          showDetails={true}
          onShowBenefits={() => onNavigate("vip")}
        />
      </div>

      {/* Points & Actions */}
      <div className="relative z-10 px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Points</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {(currentUser?.points || 0).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("referral")}
            className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-200 flex flex-col justify-center items-center hover:scale-105 transition-transform"
          >
            <Users className="w-6 h-6 text-green-600 mb-1" />
            <span className="text-xs font-semibold text-gray-800">Referrals</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("leaderboard")}
            className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-200 flex flex-col justify-center items-center hover:scale-105 transition-transform"
          >
            <Trophy className="w-6 h-6 text-yellow-600 mb-1" />
            <span className="text-xs font-semibold text-gray-800">Ranking</span>
          </button>
        </div>
      </div>

      {/* Streak Tracker */}
      <div className="relative z-10 px-4 mt-4">
        <StreakTracker 
          currentStreak={currentUser?.currentStreak || 0}
          longestStreak={currentUser?.longestStreak || 0}
        />
      </div>

      {/* Personalized Dashboard */}
      <div className="relative z-10 px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Your Performance</h3>
          <PersonalizedDashboard appUser={currentUser} userTasks={transactions} />
        </div>
      </div>

      <div className="relative z-10 px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Your Badges
          </h3>
          <BadgesDisplay userId={currentUser?.id} />
        </div>
      </div>

      {/* Badges */}
      <div className="relative z-10 px-4 mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-3 h-3 text-purple-600" />
            Your Badges
          </h3>
          <BadgesDisplay userId={currentUser?.id} compact={true} />
        </div>
      </div>

      {/* Payout History */}
      <div className="relative z-10 px-4 mt-4">
        <PayoutHistory currentUser={currentUser} />
      </div>

      <div className="relative z-10 px-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-gray-800 font-medium">Profit Analysis</span>
          </div>
          <button 
            type="button" 
            onClick={() => onNavigate("profile")} 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="relative z-10 px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <span className="text-gray-500 text-sm">Total Profit</span>
            <div className="text-2xl font-bold text-gray-900">${((currentUser?.balance || 0) * 0.125).toFixed(2)} USD</div>
            <div className="mt-2 inline-flex items-center gap-2 bg-green-50 rounded-full px-3 py-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">+12.5% this week</span>
            </div>
          </div>

          <div className="flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                activeTab === "today" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Today's Profit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("total")}
              className={`flex-1 py-3 rounded-full text-sm font-medium transition-colors ${
                activeTab === "total" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Total Profit
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 mt-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Transaction History</h3>
            <button type="button" className="text-red-600 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-green-100" :
                      tx.type === "withdrawal" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      {tx.type === "deposit" ? (
                        <ArrowDown className="w-5 h-5 text-green-600" />
                      ) : tx.type === "withdrawal" ? (
                        <ArrowUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <Star className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{tx.type}</div>
                      <div className="text-xs text-gray-500">{new Date(tx.created_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      tx.type === "withdrawal" ? "text-red-600" : "text-green-600"
                    }`}>
                      {tx.type === "withdrawal" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </div>
                    <div className={`text-xs ${
                      tx.status === "completed" ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}