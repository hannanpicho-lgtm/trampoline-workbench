import { useState, useEffect } from "react";
import { ChevronLeft, Copy, Users, DollarSign, Gift, Share2, TrendingUp, Award, Mail, MessageCircle, Facebook, Twitter, Linkedin, Network } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";
import ReferralTree from "../referral/ReferralTree";

export default function ReferralPage({ currentUser, onNavigate }) {
  const [appUser, setAppUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCommissionEarned, setTotalCommissionEarned] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadReferralData();
  }, [currentUser]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const [appUserData] = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      setAppUser(appUserData);

      // Get referred users
      const referredUsers = await backendClient.entities.AppUser.filter({ referredBy: appUserData.id });
      setReferrals(referredUsers);

      // Get referral commission earnings (20% from referred users' tasks)
      const earningsData = await backendClient.entities.ReferralEarning.filter({ referrerId: appUserData.id });
      setEarnings(earningsData);
      setTotalCommissionEarned(earningsData.reduce((sum, e) => sum + e.referralCommission, 0));
    } catch (error) {
      console.error("Failed to load referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(appUser?.invitationCode || "");
    toast.success("Invitation code copied to clipboard!");
  };

  const getCommissionRate = (vipLevel) => {
    const rates = {
      'Bronze': '20%',
      'Silver': '22%',
      'Gold': '25%',
      'Platinum': '28%',
      'Diamond': '30%'
    };
    return rates[vipLevel] || '20%';
  };

  const commissionRate = getCommissionRate(appUser?.vipLevel || "Bronze");

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Join me on this amazing platform!");
    const body = encodeURIComponent(`Hey! I've been using this platform and thought you might like it too.\n\nUse my invitation code: ${appUser?.invitationCode}\n\nYou'll get $20 bonus when you sign up!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSocial = (platform) => {
    const text = encodeURIComponent(`Join me and get $20 bonus! Use code: ${appUser?.invitationCode}`);
    const url = encodeURIComponent(window.location.origin);
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-gray-500">Loading referrals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Referral Program</h1>
          <div className="w-10" />
        </div>

        {/* VIP Commission Badge */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-4 shadow-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-white text-2xl font-bold mb-1">{appUser?.vipLevel || "Bronze"} VIP</div>
            <div className="text-white/80 text-sm mb-3">Earning {commissionRate} commission on referrals</div>
            <div className="bg-white/20 rounded-xl p-3 mt-3">
              <div className="text-white/70 text-xs mb-1">Upgrade your VIP level to earn higher commissions!</div>
              <div className="text-white text-xs font-semibold">Bronze: 20% → Silver: 22% → Gold: 25% → Platinum: 28% → Diamond: 30%</div>
            </div>
          </div>
        </div>

        {/* Invite Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-4">
            <div className="text-gray-500 text-sm mb-2">Your Invitation Code</div>
            <div className="text-gray-900 text-3xl font-bold font-mono mb-4 tracking-wider">
              {appUser?.invitationCode || "N/A"}
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={copyInviteCode}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </button>
              <button
                type="button"
                onClick={shareViaEmail}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="text-xs text-gray-500 mb-2">Share via</div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => shareViaSocial('whatsapp')}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => shareViaSocial('facebook')}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => shareViaSocial('twitter')}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => shareViaSocial('linkedin')}
                className="w-10 h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-100">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{referrals.length}</div>
              <div className="text-xs text-gray-500 mt-1">Referrals</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-100">
            <div className="text-center">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">${totalCommissionEarned.toFixed(0)}</div>
              <div className="text-xs text-gray-500 mt-1">Earned ({commissionRate})</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-purple-100">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{earnings.length}</div>
              <div className="text-xs text-gray-500 mt-1">Transactions</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === "overview" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "tree" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Network className="w-4 h-4" />
            Tree
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("referrals")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === "referrals" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Referrals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("earnings")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === "earnings" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Earnings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* How It Works */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 shadow-sm mb-6 border border-purple-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <span className="text-2xl">🎁</span>
                How Referral Rewards Work
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-lg">$20</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">New User Bonus</div>
                    <div className="text-sm text-gray-600">Your friend gets $20 instantly when they sign up with your code</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-lg">20%</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">VIP-Tiered Commission</div>
                    <div className="text-sm text-gray-600">Earn {commissionRate} commission based on your VIP level - forever!</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/80 rounded-xl p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Upgrade Your VIP</div>
                    <div className="text-sm text-gray-600">Higher VIP levels earn more commission on all referrals</div>
                  </div>
                </div>
              </div>
            </div>

            {/* VIP Commission Rates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">VIP Commission Rates</h3>
              <div className="space-y-3">
                {[
                  { name: "Bronze", icon: "🥉", rate: "20%" },
                  { name: "Silver", icon: "🥈", rate: "22%" },
                  { name: "Gold", icon: "🥇", rate: "25%" },
                  { name: "Platinum", icon: "🏆", rate: "28%" },
                  { name: "Diamond", icon: "💎", rate: "30%" }
                ].map((t) => (
                  <div 
                    key={t.name}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      (appUser?.vipLevel || "Bronze") === t.name
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{t.name} VIP</div>
                          <div className="text-xs text-gray-500">Earn {t.rate} from all referral commissions</div>
                        </div>
                      </div>
                      {(appUser?.vipLevel || "Bronze") === t.name && (
                        <div className="text-blue-600 font-bold text-sm">Your Level</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tree Tab */}
        {activeTab === "tree" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Referral Network Tree
              </h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-800">
              <strong>Interactive Tree:</strong> Click arrows to expand/collapse your referral network. Shows up to 3 levels deep.
            </div>
            <ReferralTree userId={appUser?.id} />
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Your Referrals ({referrals.length})</h3>
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No referrals yet</p>
                <p className="text-gray-400 text-sm">Share your code to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((ref) => {
                  const userEarnings = earnings.filter(e => e.referredUserId === ref.id);
                  const totalFromUser = userEarnings.reduce((sum, e) => sum + e.referralCommission, 0);
                  
                  return (
                    <div key={ref.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {ref.phone?.slice(0, 2) || "?"}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{ref.phone || "User"}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{ref.tasksCompleted || 0} tasks</span>
                            <span>•</span>
                            <span className="text-green-600 font-semibold">+${totalFromUser.toFixed(2)} earned</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          {ref.vipLevel || "Bronze"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ref.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Commission History</h3>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total Earned</div>
                <div className="text-xl font-bold text-green-600">${totalCommissionEarned.toFixed(2)}</div>
              </div>
            </div>
            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No earnings yet</p>
                <p className="text-gray-400 text-sm">Earnings appear when your referrals complete tasks</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {earnings.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()).map((earning) => {
                  const referredUser = referrals.find(r => r.id === earning.referredUserId);
                  return (
                    <div key={earning.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            Referral Commission
                          </div>
                          <div className="text-xs text-gray-500">
                            From {referredUser?.phone || "user"} • {new Date(earning.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">+${earning.referralCommission.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">of ${earning.commissionAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}