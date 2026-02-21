import { Crown, Star, Award } from "lucide-react";

const VIP_BADGES = {
  Bronze: {
    icon: "🥉",
    gradient: "from-orange-400 to-orange-600",
    shine: "from-orange-200 to-orange-400"
  },
  Silver: {
    icon: "🥈",
    gradient: "from-gray-300 to-gray-500",
    shine: "from-gray-200 to-gray-400"
  },
  Gold: {
    icon: "🥇",
    gradient: "from-yellow-400 to-yellow-600",
    shine: "from-yellow-200 to-yellow-400"
  },
  Platinum: {
    icon: "🏆",
    gradient: "from-purple-400 to-purple-600",
    shine: "from-purple-200 to-purple-400"
  },
  Diamond: {
    icon: "💎",
    gradient: "from-cyan-400 to-blue-600",
    shine: "from-cyan-200 to-blue-400"
  }
};

export default function VIPBadge({ level, size = "md", showLabel = true, animated = true }) {
  const badge = VIP_BADGES[level] || VIP_BADGES.Bronze;
  
  const sizes = {
    sm: { container: "w-6 h-6", icon: "text-sm", label: "text-[10px]" },
    md: { container: "w-8 h-8", icon: "text-base", label: "text-xs" },
    lg: { container: "w-12 h-12", icon: "text-2xl", label: "text-sm" },
    xl: { container: "w-16 h-16", icon: "text-3xl", label: "text-base" }
  };
  
  const sizeClass = sizes[size] || sizes.md;

  if (!showLabel) {
    return (
      <div 
        className={`${sizeClass.container} bg-gradient-to-br ${badge.gradient} rounded-full flex items-center justify-center shadow-lg ${
          animated ? 'hover:scale-110 transition-transform' : ''
        } relative overflow-hidden`}
      >
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        )}
        <span className={sizeClass.icon}>{badge.icon}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${badge.gradient} px-3 py-1.5 rounded-full shadow-md ${
      animated ? 'hover:shadow-lg transition-all' : ''
    } relative overflow-hidden`}>
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
      )}
      <span className={sizeClass.icon}>{badge.icon}</span>
      <span className={`${sizeClass.label} text-white font-bold relative z-10`}>{level}</span>
      {(level === 'Platinum' || level === 'Diamond') && (
        <Crown className="w-3 h-3 text-yellow-300 relative z-10" />
      )}
    </div>
  );
}