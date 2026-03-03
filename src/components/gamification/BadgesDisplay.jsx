import { useState, useEffect } from "react";
import { Award, Lock } from "lucide-react";
import { backendClient } from "@/api/backendClient";

export default function BadgesDisplay({ userId, compact = false }) {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      const [allBadges, earned] = await Promise.all([
        backendClient.entities.Badge.list(),
        backendClient.entities.UserBadge.filter({ userId })
      ]);
      
      setBadges(allBadges);
      setUserBadges(earned);
    } catch (error) {
      console.error("Failed to load badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = userBadges.map(ub => ub.badgeId);

  if (loading) return null;

  if (compact) {
    const recentBadges = userBadges.slice(0, 6);
    return (
      <div className="flex gap-1.5 flex-wrap">
        {recentBadges.map(ub => {
          const badge = badges.find(b => b.id === ub.badgeId);
          return badge ? (
            <div key={badge.id} className="text-xl" title={badge.name}>
              {badge.icon}
            </div>
          ) : null;
        })}
        {recentBadges.length === 0 && (
          <p className="text-[10px] text-gray-500">No badges yet</p>
        )}
      </div>
    );
  }

  const displayBadges = showAll ? badges : badges.slice(0, 4);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {displayBadges.map(badge => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`rounded-lg p-2 text-center transition-all ${
                isEarned
                  ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400"
                  : "bg-gray-100 opacity-50"
              }`}
            >
              <div className="text-2xl mb-1">
                {isEarned ? badge.icon : <Lock className="w-6 h-6 mx-auto text-gray-400" />}
              </div>
              <div className="text-[10px] font-semibold text-gray-900 mb-0.5">
                {badge.name}
              </div>
              {!isEarned && badge.requirement && (
                <div className="text-[9px] text-gray-500">
                  Req: {badge.requirement}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {badges.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 text-xs text-blue-600 font-medium hover:underline"
        >
          {showAll ? "Show Less" : `View All (${badges.length})`}
        </button>
      )}
    </div>
  );
}