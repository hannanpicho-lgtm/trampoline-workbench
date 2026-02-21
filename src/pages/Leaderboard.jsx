import { useState, useEffect } from "react";
import { ChevronLeft, Trophy, Medal, Award, TrendingUp, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("points");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);

      const appUsers = await base44.entities.AppUser.list();
      
      // Sort based on active tab
      let sorted = [...appUsers];
      switch (activeTab) {
        case "points":
          sorted.sort((a, b) => (b.points || 0) - (a.points || 0));
          break;
        case "tasks":
          sorted.sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));
          break;
        case "streak":
          sorted.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
          break;
        case "earnings":
          sorted.sort((a, b) => (b.balance || 0) - (a.balance || 0));
          break;
      }
      
      setUsers(sorted.slice(0, 100)); // Top 100
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-600 font-bold">#{rank}</span>;
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case "points": return <Award className="w-4 h-4" />;
      case "tasks": return <TrendingUp className="w-4 h-4" />;
      case "streak": return <Flame className="w-4 h-4" />;
      case "earnings": return <span className="text-sm">💰</span>;
    }
  };

  const getValue = (user) => {
    switch (activeTab) {
      case "points": return `${(user.points || 0).toLocaleString()} pts`;
      case "tasks": return `${user.tasksCompleted || 0} tasks`;
      case "streak": return `${user.currentStreak || 0} days`;
      case "earnings": return `$${(user.balance || 0).toFixed(2)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => window.history.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Leaderboard</h1>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "points", label: "Points" },
            { id: "tasks", label: "Tasks" },
            { id: "streak", label: "Streak" },
            { id: "earnings", label: "Earnings" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? "bg-white text-purple-600 shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No data available</div>
        ) : (
          users.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.created_by === currentUser?.email;
            
            return (
              <div
                key={user.id}
                className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all ${
                  isCurrentUser ? "ring-2 ring-purple-400 shadow-lg" : ""
                } ${rank <= 3 ? "border-2 border-yellow-200" : ""}`}
              >
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {user.phone || "User"}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {user.vipLevel || "Bronze"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-purple-600">
                    {getValue(user)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}