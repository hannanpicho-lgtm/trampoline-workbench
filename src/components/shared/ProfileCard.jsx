import { Eye, EyeOff, Copy, Diamond, Plus, ArrowDown, ArrowUp, ArrowLeftRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";
import VIPBadge from "./VIPBadge";

export default function ProfileCard({ 
  user, 
  showBalance, 
  setShowBalance, 
  showWalletActions = false,
  onDepositClick,
  onWithdrawClick,
  onAddWalletClick,
  onTransactionClick,
  onNavigate
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(user?.invitationCode || "");
    toast.success("Invitation code copied!", {
      description: `${user?.invitationCode} has been copied to your clipboard`,
    });
  };

  const handleLogout = () => {
    backendClient.auth.logout();
    if (onNavigate) {
      onNavigate("login");
    }
  };

  const walletActions = [
    { icon: Plus, label: "Add Wallet", onClick: onAddWalletClick },
    { icon: ArrowDown, label: "Deposit", onClick: onDepositClick },
    { icon: ArrowUp, label: "Withdraw", onClick: onWithdrawClick },
    { icon: ArrowLeftRight, label: "Transaction", onClick: onTransactionClick },
  ];

  return (
    <div className="profile-gradient rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
        }} />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
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

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-white font-semibold text-xl">{user?.full_name || "Guest"}</h2>
              <VIPBadge level={user?.vipLevel || "Bronze"} size="sm" showLabel={false} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/80 text-sm">Credit Score:</span>
              <div className="w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-blue-400 rounded-full" style={{ width: `${user?.creditScore || 100}%` }} />
              </div>
              <span className="text-white font-medium text-sm">{user?.creditScore || 100}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/80 text-sm">Invitation Code:</span>
              <span className="text-white font-bold">{user?.invitationCode || "------"}</span>
              <button type="button" onClick={handleCopy} className="text-white/80 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-2">
          <div className="w-14 h-16 bg-gradient-to-b from-[#7DD3FC] to-[#3B82F6] rounded-xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <Diamond className="w-6 h-6 text-white relative z-10" />
            <span className="text-[10px] text-white font-bold mt-0.5 relative z-10">VIP{user?.vipLevel || 1}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-14 h-10 bg-red-500/90 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">Total balance</span>
          <button type="button" onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? (
              <Eye className="w-4 h-4 text-white/70" />
            ) : (
              <EyeOff className="w-4 h-4 text-white/70" />
            )}
          </button>
        </div>
        <div className="text-white text-4xl font-bold mt-1">
          {showBalance ? (user?.balance?.toFixed(2) || "0.00") : "***"} <span className="text-2xl font-normal">USD</span>
        </div>
      </div>

      {showWalletActions ? (
        <div className="mt-6 flex justify-between relative z-10">
          {walletActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-900 font-bold">{action.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="w-full mt-6 bg-black/80 text-white py-4 rounded-full font-semibold text-lg hover:bg-black transition-colors relative z-10"
        >
          Start
        </button>
      )}
    </div>
  );
}