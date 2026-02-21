import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Users, DollarSign, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReferralTree({ userId }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set([userId]));

  useEffect(() => {
    loadTree();
  }, [userId]);

  const loadTree = async () => {
    setLoading(true);
    try {
      const treeData = await buildTree(userId);
      setTree(treeData);
    } catch (error) {
      console.error("Failed to load referral tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = async (rootId, depth = 0, maxDepth = 3) => {
    if (depth >= maxDepth) return null;

    const [user] = await base44.entities.AppUser.filter({ id: rootId });
    if (!user) return null;

    const referrals = await base44.entities.AppUser.filter({ referredBy: rootId });
    const earnings = await base44.entities.ReferralEarning.filter({ referrerId: rootId });
    const totalEarned = earnings.reduce((sum, e) => sum + e.referralCommission, 0);

    const children = await Promise.all(
      referrals.map(ref => buildTree(ref.id, depth + 1, maxDepth))
    );

    return {
      id: user.id,
      phone: user.phone,
      vipLevel: user.vipLevel || "Bronze",
      tasksCompleted: user.tasksCompleted || 0,
      balance: user.balance || 0,
      referralsCount: referrals.length,
      totalEarned,
      children: children.filter(Boolean),
      depth
    };
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getVipColor = (level) => {
    const colors = {
      Bronze: "from-orange-400 to-orange-600",
      Silver: "from-gray-300 to-gray-500",
      Gold: "from-yellow-400 to-yellow-600",
      Platinum: "from-purple-400 to-purple-600",
      Diamond: "from-cyan-400 to-blue-600"
    };
    return colors[level] || colors.Bronze;
  };

  const renderNode = (node) => {
    if (!node) return null;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        <div className="flex items-start gap-2 mb-2">
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleNode(node.id)}
              className="mt-3 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div 
            className={`flex-1 bg-gradient-to-r ${getVipColor(node.vipLevel)} rounded-xl p-3 shadow-sm`}
            style={{ marginLeft: `${node.depth * 20}px` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {node.phone?.slice(0, 2) || "?"}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">
                    {node.phone || "User"}
                  </div>
                  <div className="text-white/80 text-xs">
                    {node.vipLevel}
                  </div>
                </div>
              </div>
              {hasChildren && (
                <div className="bg-white/20 rounded-full px-2 py-0.5">
                  <span className="text-white text-xs font-bold">
                    {node.referralsCount}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/20 rounded-lg p-1.5">
                <div className="text-white/80 text-[10px]">Tasks</div>
                <div className="text-white font-bold text-xs">{node.tasksCompleted}</div>
              </div>
              <div className="bg-white/20 rounded-lg p-1.5">
                <div className="text-white/80 text-[10px]">Balance</div>
                <div className="text-white font-bold text-xs">${node.balance.toFixed(0)}</div>
              </div>
              <div className="bg-white/20 rounded-lg p-1.5">
                <div className="text-white/80 text-[10px]">Earned</div>
                <div className="text-white font-bold text-xs">${node.totalEarned.toFixed(0)}</div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Loading referral tree...</div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No referral data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {renderNode(tree)}
      {tree.children.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-sm">No referrals yet</p>
          <p className="text-gray-400 text-xs mt-1">Share your code to start building your network</p>
        </div>
      )}
    </div>
  );
}