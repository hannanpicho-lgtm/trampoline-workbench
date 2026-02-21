import { useState, useEffect } from "react";
import { ChevronLeft, Award, TrendingUp, Users, DollarSign, Download, Share2, Crown, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getVIPLevel } from "../shared/VIPLevelCard";
import VIPBenefitsModal from "../shared/VIPBenefitsModal";

export default function CertificatePage({ currentUser, onNavigate }) {
  const [showVIPBenefits, setShowVIPBenefits] = useState(false);
  const vipData = getVIPLevel(currentUser?.tasksCompleted || 0);
  const totalEarnings = (currentUser?.balance || 0).toFixed(2);
  const tasksCompleted = currentUser?.tasksCompleted || 0;
  const inviteCount = currentUser?.inviteCount || 0;

  const achievements = [
    { 
      id: 1, 
      title: "First Task", 
      description: "Complete your first task", 
      icon: "🎯", 
      unlocked: tasksCompleted >= 1,
      requirement: "1 task"
    },
    { 
      id: 2, 
      title: "Task Master", 
      description: "Complete 10 tasks", 
      icon: "🏆", 
      unlocked: tasksCompleted >= 10,
      requirement: "10 tasks"
    },
    { 
      id: 3, 
      title: "VIP Silver", 
      description: "Reach Silver VIP level", 
      icon: "🥈", 
      unlocked: vipData.level !== "Bronze",
      requirement: "20 tasks"
    },
    { 
      id: 4, 
      title: "Top Earner", 
      description: "Earn $100 in commissions", 
      icon: "💰", 
      unlocked: parseFloat(totalEarnings) >= 100,
      requirement: "$100 earnings"
    },
    { 
      id: 5, 
      title: "Social Butterfly", 
      description: "Invite 5 friends", 
      icon: "👥", 
      unlocked: inviteCount >= 5,
      requirement: "5 referrals"
    },
    { 
      id: 6, 
      title: "VIP Gold", 
      description: "Reach Gold VIP level", 
      icon: "🥇", 
      unlocked: ["Gold", "Platinum", "Diamond"].includes(vipData.level),
      requirement: "50 tasks"
    },
    { 
      id: 7, 
      title: "Century Club", 
      description: "Complete 100 tasks", 
      icon: "💯", 
      unlocked: tasksCompleted >= 100,
      requirement: "100 tasks"
    },
    { 
      id: 8, 
      title: "Diamond Elite", 
      description: "Reach Diamond VIP level", 
      icon: "💎", 
      unlocked: vipData.level === "Diamond",
      requirement: "150 tasks"
    },
  ];

  const handleDownload = () => {
    toast.success("Certificate download coming soon!");
  };

  const handleShare = () => {
    toast.success("Share feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <VIPBenefitsModal show={showVIPBenefits} onClose={() => setShowVIPBenefits(false)} currentLevel={vipLevel} />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Certificate</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4">
        {/* Main Certificate Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 shadow-xl mb-6 border-4 border-amber-200">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Excellence Certificate</h2>
            <div className="text-amber-700 font-medium">Awarded to</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{currentUser?.full_name || "User"}</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{tasksCompleted}</div>
                <div className="text-xs text-gray-600">Tasks</div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">${totalEarnings}</div>
                <div className="text-xs text-gray-600">Earned</div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{vipData.level}</div>
                <div className="text-xs text-gray-600">VIP Level</div>
              </div>
            </div>
          </div>

          {/* VIP Benefits Section */}
          <div className={`bg-gradient-to-br ${vipData.color} rounded-xl p-5 mb-4 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                <h3 className="font-bold text-lg">Your VIP Benefits</h3>
              </div>
              <span className="text-3xl">{vipData.icon}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {vipData.benefits.slice(0, 4).map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{benefit}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowVIPBenefits(true)}
              className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              View All Benefits
            </button>
          </div>

          <div className="text-center text-xs text-gray-600 mb-4">
            Member since {new Date(currentUser?.created_date).toLocaleDateString()}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <h3 className="text-gray-900 font-bold text-lg mb-4">Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-2xl p-4 text-center transition-all ${
                  achievement.unlocked
                    ? "bg-white shadow-md"
                    : "bg-gray-200 opacity-60"
                }`}
              >
                <div className={`text-4xl mb-2 ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                  {achievement.icon}
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {achievement.title}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {achievement.description}
                </div>
                {achievement.unlocked ? (
                  <div className="text-xs text-green-600 font-medium">✓ Unlocked</div>
                ) : (
                  <div className="text-xs text-gray-500">{achievement.requirement}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}